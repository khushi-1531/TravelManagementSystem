package com.travelsphere.service;

import com.travelsphere.dto.request.ReviewRequest;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.dto.response.RatingSummaryResponse;
import com.travelsphere.dto.response.ReviewResponse;
import com.travelsphere.entity.Review;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.exception.DuplicateResourceException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.exception.UnauthorizedException;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.ReviewRepository;
import com.travelsphere.repository.TravelPackageRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final HotelRepository hotelRepository;
    private final TravelPackageRepository travelPackageRepository;

    /**
     * Submit a new review for a destination, hotel, or package.
     */
    @Transactional
    public ReviewResponse createReview(TargetType targetType, Long targetId, ReviewRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to submit a review.");
        }

        validateTargetExists(targetType, targetId);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        // Enforce one review per user per catalogue target
        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), targetType, targetId)) {
            throw new DuplicateResourceException("You have already submitted a review for this " 
                    + targetType.name().toLowerCase() + ". You can update your existing review.");
        }

        Review review = new Review();
        review.setUser(user);
        review.setTargetType(targetType);
        review.setTargetId(targetId);
        review.setRating(request.getRating());
        review.setHeadline(request.getHeadline() != null ? request.getHeadline().trim() : null);
        review.setReviewText(request.getReviewText().trim());

        Review saved = reviewRepository.save(review);
        log.info("User id={} created review id={} for target {} id={}", user.getId(), saved.getId(), targetType, targetId);

        return mapToResponse(saved, currentUser);
    }

    /**
     * Update an existing review. Ownership is strictly enforced.
     */
    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to update a review.");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(currentUser.getId()) && !currentUser.isAdmin()) {
            throw new ForbiddenException("You do not have permission to update this review.");
        }

        review.setRating(request.getRating());
        review.setHeadline(request.getHeadline() != null ? request.getHeadline().trim() : null);
        review.setReviewText(request.getReviewText().trim());

        Review updated = reviewRepository.save(review);
        log.info("User id={} updated review id={}", currentUser.getId(), updated.getId());

        return mapToResponse(updated, currentUser);
    }

    /**
     * Delete an existing review. Ownership is strictly enforced.
     */
    @Transactional
    public void deleteReview(Long reviewId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to delete a review.");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(currentUser.getId()) && !currentUser.isAdmin()) {
            throw new ForbiddenException("You do not have permission to delete this review.");
        }

        reviewRepository.delete(review);
        log.info("User id={} deleted review id={}", currentUser.getId(), reviewId);
    }

    /**
     * Get paginated reviews for a target catalogue item.
     */
    public PageResponse<ReviewResponse> getReviews(TargetType targetType, Long targetId,
                                                  int page, int size, String sortParam,
                                                  UserPrincipal currentUser) {
        validateTargetExists(targetType, targetId);

        int validatedPage = Math.max(0, page);
        int validatedSize = Math.min(Math.max(1, size), 50);

        Sort sort = switch (sortParam != null ? sortParam.toLowerCase() : "newest") {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "highest" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "lowest" -> Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(validatedPage, validatedSize, sort);
        Page<Review> reviewPage = reviewRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);

        List<ReviewResponse> mapped = reviewPage.getContent().stream()
                .map(r -> mapToResponse(r, currentUser))
                .collect(Collectors.toList());

        return PageResponse.from(reviewPage, mapped);
    }

    /**
     * Authoritative rating summary for a target catalogue item.
     */
    public RatingSummaryResponse getRatingSummary(TargetType targetType, Long targetId) {
        validateTargetExists(targetType, targetId);

        Double avgRating = reviewRepository.calculateAverageRating(targetType, targetId);
        Long totalReviews = reviewRepository.countByTargetTypeAndTargetId(targetType, targetId);

        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            distribution.put(star, 0L);
        }

        List<Object[]> rows = reviewRepository.getRatingDistribution(targetType, targetId);
        if (rows != null) {
            for (Object[] row : rows) {
                Integer rating = ((Number) row[0]).intValue();
                Long count = ((Number) row[1]).longValue();
                distribution.put(rating, count);
            }
        }

        Double roundedAverage = 0.0;
        if (avgRating != null) {
            roundedAverage = Math.round(avgRating * 10.0) / 10.0;
        }

        return RatingSummaryResponse.builder()
                .targetType(targetType)
                .targetId(targetId)
                .averageRating(roundedAverage)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .ratingDistribution(distribution)
                .build();
    }

    /**
     * Check if the authenticated user has already reviewed this target item.
     */
    public Optional<ReviewResponse> getMyReviewForTarget(TargetType targetType, Long targetId, UserPrincipal currentUser) {
        if (currentUser == null) {
            return Optional.empty();
        }

        return reviewRepository.findByUserIdAndTargetTypeAndTargetId(currentUser.getId(), targetType, targetId)
                .map(r -> mapToResponse(r, currentUser));
    }

    /**
     * Get all reviews created by the authenticated user.
     */
    public PageResponse<ReviewResponse> getMyReviews(UserPrincipal currentUser, int page, int size) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to view your reviews.");
        }

        int validatedPage = Math.max(0, page);
        int validatedSize = Math.min(Math.max(1, size), 50);
        Pageable pageable = PageRequest.of(validatedPage, validatedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviewPage = reviewRepository.findByUserId(currentUser.getId(), pageable);
        List<ReviewResponse> mapped = reviewPage.getContent().stream()
                .map(r -> mapToResponse(r, currentUser))
                .collect(Collectors.toList());

        return PageResponse.from(reviewPage, mapped);
    }

    private void validateTargetExists(TargetType targetType, Long targetId) {
        boolean exists = switch (targetType) {
            case DESTINATION -> destinationRepository.existsById(targetId);
            case HOTEL -> hotelRepository.existsById(targetId);
            case PACKAGE -> travelPackageRepository.existsById(targetId);
        };

        if (!exists) {
            throw new ResourceNotFoundException(targetType.name(), "id", targetId);
        }
    }

    private ReviewResponse mapToResponse(Review review, UserPrincipal currentUser) {
        boolean isOwner = currentUser != null && currentUser.getId().equals(review.getUser().getId());
        String reviewerName = review.getUser().getFullName();
        if (reviewerName == null || reviewerName.isBlank()) {
            reviewerName = review.getUser().getUsername();
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .targetType(review.getTargetType())
                .targetId(review.getTargetId())
                .rating(review.getRating())
                .headline(review.getHeadline())
                .reviewText(review.getReviewText())
                .userId(review.getUser().getId())
                .reviewerName(reviewerName)
                .reviewerUsername(review.getUser().getUsername())
                .isOwner(isOwner)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
