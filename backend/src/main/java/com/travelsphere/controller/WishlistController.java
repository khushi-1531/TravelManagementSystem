package com.travelsphere.controller;

import com.travelsphere.dto.request.WishlistRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.WishlistCheckResponse;
import com.travelsphere.dto.response.WishlistItemResponse;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Get all wishlisted items for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistItemResponse>>> getWishlist(
            @RequestParam(required = false) TargetType type,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<WishlistItemResponse> response = wishlistService.getUserWishlist(type, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Wishlist retrieved successfully.", response));
    }

    /**
     * Add an item to the authenticated user's wishlist.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WishlistItemResponse>> addToWishlist(
            @Valid @RequestBody WishlistRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        WishlistItemResponse response = wishlistService.addToWishlist(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to wishlist successfully.", response));
    }

    /**
     * Remove an item from the wishlist by wishlist record ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        wishlistService.removeFromWishlist(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Item removed from wishlist successfully.", null));
    }

    /**
     * Remove an item from the wishlist by targetType and targetId (convenient toggle).
     */
    @DeleteMapping("/target/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<Void>> removeByTarget(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        wishlistService.removeByTarget(targetType, targetId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Item removed from wishlist successfully.", null));
    }

    /**
     * Check if a specific catalogue item is wishlisted by the current user.
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<WishlistCheckResponse>> checkWishlist(
            @RequestParam TargetType targetType,
            @RequestParam Long targetId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        WishlistCheckResponse response = wishlistService.checkWishlistStatus(targetType, targetId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Wishlist status checked.", response));
    }

    /**
     * Get set of target keys ("DESTINATION:1", "HOTEL:2") for fast batch card state.
     */
    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<Set<String>>> getWishlistTargetKeys(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Set<String> response = wishlistService.getUserWishlistTargetKeys(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Wishlist target keys retrieved.", response));
    }
}
