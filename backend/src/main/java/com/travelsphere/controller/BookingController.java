package com.travelsphere.controller;

import com.travelsphere.dto.request.CreateBookingRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.BookingResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking reservation (Package or Hotel Room).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        BookingResponse response = bookingService.createBooking(request, currentUser);
        return new ResponseEntity<>(
                ApiResponse.success("Booking created successfully.", response),
                HttpStatus.CREATED
        );
    }

    /**
     * Retrieve paginated bookings for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PageResponse<BookingResponse> response = bookingService.getUserBookings(currentUser, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully.", response));
    }

    /**
     * Retrieve details for a specific booking by ID (ownership enforced).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        BookingResponse response = bookingService.getBookingDetails(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Booking details retrieved successfully.", response));
    }

    /**
     * Cancel an active booking (ownership enforced).
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        BookingResponse response = bookingService.cancelBooking(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully.", response));
    }
}
