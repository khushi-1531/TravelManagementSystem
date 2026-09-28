package com.travelsphere.controller;

import com.travelsphere.dto.request.*;
import com.travelsphere.dto.response.*;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.PaymentStatus;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // =========================================================================
    // 1. DASHBOARD KPI & METRICS
    // =========================================================================

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboardStats() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard statistics retrieved successfully.", stats));
    }

    // =========================================================================
    // 2. USERS MANAGEMENT
    // =========================================================================

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<UserResponse> response = adminService.getUsers(search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully.", response));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UserResponse response = adminService.updateUserStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully.", response));
    }

    // =========================================================================
    // 3. CATALOGUE — DESTINATIONS
    // =========================================================================

    @GetMapping("/destinations")
    public ResponseEntity<ApiResponse<PageResponse<DestinationResponse>>> getDestinations(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<DestinationResponse> response = adminService.getDestinations(query, page, size);
        return ResponseEntity.ok(ApiResponse.success("Destinations retrieved successfully.", response));
    }

    @PostMapping("/destinations")
    public ResponseEntity<ApiResponse<DestinationResponse>> createDestination(
            @Valid @RequestBody AdminDestinationRequest request) {

        DestinationResponse response = adminService.createDestination(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Destination created successfully.", response));
    }

    @PutMapping("/destinations/{id}")
    public ResponseEntity<ApiResponse<DestinationResponse>> updateDestination(
            @PathVariable Long id,
            @Valid @RequestBody AdminDestinationRequest request) {

        DestinationResponse response = adminService.updateDestination(id, request);
        return ResponseEntity.ok(ApiResponse.success("Destination updated successfully.", response));
    }

    @DeleteMapping("/destinations/{id}")
    public ResponseEntity<ApiResponse<DestinationResponse>> toggleDestinationPublish(
            @PathVariable Long id) {

        DestinationResponse response = adminService.toggleDestinationPublish(id);
        return ResponseEntity.ok(ApiResponse.success("Destination publish status toggled.", response));
    }

    // =========================================================================
    // 4. CATALOGUE — HOTELS
    // =========================================================================

    @GetMapping("/hotels")
    public ResponseEntity<ApiResponse<PageResponse<HotelResponse>>> getHotels(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<HotelResponse> response = adminService.getHotels(destinationId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Hotels retrieved successfully.", response));
    }

    @PostMapping("/hotels")
    public ResponseEntity<ApiResponse<HotelResponse>> createHotel(
            @Valid @RequestBody AdminHotelRequest request) {

        HotelResponse response = adminService.createHotel(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hotel created successfully.", response));
    }

    @PutMapping("/hotels/{id}")
    public ResponseEntity<ApiResponse<HotelResponse>> updateHotel(
            @PathVariable Long id,
            @Valid @RequestBody AdminHotelRequest request) {

        HotelResponse response = adminService.updateHotel(id, request);
        return ResponseEntity.ok(ApiResponse.success("Hotel updated successfully.", response));
    }

    @DeleteMapping("/hotels/{id}")
    public ResponseEntity<ApiResponse<HotelResponse>> toggleHotelActive(
            @PathVariable Long id) {

        HotelResponse response = adminService.toggleHotelActive(id);
        return ResponseEntity.ok(ApiResponse.success("Hotel active status toggled.", response));
    }

    // =========================================================================
    // 5. CATALOGUE — HOLIDAY PACKAGES
    // =========================================================================

    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getPackages(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PackageResponse> response = adminService.getPackages(destinationId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Packages retrieved successfully.", response));
    }

    @PostMapping("/packages")
    public ResponseEntity<ApiResponse<PackageResponse>> createPackage(
            @Valid @RequestBody AdminPackageRequest request) {

        PackageResponse response = adminService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Package created successfully.", response));
    }

    @PutMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody AdminPackageRequest request) {

        PackageResponse response = adminService.updatePackage(id, request);
        return ResponseEntity.ok(ApiResponse.success("Package updated successfully.", response));
    }

    @DeleteMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> togglePackageActive(
            @PathVariable Long id) {

        PackageResponse response = adminService.togglePackageActive(id);
        return ResponseEntity.ok(ApiResponse.success("Package active status toggled.", response));
    }

    // =========================================================================
    // 6. BOOKINGS ADMINISTRATION
    // =========================================================================

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<BookingResponse> response = adminService.getBookings(status, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully.", response));
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminBookingStatusRequest request) {

        BookingResponse response = adminService.updateBookingStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated successfully.", response));
    }

    // =========================================================================
    // 7. PAYMENTS AUDIT
    // =========================================================================

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<PageResponse<PaymentAttemptResponse>>> getPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PaymentAttemptResponse> response = adminService.getPayments(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Payment records retrieved successfully.", response));
    }

    // =========================================================================
    // 8. REVIEWS MODERATION
    // =========================================================================

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviews(
            @RequestParam(required = false) TargetType targetType,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<ReviewResponse> response = adminService.getReviews(targetType, rating, page, size);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully.", response));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        adminService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully by administrator.", null));
    }
}
