package com.travelsphere.service;

import com.travelsphere.dto.request.AdminBookingStatusRequest;
import com.travelsphere.dto.request.AdminDestinationRequest;
import com.travelsphere.dto.request.AdminHotelRequest;
import com.travelsphere.dto.request.AdminPackageRequest;
import com.travelsphere.dto.request.AdminUserStatusRequest;
import com.travelsphere.dto.response.*;
import com.travelsphere.entity.*;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.PaymentStatus;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.entity.enums.UserStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
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
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final DestinationRepository destinationRepository;
    private final HotelRepository hotelRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final BookingRepository bookingRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;

    private final BookingService bookingService;
    private final DestinationService destinationService;
    private final HotelService hotelService;
    private final PackageService packageService;

    // =========================================================================
    // 1. DASHBOARD OVERVIEW & METRICS
    // =========================================================================

    public AdminDashboardStatsResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalDestinations = destinationRepository.count();
        long totalHotels = hotelRepository.count();
        long totalPackages = travelPackageRepository.count();
        long totalBookings = bookingRepository.count();
        long totalReviews = reviewRepository.count();
        long totalWishlists = wishlistRepository.count();
        BigDecimal totalRevenue = bookingRepository.calculateTotalRevenue();

        // Status counts for bookings
        Map<String, Long> bookingCounts = new LinkedHashMap<>();
        for (BookingStatus bs : BookingStatus.values()) {
            bookingCounts.put(bs.name(), 0L);
        }
        List<Object[]> bookingRows = bookingRepository.countBookingsByStatus();
        if (bookingRows != null) {
            for (Object[] r : bookingRows) {
                if (r[0] != null && r[1] != null) {
                    bookingCounts.put(((BookingStatus) r[0]).name(), ((Number) r[1]).longValue());
                }
            }
        }

        // Status counts for payments
        Map<String, Long> paymentCounts = new LinkedHashMap<>();
        for (PaymentStatus ps : PaymentStatus.values()) {
            paymentCounts.put(ps.name(), 0L);
        }
        List<Object[]> paymentRows = paymentAttemptRepository.countPaymentsByStatus();
        if (paymentRows != null) {
            for (Object[] r : paymentRows) {
                if (r[0] != null && r[1] != null) {
                    paymentCounts.put(((PaymentStatus) r[0]).name(), ((Number) r[1]).longValue());
                }
            }
        }

        // Recent 5 bookings
        Pageable recent5 = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<BookingResponse> recentBookings = bookingRepository.findAll(recent5).getContent()
                .stream().map(bookingService::mapToBookingResponse).collect(Collectors.toList());

        // Recent 5 payments
        List<PaymentAttemptResponse> recentPayments = paymentAttemptRepository.findAll(recent5).getContent()
                .stream().map(this::mapToPaymentResponse).collect(Collectors.toList());

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalDestinations(totalDestinations)
                .totalHotels(totalHotels)
                .totalPackages(totalPackages)
                .totalBookings(totalBookings)
                .totalReviews(totalReviews)
                .totalWishlists(totalWishlists)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .bookingStatusCounts(bookingCounts)
                .paymentStatusCounts(paymentCounts)
                .recentBookings(recentBookings)
                .recentPayments(recentPayments)
                .build();
    }

    // =========================================================================
    // 2. USER MANAGEMENT
    // =========================================================================

    public PageResponse<UserResponse> getUsers(String search, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> userPage;
        if (StringUtils.hasText(search)) {
            String term = search.trim();
            userPage = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                    term, term, term, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserResponse> content = userPage.getContent().stream()
                .map(u -> {
                    CustomerProfile profile = customerProfileRepository.findByUserId(u.getId()).orElse(null);
                    return AuthService.mapToUserResponse(u, profile);
                })
                .collect(Collectors.toList());

        return PageResponse.from(userPage, content);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, AdminUserStatusRequest request, UserPrincipal currentUser) {
        if (currentUser.getId().equals(userId) && request.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("You cannot suspend your own administrator account.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(request.getStatus());
        User saved = userRepository.save(user);
        log.info("Admin id={} updated status of user id={} to {}", currentUser.getId(), userId, request.getStatus());

        CustomerProfile profile = customerProfileRepository.findByUserId(saved.getId()).orElse(null);
        return AuthService.mapToUserResponse(saved, profile);
    }

    // =========================================================================
    // 3. CATALOGUE — DESTINATIONS
    // =========================================================================

    public PageResponse<DestinationResponse> getDestinations(String query, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Destination> pageResult = destinationRepository.findAll(pageable);
        List<DestinationResponse> content = pageResult.getContent().stream()
                .map(destinationService::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    @Transactional
    public DestinationResponse createDestination(AdminDestinationRequest req) {
        Destination d = new Destination();
        d.setName(req.getName().trim());
        d.setSlug(generateSlug(req.getName().trim()));
        d.setState(req.getState().trim());
        d.setCountry(req.getCountry().trim());
        d.setDescription(req.getDescription().trim());
        d.setClimate(req.getClimate() != null ? req.getClimate().trim() : null);
        d.setBestTimeToVisit(req.getBestTimeToVisit() != null ? req.getBestTimeToVisit().trim() : null);
        d.setHeroImageUrl(req.getHeroImageUrl().trim());
        d.setLatitude(req.getLatitude());
        d.setLongitude(req.getLongitude());
        d.setIsFeatured(Boolean.TRUE.equals(req.getIsFeatured()));
        d.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : true);

        Destination saved = destinationRepository.save(d);
        log.info("Admin created destination id={} name='{}'", saved.getId(), saved.getName());
        return destinationService.mapToResponse(saved);
    }

    @Transactional
    public DestinationResponse updateDestination(Long id, AdminDestinationRequest req) {
        Destination d = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", id));

        d.setName(req.getName().trim());
        d.setState(req.getState().trim());
        d.setCountry(req.getCountry().trim());
        d.setDescription(req.getDescription().trim());
        d.setClimate(req.getClimate() != null ? req.getClimate().trim() : null);
        d.setBestTimeToVisit(req.getBestTimeToVisit() != null ? req.getBestTimeToVisit().trim() : null);
        d.setHeroImageUrl(req.getHeroImageUrl().trim());
        d.setLatitude(req.getLatitude());
        d.setLongitude(req.getLongitude());
        if (req.getIsFeatured() != null) d.setIsFeatured(req.getIsFeatured());
        if (req.getIsPublished() != null) d.setIsPublished(req.getIsPublished());

        Destination saved = destinationRepository.save(d);
        log.info("Admin updated destination id={}", saved.getId());
        return destinationService.mapToResponse(saved);
    }

    @Transactional
    public DestinationResponse toggleDestinationPublish(Long id) {
        Destination d = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", id));

        d.setIsPublished(!Boolean.TRUE.equals(d.getIsPublished()));
        Destination saved = destinationRepository.save(d);
        log.info("Admin toggled publish state of destination id={} to {}", id, saved.getIsPublished());
        return destinationService.mapToResponse(saved);
    }

    // =========================================================================
    // 4. CATALOGUE — HOTELS
    // =========================================================================

    public PageResponse<HotelResponse> getHotels(Long destinationId, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Hotel> pageResult = destinationId != null
                ? hotelRepository.findAll((root, cq, cb) -> cb.equal(root.get("destination").get("id"), destinationId), pageable)
                : hotelRepository.findAll(pageable);

        List<HotelResponse> content = pageResult.getContent().stream()
                .map(hotelService::mapToResponseWithoutRooms)
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    @Transactional
    public HotelResponse createHotel(AdminHotelRequest req) {
        Destination destination = destinationRepository.findById(req.getDestinationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", req.getDestinationId()));

        Hotel h = new Hotel();
        h.setDestination(destination);
        h.setName(req.getName().trim());
        if (req.getStarRating() != null) h.setStarRating(req.getStarRating());
        h.setAddress(req.getAddress().trim());
        h.setContactPhone(req.getContactPhone() != null ? req.getContactPhone().trim() : null);
        h.setContactEmail(req.getContactEmail() != null ? req.getContactEmail().trim() : null);
        h.setHeroImageUrl(req.getHeroImageUrl().trim());
        h.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        h.setStartingPricePerNight(req.getStartingPricePerNight());
        h.setHasSwimmingPool(Boolean.TRUE.equals(req.getHasSwimmingPool()));
        h.setHasWifi(req.getHasWifi() != null ? req.getHasWifi() : true);
        h.setHasParking(req.getHasParking() != null ? req.getHasParking() : true);
        h.setHasRestaurant(req.getHasRestaurant() != null ? req.getHasRestaurant() : true);
        h.setLatitude(req.getLatitude());
        h.setLongitude(req.getLongitude());
        h.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        Hotel saved = hotelRepository.save(h);
        log.info("Admin created hotel id={} name='{}'", saved.getId(), saved.getName());
        return hotelService.mapToResponseWithoutRooms(saved);
    }

    @Transactional
    public HotelResponse updateHotel(Long id, AdminHotelRequest req) {
        Hotel h = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", "id", id));

        if (!h.getDestination().getId().equals(req.getDestinationId())) {
            Destination destination = destinationRepository.findById(req.getDestinationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", req.getDestinationId()));
            h.setDestination(destination);
        }

        h.setName(req.getName().trim());
        if (req.getStarRating() != null) h.setStarRating(req.getStarRating());
        h.setAddress(req.getAddress().trim());
        h.setContactPhone(req.getContactPhone() != null ? req.getContactPhone().trim() : null);
        h.setContactEmail(req.getContactEmail() != null ? req.getContactEmail().trim() : null);
        h.setHeroImageUrl(req.getHeroImageUrl().trim());
        h.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        h.setStartingPricePerNight(req.getStartingPricePerNight());
        if (req.getHasSwimmingPool() != null) h.setHasSwimmingPool(req.getHasSwimmingPool());
        if (req.getHasWifi() != null) h.setHasWifi(req.getHasWifi());
        if (req.getHasParking() != null) h.setHasParking(req.getHasParking());
        if (req.getHasRestaurant() != null) h.setHasRestaurant(req.getHasRestaurant());
        if (req.getLatitude() != null) h.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) h.setLongitude(req.getLongitude());
        if (req.getIsActive() != null) h.setIsActive(req.getIsActive());

        Hotel saved = hotelRepository.save(h);
        log.info("Admin updated hotel id={}", saved.getId());
        return hotelService.mapToResponseWithoutRooms(saved);
    }

    @Transactional
    public HotelResponse toggleHotelActive(Long id) {
        Hotel h = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", "id", id));

        h.setIsActive(!Boolean.TRUE.equals(h.getIsActive()));
        Hotel saved = hotelRepository.save(h);
        log.info("Admin toggled active state of hotel id={} to {}", id, saved.getIsActive());
        return hotelService.mapToResponseWithoutRooms(saved);
    }

    // =========================================================================
    // 5. CATALOGUE — HOLIDAY PACKAGES
    // =========================================================================

    public PageResponse<PackageResponse> getPackages(Long destinationId, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<TravelPackage> pageResult = destinationId != null
                ? travelPackageRepository.findAll((root, cq, cb) -> cb.equal(root.get("destination").get("id"), destinationId), pageable)
                : travelPackageRepository.findAll(pageable);

        List<PackageResponse> content = pageResult.getContent().stream()
                .map(packageService::mapToResponseWithoutItems)
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    @Transactional
    public PackageResponse createPackage(AdminPackageRequest req) {
        Destination destination = destinationRepository.findById(req.getDestinationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", req.getDestinationId()));

        TravelPackage p = new TravelPackage();
        p.setDestination(destination);
        p.setTitle(req.getTitle().trim());
        p.setTier(req.getTier());
        p.setDurationDays(req.getDurationDays());
        p.setDurationNights(req.getDurationNights());
        p.setBasePricePerPerson(req.getBasePricePerPerson());
        p.setHeroImageUrl(req.getHeroImageUrl().trim());
        p.setInclusions(req.getInclusions().trim());
        p.setExclusions(req.getExclusions().trim());
        p.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        TravelPackage saved = travelPackageRepository.save(p);
        log.info("Admin created package id={} title='{}'", saved.getId(), saved.getTitle());
        return packageService.mapToResponseWithoutItems(saved);
    }

    @Transactional
    public PackageResponse updatePackage(Long id, AdminPackageRequest req) {
        TravelPackage p = travelPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TravelPackage", "id", id));

        if (!p.getDestination().getId().equals(req.getDestinationId())) {
            Destination destination = destinationRepository.findById(req.getDestinationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", req.getDestinationId()));
            p.setDestination(destination);
        }

        p.setTitle(req.getTitle().trim());
        p.setTier(req.getTier());
        p.setDurationDays(req.getDurationDays());
        p.setDurationNights(req.getDurationNights());
        p.setBasePricePerPerson(req.getBasePricePerPerson());
        p.setHeroImageUrl(req.getHeroImageUrl().trim());
        p.setInclusions(req.getInclusions().trim());
        p.setExclusions(req.getExclusions().trim());
        if (req.getIsActive() != null) p.setIsActive(req.getIsActive());

        TravelPackage saved = travelPackageRepository.save(p);
        log.info("Admin updated package id={}", saved.getId());
        return packageService.mapToResponseWithoutItems(saved);
    }

    @Transactional
    public PackageResponse togglePackageActive(Long id) {
        TravelPackage p = travelPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TravelPackage", "id", id));

        p.setIsActive(!Boolean.TRUE.equals(p.getIsActive()));
        TravelPackage saved = travelPackageRepository.save(p);
        log.info("Admin toggled active state of package id={} to {}", id, saved.getIsActive());
        return packageService.mapToResponseWithoutItems(saved);
    }

    // =========================================================================
    // 6. BOOKING ADMINISTRATION
    // =========================================================================

    public PageResponse<BookingResponse> getBookings(BookingStatus status, String search, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Booking> pageResult;
        if (status != null && StringUtils.hasText(search)) {
            String term = search.trim();
            pageResult = bookingRepository.searchBookingsByStatus(status, term, pageable);
        } else if (status != null) {
            pageResult = bookingRepository.findByStatus(status, pageable);
        } else if (StringUtils.hasText(search)) {
            String term = search.trim();
            pageResult = bookingRepository.searchBookings(term, pageable);
        } else {
            pageResult = bookingRepository.findAll(pageable);
        }

        List<BookingResponse> content = pageResult.getContent().stream()
                .map(bookingService::mapToBookingResponse)
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, AdminBookingStatusRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        booking.setStatus(request.getStatus());
        Booking saved = bookingRepository.save(booking);
        log.info("Admin updated booking reference={} to status={}", saved.getBookingReference(), request.getStatus());
        return bookingService.mapToBookingResponse(saved);
    }

    // =========================================================================
    // 7. PAYMENTS AUDIT
    // =========================================================================

    public PageResponse<PaymentAttemptResponse> getPayments(PaymentStatus status, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<PaymentAttempt> pageResult = status != null
                ? paymentAttemptRepository.findByStatus(status, pageable)
                : paymentAttemptRepository.findAll(pageable);

        List<PaymentAttemptResponse> content = pageResult.getContent().stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    // =========================================================================
    // 8. REVIEWS MODERATION
    // =========================================================================

    public PageResponse<ReviewResponse> getReviews(TargetType targetType, Integer rating, int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> pageResult;
        if (targetType != null) {
            pageResult = reviewRepository.findByTargetType(targetType, pageable);
        } else if (rating != null) {
            pageResult = reviewRepository.findByRating(rating, pageable);
        } else {
            pageResult = reviewRepository.findAll(pageable);
        }

        List<ReviewResponse> content = pageResult.getContent().stream()
                .map(r -> ReviewResponse.builder()
                        .id(r.getId())
                        .targetType(r.getTargetType())
                        .targetId(r.getTargetId())
                        .rating(r.getRating())
                        .headline(r.getHeadline())
                        .reviewText(r.getReviewText())
                        .userId(r.getUser().getId())
                        .reviewerName(r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getUsername())
                        .reviewerUsername(r.getUser().getUsername())
                        .isOwner(false)
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.from(pageResult, content);
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        reviewRepository.delete(r);
        log.info("Admin deleted review id={} for target {} id={}", reviewId, r.getTargetType(), r.getTargetId());
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private PaymentAttemptResponse mapToPaymentResponse(PaymentAttempt p) {
        return PaymentAttemptResponse.builder()
                .id(p.getId())
                .attemptReference(p.getAttemptReference())
                .bookingReference(p.getBooking() != null ? p.getBooking().getBookingReference() : null)
                .provider(p.getProvider())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .paymentMethod(p.getPaymentMethod())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .failureReason(p.getFailureReason())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String generateSlug(String name) {
        String base = name.toLowerCase().replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", "-");
        if (destinationRepository.findBySlug(base).isPresent()) {
            return base + "-" + UUID.randomUUID().toString().substring(0, 6);
        }
        return base;
    }
}
