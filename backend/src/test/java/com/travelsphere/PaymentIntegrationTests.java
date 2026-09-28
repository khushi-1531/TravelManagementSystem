package com.travelsphere;

import com.travelsphere.config.RazorpayProperties;
import com.travelsphere.dto.request.CreatePaymentOrderRequest;
import com.travelsphere.dto.request.PaymentFailureRequest;
import com.travelsphere.dto.request.VerifyPaymentRequest;
import com.travelsphere.dto.response.PaymentAttemptResponse;
import com.travelsphere.dto.response.PaymentOrderResponse;
import com.travelsphere.dto.response.PaymentVerificationResponse;
import com.travelsphere.entity.Booking;
import com.travelsphere.entity.PaymentAttempt;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.BookingType;
import com.travelsphere.entity.enums.PaymentStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.BookingRepository;
import com.travelsphere.repository.PaymentAttemptRepository;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.PaymentService;
import com.travelsphere.service.RazorpayGatewayClient;
import com.travelsphere.service.RazorpaySignatureService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentIntegrationTests {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    @Mock
    private RazorpayGatewayClient razorpayGatewayClient;

    @Mock
    private RazorpaySignatureService razorpaySignatureService;

    @Mock
    private RazorpayProperties razorpayProperties;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private UserPrincipal testUserPrincipal;
    private User otherUser;
    private UserPrincipal otherUserPrincipal;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("traveler@travelsphere.com");
        testUser.setFullName("Arun Sharma");

        testUserPrincipal = UserPrincipal.builder()
                .id(1L)
                .uuid("test-uuid-1")
                .username("traveler")
                .email("traveler@travelsphere.com")
                .password("secret")
                .status(com.travelsphere.entity.enums.UserStatus.ACTIVE)
                .requiresPasswordChange(false)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("intruder@travelsphere.com");

        otherUserPrincipal = UserPrincipal.builder()
                .id(2L)
                .uuid("test-uuid-2")
                .username("intruder")
                .email("intruder@travelsphere.com")
                .password("secret")
                .status(com.travelsphere.entity.enums.UserStatus.ACTIVE)
                .requiresPasswordChange(false)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        testBooking = new Booking();
        testBooking.setId(100L);
        testBooking.setBookingReference("TS-100200");
        testBooking.setUser(testUser);
        testBooking.setBookingType(BookingType.PACKAGE);
        testBooking.setStatus(BookingStatus.PENDING);
        testBooking.setTotalAmount(new BigDecimal("15000.00"));
        testBooking.setCurrency("INR");
    }

    @Test
    @DisplayName("Should successfully create payment order with authoritative amount in subunits")
    void createPaymentOrder_Success() {
        CreatePaymentOrderRequest request = CreatePaymentOrderRequest.builder()
                .bookingReference("TS-100200")
                .build();

        when(bookingRepository.findByBookingReference("TS-100200")).thenReturn(Optional.of(testBooking));
        when(paymentAttemptRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(false);
        when(razorpayProperties.getKeyId()).thenReturn("rzp_test_public_key");
        when(razorpayGatewayClient.createOrder(eq(1500000L), eq("INR"), any(), eq("TS-100200")))
                .thenReturn("order_RZP987654321");

        PaymentOrderResponse response = paymentService.createPaymentOrder(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals("order_RZP987654321", response.getOrderId());
        assertEquals(1500000L, response.getAmountInSubunits());
        assertEquals(new BigDecimal("15000.00"), response.getTotalAmount());
        assertEquals("INR", response.getCurrency());
        assertEquals("rzp_test_public_key", response.getKeyId());
        assertEquals("TS-100200", response.getBookingReference());

        // Booking status updated to PAYMENT_PENDING
        assertEquals(BookingStatus.PAYMENT_PENDING, testBooking.getStatus());
        verify(paymentAttemptRepository, times(1)).save(any(PaymentAttempt.class));
        verify(bookingRepository, times(1)).save(testBooking);
    }

    @Test
    @DisplayName("Should reject payment order creation if requested by unauthorized user")
    void createPaymentOrder_UnauthorizedUser_ThrowsForbidden() {
        CreatePaymentOrderRequest request = CreatePaymentOrderRequest.builder()
                .bookingReference("TS-100200")
                .build();

        when(bookingRepository.findByBookingReference("TS-100200")).thenReturn(Optional.of(testBooking));

        assertThrows(ForbiddenException.class, () ->
                paymentService.createPaymentOrder(request, otherUserPrincipal));

        verify(razorpayGatewayClient, never()).createOrder(anyLong(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject payment order creation if booking is already paid")
    void createPaymentOrder_AlreadyPaid_ThrowsBadRequest() {
        CreatePaymentOrderRequest request = CreatePaymentOrderRequest.builder()
                .bookingReference("TS-100200")
                .build();

        when(bookingRepository.findByBookingReference("TS-100200")).thenReturn(Optional.of(testBooking));
        when(paymentAttemptRepository.existsByBookingIdAndStatus(100L, PaymentStatus.SUCCESS)).thenReturn(true);

        assertThrows(BadRequestException.class, () ->
                paymentService.createPaymentOrder(request, testUserPrincipal));

        verify(razorpayGatewayClient, never()).createOrder(anyLong(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject payment order creation if booking is cancelled")
    void createPaymentOrder_CancelledBooking_ThrowsBadRequest() {
        testBooking.setStatus(BookingStatus.CANCELLED);
        CreatePaymentOrderRequest request = CreatePaymentOrderRequest.builder()
                .bookingReference("TS-100200")
                .build();

        when(bookingRepository.findByBookingReference("TS-100200")).thenReturn(Optional.of(testBooking));

        assertThrows(BadRequestException.class, () ->
                paymentService.createPaymentOrder(request, testUserPrincipal));
    }

    @Test
    @DisplayName("Should verify valid signature, mark attempt SUCCESS, and CONFIRM booking")
    void verifyPayment_ValidSignature_ConfirmsBooking() {
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setId(10L);
        attempt.setAttemptReference("attempt-uuid-123");
        attempt.setBooking(testBooking);
        attempt.setRazorpayOrderId("order_ABC123");
        attempt.setStatus(PaymentStatus.INITIATED);

        VerifyPaymentRequest request = VerifyPaymentRequest.builder()
                .attemptReference("attempt-uuid-123")
                .razorpayOrderId("order_ABC123")
                .razorpayPaymentId("pay_XYZ789")
                .razorpaySignature("valid_signature_hash")
                .build();

        when(paymentAttemptRepository.findByAttemptReference("attempt-uuid-123")).thenReturn(Optional.of(attempt));
        when(razorpaySignatureService.verifySignature("order_ABC123", "pay_XYZ789", "valid_signature_hash")).thenReturn(true);

        PaymentVerificationResponse response = paymentService.verifyPayment(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals("TS-100200", response.getBookingReference());
        assertEquals("CONFIRMED", response.getBookingStatus());
        assertEquals("SUCCESS", response.getPaymentStatus());
        assertEquals("pay_XYZ789", response.getPaymentId());

        assertEquals(PaymentStatus.SUCCESS, attempt.getStatus());
        assertEquals("pay_XYZ789", attempt.getRazorpayPaymentId());
        assertEquals(BookingStatus.CONFIRMED, testBooking.getStatus());

        verify(paymentAttemptRepository, times(1)).save(attempt);
        verify(bookingRepository, times(1)).save(testBooking);
    }

    @Test
    @DisplayName("Should reject payment verification with invalid signature and record FAILED status")
    void verifyPayment_InvalidSignature_MarksFailedAndThrowsBadRequest() {
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setId(10L);
        attempt.setAttemptReference("attempt-uuid-123");
        attempt.setBooking(testBooking);
        attempt.setRazorpayOrderId("order_ABC123");
        attempt.setStatus(PaymentStatus.INITIATED);

        VerifyPaymentRequest request = VerifyPaymentRequest.builder()
                .attemptReference("attempt-uuid-123")
                .razorpayOrderId("order_ABC123")
                .razorpayPaymentId("pay_XYZ789")
                .razorpaySignature("tampered_signature")
                .build();

        when(paymentAttemptRepository.findByAttemptReference("attempt-uuid-123")).thenReturn(Optional.of(attempt));
        when(razorpaySignatureService.verifySignature("order_ABC123", "pay_XYZ789", "tampered_signature")).thenReturn(false);

        assertThrows(BadRequestException.class, () ->
                paymentService.verifyPayment(request, testUserPrincipal));

        assertEquals(PaymentStatus.FAILED, attempt.getStatus());
        assertNotNull(attempt.getFailureReason());
        verify(paymentAttemptRepository, times(1)).save(attempt);
        // Booking must NOT be confirmed
        assertNotEquals(BookingStatus.CONFIRMED, testBooking.getStatus());
    }

    @Test
    @DisplayName("Should provide idempotent response if payment attempt is already verified")
    void verifyPayment_DuplicateAttempt_ReturnsIdempotentResponse() {
        LocalDateTime paidAt = LocalDateTime.now().minusMinutes(5);
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setId(10L);
        attempt.setAttemptReference("attempt-uuid-123");
        attempt.setBooking(testBooking);
        attempt.setRazorpayOrderId("order_ABC123");
        attempt.setRazorpayPaymentId("pay_XYZ789");
        attempt.setStatus(PaymentStatus.SUCCESS);
        attempt.setPaidAt(paidAt);
        testBooking.setStatus(BookingStatus.CONFIRMED);

        VerifyPaymentRequest request = VerifyPaymentRequest.builder()
                .attemptReference("attempt-uuid-123")
                .razorpayOrderId("order_ABC123")
                .razorpayPaymentId("pay_XYZ789")
                .razorpaySignature("signature")
                .build();

        when(paymentAttemptRepository.findByAttemptReference("attempt-uuid-123")).thenReturn(Optional.of(attempt));

        PaymentVerificationResponse response = paymentService.verifyPayment(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getBookingStatus());
        assertEquals("SUCCESS", response.getPaymentStatus());
        assertEquals("pay_XYZ789", response.getPaymentId());

        // Signature service and repos should not be called again
        verify(razorpaySignatureService, never()).verifySignature(any(), any(), any());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should record payment failure when user cancels or gateway fails")
    void handlePaymentFailure_RecordsFailureDiagnostics() {
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setId(10L);
        attempt.setAttemptReference("attempt-uuid-123");
        attempt.setBooking(testBooking);
        attempt.setStatus(PaymentStatus.INITIATED);

        PaymentFailureRequest request = PaymentFailureRequest.builder()
                .attemptReference("attempt-uuid-123")
                .failureReason("User cancelled the payment modal")
                .build();

        when(paymentAttemptRepository.findByAttemptReference("attempt-uuid-123")).thenReturn(Optional.of(attempt));

        PaymentAttemptResponse response = paymentService.handlePaymentFailure(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertEquals("User cancelled the payment modal", response.getFailureReason());
        verify(paymentAttemptRepository, times(1)).save(attempt);
    }
}
