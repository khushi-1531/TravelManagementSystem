package com.travelsphere.service;

import com.travelsphere.config.RazorpayProperties;
import com.travelsphere.dto.request.CreatePaymentOrderRequest;
import com.travelsphere.dto.request.PaymentFailureRequest;
import com.travelsphere.dto.request.VerifyPaymentRequest;
import com.travelsphere.dto.response.PaymentAttemptResponse;
import com.travelsphere.dto.response.PaymentOrderResponse;
import com.travelsphere.dto.response.PaymentVerificationResponse;
import com.travelsphere.entity.Booking;
import com.travelsphere.entity.PaymentAttempt;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.PaymentStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.BookingRepository;
import com.travelsphere.repository.PaymentAttemptRepository;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final RazorpayGatewayClient razorpayGatewayClient;
    private final RazorpaySignatureService razorpaySignatureService;
    private final RazorpayProperties razorpayProperties;

    /**
     * Create a new payment order for a booking.
     * Determines amount strictly from the backend database record.
     */
    @Transactional
    public PaymentOrderResponse createPaymentOrder(CreatePaymentOrderRequest request, UserPrincipal currentUser) {
        Booking booking = locateAndAuthorizeBooking(request.getBookingReference(), request.getBookingId(), currentUser);

        // State validation
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot initiate payment for a cancelled booking.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Booking has already been completed.");
        }

        // Idempotency check: verify booking is not already paid
        boolean alreadyPaid = paymentAttemptRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if (alreadyPaid || booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("This booking has already been paid and confirmed.");
        }

        // Retrieve authoritative price from database
        BigDecimal totalAmount = booking.getTotalAmount();
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid booking amount. Payment cannot be initiated.");
        }

        // Convert to subunits (e.g. paise for INR: 1500.00 -> 150000)
        long amountInSubunits = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();
        String currency = (booking.getCurrency() != null && !booking.getCurrency().isBlank())
                ? booking.getCurrency() : "INR";

        String attemptReference = UUID.randomUUID().toString();

        // Create order on Razorpay Gateway (or sandbox simulator)
        String orderId = razorpayGatewayClient.createOrder(
                amountInSubunits,
                currency,
                attemptReference,
                booking.getBookingReference()
        );

        boolean isDemo = orderId.startsWith("order_sim_") || orderId.startsWith("order_demo_");

        // Record payment attempt
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setAttemptReference(attemptReference);
        attempt.setBooking(booking);
        attempt.setProvider(isDemo ? "DEMO" : "RAZORPAY");
        attempt.setRazorpayOrderId(orderId);
        attempt.setAmount(totalAmount);
        attempt.setCurrency(currency);
        attempt.setStatus(PaymentStatus.INITIATED);
        if (isDemo) {
            attempt.setPaymentMethod("DEMO_PAYMENT");
        }

        paymentAttemptRepository.save(attempt);

        // Update booking status to PAYMENT_PENDING if currently PENDING
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.PAYMENT_PENDING);
            bookingRepository.save(booking);
        }

        log.info("Created payment order {} for booking {} with attempt reference {} (demoMode={})",
                orderId, booking.getBookingReference(), attemptReference, isDemo);

        return PaymentOrderResponse.builder()
                .attemptReference(attemptReference)
                .orderId(orderId)
                .amountInSubunits(amountInSubunits)
                .totalAmount(totalAmount)
                .currency(currency)
                .keyId(isDemo ? null : razorpayProperties.getKeyId())
                .bookingReference(booking.getBookingReference())
                .bookingType(booking.getBookingType() != null ? booking.getBookingType().name() : null)
                .demoMode(isDemo)
                .build();
    }

    /**
     * Cryptographically verify Razorpay signature and capture payment.
     * Enforces single-success idempotency and transitions booking to CONFIRMED.
     */
    @Transactional
    public PaymentVerificationResponse verifyPayment(VerifyPaymentRequest request, UserPrincipal currentUser) {
        // Locate payment attempt
        PaymentAttempt attempt = paymentAttemptRepository.findByAttemptReference(request.getAttemptReference())
                .or(() -> paymentAttemptRepository.findByRazorpayOrderId(request.getRazorpayOrderId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment attempt not found for reference: " + request.getAttemptReference()));

        Booking booking = attempt.getBooking();
        verifyBookingOwnership(booking, currentUser);

        // Idempotency: If this exact attempt was already verified successfully
        if (attempt.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment attempt {} already confirmed; returning idempotent response.", attempt.getAttemptReference());
            return PaymentVerificationResponse.builder()
                    .bookingReference(booking.getBookingReference())
                    .bookingStatus(booking.getStatus().name())
                    .paymentStatus(PaymentStatus.SUCCESS.name())
                    .paymentId(attempt.getRazorpayPaymentId())
                    .attemptReference(attempt.getAttemptReference())
                    .paidAt(attempt.getPaidAt())
                    .build();
        }

        // Duplicate payment check: If booking is already confirmed by another attempt
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            log.warn("Booking {} is already confirmed by another payment attempt.", booking.getBookingReference());
            throw new BadRequestException("This booking is already confirmed.");
        }

        // Cryptographic HMAC-SHA256 signature verification or Demo Mode verification
        boolean isDemoAttempt = "DEMO".equalsIgnoreCase(attempt.getProvider())
                || (attempt.getRazorpayOrderId() != null && (attempt.getRazorpayOrderId().startsWith("order_sim_") || attempt.getRazorpayOrderId().startsWith("order_demo_")));

        boolean isValidSignature;
        if (isDemoAttempt) {
            log.info("Processing demo payment verification for booking {} and attempt {}",
                    booking.getBookingReference(), attempt.getAttemptReference());
            isValidSignature = request.getRazorpayOrderId() != null
                    && request.getRazorpayOrderId().equals(attempt.getRazorpayOrderId())
                    && request.getRazorpayPaymentId() != null
                    && !request.getRazorpayPaymentId().isBlank()
                    && request.getRazorpaySignature() != null
                    && !request.getRazorpaySignature().isBlank();
        } else {
            isValidSignature = razorpaySignatureService.verifySignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature()
            );
        }

        if (!isValidSignature) {
            attempt.setStatus(PaymentStatus.FAILED);
            attempt.setFailureReason(isDemoAttempt
                    ? "Demo payment verification failed: mismatched order ID or missing signature."
                    : "Cryptographic signature verification mismatch.");
            paymentAttemptRepository.save(attempt);

            log.warn("Payment verification failed for booking {}. Invalid signature (isDemo={}).",
                    booking.getBookingReference(), isDemoAttempt);
            throw new BadRequestException("Invalid payment signature. Verification failed.");
        }

        // Signature is authentic: update attempt and booking
        LocalDateTime now = LocalDateTime.now();
        attempt.setRazorpayPaymentId(request.getRazorpayPaymentId());
        attempt.setRazorpaySignature(request.getRazorpaySignature());
        attempt.setStatus(PaymentStatus.SUCCESS);
        attempt.setPaidAt(now);
        paymentAttemptRepository.save(attempt);

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Payment successfully verified for booking {}. Payment ID: {}",
                booking.getBookingReference(), request.getRazorpayPaymentId());

        return PaymentVerificationResponse.builder()
                .bookingReference(booking.getBookingReference())
                .bookingStatus(BookingStatus.CONFIRMED.name())
                .paymentStatus(PaymentStatus.SUCCESS.name())
                .paymentId(request.getRazorpayPaymentId())
                .attemptReference(attempt.getAttemptReference())
                .paidAt(now)
                .build();
    }

    /**
     * Handle payment failure or user dismissal.
     * Records failure diagnostics while keeping the booking open for retries.
     */
    @Transactional
    public PaymentAttemptResponse handlePaymentFailure(PaymentFailureRequest request, UserPrincipal currentUser) {
        PaymentAttempt attempt = paymentAttemptRepository.findByAttemptReference(request.getAttemptReference())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment attempt not found for reference: " + request.getAttemptReference()));

        verifyBookingOwnership(attempt.getBooking(), currentUser);

        if (attempt.getStatus() == PaymentStatus.INITIATED || attempt.getStatus() == PaymentStatus.PENDING) {
            attempt.setStatus(PaymentStatus.FAILED);
            String reason = (request.getFailureReason() != null && !request.getFailureReason().isBlank())
                    ? request.getFailureReason()
                    : "Payment was cancelled or dismissed by the user.";
            attempt.setFailureReason(reason);
            paymentAttemptRepository.save(attempt);

            log.info("Payment attempt {} marked as FAILED. Reason: {}", attempt.getAttemptReference(), reason);
        }

        return mapToAttemptResponse(attempt);
    }

    /**
     * List all payment attempts for a booking by reference or ID.
     */
    @Transactional(readOnly = true)
    public List<PaymentAttemptResponse> getBookingPaymentAttempts(String bookingIdentifier, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findByBookingReference(bookingIdentifier)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(bookingIdentifier);
                        return bookingRepository.findById(id).orElse(null);
                    } catch (NumberFormatException ignored) {
                        return null;
                    }
                });

        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found for reference or ID: " + bookingIdentifier);
        }

        verifyBookingOwnership(booking, currentUser);

        return paymentAttemptRepository.findByBookingId(booking.getId())
                .stream()
                .map(this::mapToAttemptResponse)
                .collect(Collectors.toList());
    }

    private Booking locateAndAuthorizeBooking(String bookingReference, Long bookingId, UserPrincipal currentUser) {
        Booking booking = null;
        if (bookingReference != null && !bookingReference.isBlank()) {
            booking = bookingRepository.findByBookingReference(bookingReference).orElse(null);
        }
        if (booking == null && bookingId != null) {
            booking = bookingRepository.findById(bookingId).orElse(null);
        }
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found for provided reference or ID.");
        }

        verifyBookingOwnership(booking, currentUser);
        return booking;
    }

    private void verifyBookingOwnership(Booking booking, UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (booking.getUser() == null || !booking.getUser().getId().equals(currentUser.getId()))) {
            throw new ForbiddenException("You do not have permission to access or pay for this booking.");
        }
    }

    private PaymentAttemptResponse mapToAttemptResponse(PaymentAttempt attempt) {
        return PaymentAttemptResponse.builder()
                .id(attempt.getId())
                .attemptReference(attempt.getAttemptReference())
                .bookingReference(attempt.getBooking() != null ? attempt.getBooking().getBookingReference() : null)
                .provider(attempt.getProvider())
                .razorpayOrderId(attempt.getRazorpayOrderId())
                .razorpayPaymentId(attempt.getRazorpayPaymentId())
                .amount(attempt.getAmount())
                .currency(attempt.getCurrency())
                .paymentMethod(attempt.getPaymentMethod())
                .status(attempt.getStatus() != null ? attempt.getStatus().name() : null)
                .failureReason(attempt.getFailureReason())
                .paidAt(attempt.getPaidAt())
                .createdAt(attempt.getCreatedAt())
                .build();
    }
}
