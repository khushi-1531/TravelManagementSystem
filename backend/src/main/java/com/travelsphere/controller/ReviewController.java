package com.travelsphere.controller;

import com.travelsphere.dto.request.ReviewRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.dto.response.RatingSummaryResponse;
import com.travelsphere.dto.response.ReviewResponse;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Public endpoint to get paginated reviews for a target catalogue item.
     */
    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviews(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PageResponse<ReviewResponse> response = reviewService.getReviews(targetType, targetId, page, size, sort, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully.", response));
    }

    /**
     * Public endpoint to get authoritative rating summary and star distribution.
     */
    @GetMapping("/{targetType}/{targetId}/summary")
    public ResponseEntity<ApiResponse<RatingSummaryResponse>> getRatingSummary(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId) {

        RatingSummaryResponse summary = reviewService.getRatingSummary(targetType, targetId);
        return ResponseEntity.ok(ApiResponse.success("Rating summary retrieved successfully.", summary));
    }

    /**
     * Authenticated endpoint to get caller's own review for a specific catalogue item.
     */
    @GetMapping("/{targetType}/{targetId}/me")
    public ResponseEntity<ApiResponse<ReviewResponse>> getMyReviewForTarget(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return reviewService.getMyReviewForTarget(targetType, targetId, currentUser)
                .map(rev -> ResponseEntity.ok(ApiResponse.success("Your review retrieved successfully.", rev)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No review submitted yet by current user.", null)));
    }

    /**
     * Authenticated endpoint to submit a review for a destination, hotel, or package.
     */
    @PostMapping("/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReviewResponse response = reviewService.createReview(targetType, targetId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted successfully.", response));
    }

    /**
     * Authenticated endpoint to update own review.
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReviewResponse response = reviewService.updateReview(reviewId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully.", response));
    }

    /**
     * Authenticated endpoint to delete own review.
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        reviewService.deleteReview(reviewId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully.", null));
    }

    /**
     * Authenticated endpoint to view all reviews written by current user.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PageResponse<ReviewResponse> response = reviewService.getMyReviews(currentUser, page, size);
        return ResponseEntity.ok(ApiResponse.success("Your reviews retrieved successfully.", response));
    }
}
