package com.travelsphere.service;

import com.travelsphere.dto.request.CreateBookingRequest;
import com.travelsphere.dto.response.*;
import com.travelsphere.entity.*;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.BookingType;
import com.travelsphere.entity.enums.PaymentStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.exception.UnauthorizedException;
import com.travelsphere.repository.*;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HotelBookingItemRepository hotelBookingItemRepository;
    private final PackageBookingItemRepository packageBookingItemRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final HotelRoomRepository hotelRoomRepository;
    private final UserRepository userRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;

    private static final String ALPHANUMERIC = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Create a new booking (Holiday Package or Hotel Room).
     * The total amount is strictly calculated on the backend from catalogue pricing.
     */
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (request.getBookingType() == null) {
            throw new BadRequestException("Booking type is required.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBookingType(request.getBookingType());
        booking.setStatus(BookingStatus.PENDING);
        booking.setCurrency("INR");
        booking.setCustomerNotes(request.getCustomerNotes());
        booking.setBookingReference(generateUniqueBookingReference());

        if (request.getBookingType() == BookingType.PACKAGE) {
            processPackageBooking(booking, request);
        } else if (request.getBookingType() == BookingType.HOTEL) {
            processHotelBooking(booking, request);
        } else {
            throw new BadRequestException("Unsupported booking type: " + request.getBookingType());
        }

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking created successfully: reference={}, type={}, user={}", 
                savedBooking.getBookingReference(), savedBooking.getBookingType(), user.getUsername());

        return mapToBookingResponse(savedBooking);
    }

    private void processPackageBooking(Booking booking, CreateBookingRequest request) {
        if (request.getPackageId() == null) {
            throw new BadRequestException("Package ID is required for package bookings.");
        }
        if (request.getStartDate() == null) {
            throw new BadRequestException("Travel start date is required.");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Travel start date cannot be in the past.");
        }

        int guestsCount = (request.getGuestsCount() != null && request.getGuestsCount() > 0) 
                ? request.getGuestsCount() : 1;

        TravelPackage travelPackage = travelPackageRepository.findByIdAndIsActiveTrue(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Travel Package", "id", request.getPackageId()));

        BigDecimal unitPrice = travelPackage.getBasePricePerPerson();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(guestsCount));

        booking.setTotalAmount(subtotal);

        PackageBookingItem item = new PackageBookingItem();
        item.setTravelPackage(travelPackage);
        item.setStartDate(request.getStartDate());
        item.setGuestsCount(guestsCount);
        item.setUnitPrice(unitPrice);
        item.setSubtotal(subtotal);

        booking.addPackageBookingItem(item);
    }

    private void processHotelBooking(Booking booking, CreateBookingRequest request) {
        if (request.getHotelRoomId() == null) {
            throw new BadRequestException("Hotel room ID is required for hotel bookings.");
        }
        if (request.getCheckInDate() == null || request.getCheckOutDate() == null) {
            throw new BadRequestException("Check-in and check-out dates are required.");
        }
        if (request.getCheckInDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Check-in date cannot be in the past.");
        }
        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new BadRequestException("Check-out date must be after check-in date.");
        }

        int roomsCount = (request.getRoomsCount() != null && request.getRoomsCount() > 0) 
                ? request.getRoomsCount() : 1;
        int guestsCount = (request.getGuestsCount() != null && request.getGuestsCount() > 0) 
                ? request.getGuestsCount() : 1;

        // Apply pessimistic lock to room inventory row to prevent concurrent race condition
        HotelRoom hotelRoom = hotelRoomRepository.findByIdWithLock(request.getHotelRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel Room", "id", request.getHotelRoomId()));

        if (!Boolean.TRUE.equals(hotelRoom.getIsActive())) {
            throw new BadRequestException("The selected room type is currently inactive.");
        }

        // Validate max occupancy per room
        int maxCapacity = hotelRoom.getMaxOccupancy() * roomsCount;
        if (guestsCount > maxCapacity) {
            throw new BadRequestException(String.format(
                    "Selected %d room(s) can accommodate at most %d guests (requested: %d).",
                    roomsCount, maxCapacity, guestsCount));
        }

        Long currentlyBooked = hotelBookingItemRepository.countBookedRooms(
                hotelRoom.getId(), request.getCheckInDate(), request.getCheckOutDate());
        int bookedCount = currentlyBooked != null ? currentlyBooked.intValue() : 0;
        int availableRooms = hotelRoom.getTotalInventory() - bookedCount;

        if (roomsCount > availableRooms) {
            throw new BadRequestException(String.format(
                    "Insufficient room inventory for the selected dates. Requested: %d, Available: %d.",
                    roomsCount, Math.max(0, availableRooms)));
        }

        long nights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        BigDecimal pricePerNight = hotelRoom.getPricePerNight();
        BigDecimal subtotal = pricePerNight
                .multiply(BigDecimal.valueOf(roomsCount))
                .multiply(BigDecimal.valueOf(nights));

        booking.setTotalAmount(subtotal);

        HotelBookingItem item = new HotelBookingItem();
        item.setHotelRoom(hotelRoom);
        item.setCheckInDate(request.getCheckInDate());
        item.setCheckOutDate(request.getCheckOutDate());
        item.setRoomsCount(roomsCount);
        item.setGuestsCount(guestsCount);
        item.setPricePerNight(pricePerNight);
        item.setSubtotal(subtotal);

        booking.addHotelBookingItem(item);
    }

    /**
     * Retrieve paginated bookings owned by the authenticated user.
     */
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getUserBookings(
            UserPrincipal currentUser, BookingStatus status, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Booking> bookingPage;

        if (status != null) {
            bookingPage = bookingRepository.findByUserIdAndStatus(currentUser.getId(), status, pageable);
        } else {
            bookingPage = bookingRepository.findByUserId(currentUser.getId(), pageable);
        }

        List<BookingResponse> content = bookingPage.getContent().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());

        return PageResponse.from(bookingPage, content);
    }

    /**
     * Retrieve a specific booking by ID, strictly enforcing user ownership.
     */
    @Transactional(readOnly = true)
    public BookingResponse getBookingDetails(Long id, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        validateOwnership(booking, currentUser);
        return mapToBookingResponse(booking);
    }

    /**
     * Cancel an eligible booking (PENDING, PAYMENT_PENDING, or CONFIRMED).
     */
    @Transactional
    public BookingResponse cancelBooking(Long id, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        validateOwnership(booking, currentUser);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("This booking is already cancelled.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Completed bookings cannot be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);

        log.info("Booking cancelled: reference={}, user={}", 
                updatedBooking.getBookingReference(), currentUser.getUsername());

        return mapToBookingResponse(updatedBooking);
    }

    private void validateOwnership(Booking booking, UserPrincipal currentUser) {
        if (!booking.getUser().getId().equals(currentUser.getId()) && !currentUser.isAdmin()) {
            throw new ForbiddenException("You do not have permission to access or modify this booking.");
        }
    }

    /**
     * Generate human-friendly unique booking reference in the format TS-XXXXXX.
     */
    private String generateUniqueBookingReference() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("TS-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            String ref = sb.toString();
            if (!bookingRepository.existsByBookingReference(ref)) {
                return ref;
            }
        }
        // Fallback with timestamp
        return "TS-" + System.currentTimeMillis() % 1000000;
    }

    /**
     * Map Booking entity to rich response DTO.
     */
    public BookingResponse mapToBookingResponse(Booking booking) {
        // Resolve payment status from payment attempts
        String paymentStatus = "UNPAID";
        List<PaymentAttempt> attempts = paymentAttemptRepository.findByBookingId(booking.getId());
        if (attempts != null && !attempts.isEmpty()) {
            boolean hasSuccess = attempts.stream().anyMatch(a -> a.getStatus() == PaymentStatus.SUCCESS);
            if (hasSuccess) {
                paymentStatus = "PAID";
            } else {
                paymentStatus = attempts.get(attempts.size() - 1).getStatus().name();
            }
        }

        List<PackageBookingItemResponse> packageItems = booking.getPackageBookingItems() != null
                ? booking.getPackageBookingItems().stream().map(item -> {
                    TravelPackage pkg = item.getTravelPackage();
                    return PackageBookingItemResponse.builder()
                            .id(item.getId())
                            .packageId(pkg != null ? pkg.getId() : null)
                            .packageTitle(pkg != null ? pkg.getTitle() : "Travel Package")
                            .destinationName(pkg != null && pkg.getDestination() != null ? pkg.getDestination().getName() : null)
                            .heroImageUrl(pkg != null ? pkg.getHeroImageUrl() : null)
                            .tier(pkg != null && pkg.getTier() != null ? pkg.getTier().name() : null)
                            .durationDays(pkg != null ? pkg.getDurationDays() : null)
                            .durationNights(pkg != null ? pkg.getDurationNights() : null)
                            .startDate(item.getStartDate())
                            .guestsCount(item.getGuestsCount())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(item.getSubtotal())
                            .build();
                }).collect(Collectors.toList())
                : Collections.emptyList();

        List<HotelBookingItemResponse> hotelItems = booking.getHotelBookingItems() != null
                ? booking.getHotelBookingItems().stream().map(item -> {
                    HotelRoom room = item.getHotelRoom();
                    Hotel hotel = room != null ? room.getHotel() : null;
                    long totalNights = (item.getCheckInDate() != null && item.getCheckOutDate() != null)
                            ? ChronoUnit.DAYS.between(item.getCheckInDate(), item.getCheckOutDate()) : 1;

                    return HotelBookingItemResponse.builder()
                            .id(item.getId())
                            .hotelId(hotel != null ? hotel.getId() : null)
                            .hotelName(hotel != null ? hotel.getName() : "Hotel Stay")
                            .destinationName(hotel != null && hotel.getDestination() != null ? hotel.getDestination().getName() : null)
                            .hotelRoomId(room != null ? room.getId() : null)
                            .roomType(room != null && room.getRoomType() != null ? room.getRoomType().name() : null)
                            .heroImageUrl(hotel != null ? hotel.getHeroImageUrl() : null)
                            .checkInDate(item.getCheckInDate())
                            .checkOutDate(item.getCheckOutDate())
                            .totalNights(totalNights)
                            .roomsCount(item.getRoomsCount())
                            .guestsCount(item.getGuestsCount())
                            .pricePerNight(item.getPricePerNight())
                            .subtotal(item.getSubtotal())
                            .build();
                }).collect(Collectors.toList())
                : Collections.emptyList();

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .userId(booking.getUser() != null ? booking.getUser().getId() : null)
                .userFullName(booking.getUser() != null ? booking.getUser().getFullName() : null)
                .userEmail(booking.getUser() != null ? booking.getUser().getEmail() : null)
                .bookingType(booking.getBookingType() != null ? booking.getBookingType().name() : null)
                .status(booking.getStatus() != null ? booking.getStatus().name() : BookingStatus.PENDING.name())
                .paymentStatus(paymentStatus)
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency() != null ? booking.getCurrency() : "INR")
                .customerNotes(booking.getCustomerNotes())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .packageItems(packageItems)
                .hotelItems(hotelItems)
                .build();
    }
}
