package com.travelsphere.controller;

import com.travelsphere.dto.request.CreatePaymentOrderRequest;
import com.travelsphere.dto.request.PaymentFailureRequest;
import com.travelsphere.dto.request.VerifyPaymentRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.PaymentAttemptResponse;
import com.travelsphere.dto.response.PaymentOrderResponse;
import com.travelsphere.dto.response.PaymentVerificationResponse;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for payment order creation, cryptographic verification, and audit logs.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create a payment order for an unpaid booking.
     * Computes the authoritative amount from the database.
     */
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> createPaymentOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PaymentOrderResponse response = paymentService.createPaymentOrder(request, currentUser);
        return new ResponseEntity<>(
                ApiResponse.success("Payment order created successfully.", response),
                HttpStatus.CREATED
        );
    }

    /**
     * Verify payment signature and capture payment, transitioning booking to CONFIRMED.
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PaymentVerificationResponse response = paymentService.verifyPayment(request, currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Payment verified and booking confirmed successfully.", response)
        );
    }

    /**
     * Record a failed or dismissed payment attempt.
     */
    @PostMapping("/fail")
    public ResponseEntity<ApiResponse<PaymentAttemptResponse>> handlePaymentFailure(
            @Valid @RequestBody PaymentFailureRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PaymentAttemptResponse response = paymentService.handlePaymentFailure(request, currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Payment failure recorded.", response)
        );
    }

    /**
     * Retrieve payment attempts audit history for a booking.
     */
    @GetMapping("/booking/{bookingReference}/attempts")
    public ResponseEntity<ApiResponse<List<PaymentAttemptResponse>>> getBookingPaymentAttempts(
            @PathVariable String bookingReference,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<PaymentAttemptResponse> response = paymentService.getBookingPaymentAttempts(bookingReference, currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Payment attempts retrieved successfully.", response)
        );
    }
}
