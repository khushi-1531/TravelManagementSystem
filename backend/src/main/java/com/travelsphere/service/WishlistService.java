package com.travelsphere.service;

import com.travelsphere.dto.request.WishlistRequest;
import com.travelsphere.dto.response.WishlistCheckResponse;
import com.travelsphere.dto.response.WishlistItemResponse;
import com.travelsphere.entity.Destination;
import com.travelsphere.entity.Hotel;
import com.travelsphere.entity.TravelPackage;
import com.travelsphere.entity.User;
import com.travelsphere.entity.Wishlist;
import com.travelsphere.entity.enums.TargetType;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.exception.UnauthorizedException;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.TravelPackageRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.repository.WishlistRepository;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final HotelRepository hotelRepository;
    private final TravelPackageRepository travelPackageRepository;

    /**
     * Add an item to the authenticated user's wishlist (idempotent).
     */
    @Transactional
    public WishlistItemResponse addToWishlist(WishlistRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to add items to your wishlist.");
        }

        TargetType targetType = request.getTargetType();
        Long targetId = request.getTargetId();
        validateTargetExists(targetType, targetId);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        // Check if already in wishlist
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndTargetTypeAndTargetId(user.getId(), targetType, targetId);
        if (existing.isPresent()) {
            return hydrateItem(existing.get());
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setTargetType(targetType);
        wishlist.setTargetId(targetId);

        Wishlist saved = wishlistRepository.save(wishlist);
        log.info("User id={} added {} id={} to wishlist", user.getId(), targetType, targetId);

        return hydrateItem(saved);
    }

    /**
     * Remove an item from the wishlist by wishlist record ID.
     */
    @Transactional
    public void removeFromWishlist(Long wishlistId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to modify your wishlist.");
        }

        Wishlist item = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist item", "id", wishlistId));

        if (!item.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You do not have permission to remove this wishlist item.");
        }

        wishlistRepository.delete(item);
        log.info("User id={} removed wishlist item id={}", currentUser.getId(), wishlistId);
    }

    /**
     * Remove an item from the wishlist by targetType and targetId (convenient toggle).
     */
    @Transactional
    public void removeByTarget(TargetType targetType, Long targetId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to modify your wishlist.");
        }

        wishlistRepository.deleteByUserIdAndTargetTypeAndTargetId(currentUser.getId(), targetType, targetId);
        log.info("User id={} removed target {} id={} from wishlist", currentUser.getId(), targetType, targetId);
    }

    /**
     * Get all wishlisted items for the current user, optionally filtered by target type.
     */
    public List<WishlistItemResponse> getUserWishlist(TargetType filterType, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to view your wishlist.");
        }

        List<Wishlist> rawList = wishlistRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        List<WishlistItemResponse> result = new ArrayList<>();

        for (Wishlist w : rawList) {
            if (filterType != null && w.getTargetType() != filterType) {
                continue;
            }
            WishlistItemResponse hydrated = hydrateItem(w);
            if (hydrated != null) {
                result.add(hydrated);
            }
        }

        return result;
    }

    /**
     * Check whether a specific catalogue item is currently wishlisted.
     */
    public WishlistCheckResponse checkWishlistStatus(TargetType targetType, Long targetId, UserPrincipal currentUser) {
        if (currentUser == null) {
            return new WishlistCheckResponse(false, null);
        }

        Optional<Wishlist> item = wishlistRepository.findByUserIdAndTargetTypeAndTargetId(currentUser.getId(), targetType, targetId);
        return item.map(w -> new WishlistCheckResponse(true, w.getId()))
                .orElseGet(() -> new WishlistCheckResponse(false, null));
    }

    /**
     * Get a set of wishlisted target keys ("DESTINATION:1", "HOTEL:4") for fast batch card state.
     */
    public Set<String> getUserWishlistTargetKeys(UserPrincipal currentUser) {
        if (currentUser == null) {
            return Collections.emptySet();
        }

        return wishlistRepository.findByUserId(currentUser.getId()).stream()
                .map(w -> w.getTargetType().name() + ":" + w.getTargetId())
                .collect(Collectors.toSet());
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

    private WishlistItemResponse hydrateItem(Wishlist w) {
        switch (w.getTargetType()) {
            case DESTINATION: {
                Optional<Destination> destOpt = destinationRepository.findById(w.getTargetId());
                if (destOpt.isEmpty()) return null;
                Destination d = destOpt.get();
                String location = (d.getState() != null ? d.getState() + ", " : "") + d.getCountry();
                return WishlistItemResponse.builder()
                        .id(w.getId())
                        .targetType(w.getTargetType())
                        .targetId(w.getTargetId())
                        .title(d.getName())
                        .imageUrl(d.getHeroImageUrl())
                        .location(location)
                        .price(null)
                        .rating(null)
                        .linkUrl("/destinations/" + d.getId())
                        .createdAt(w.getCreatedAt())
                        .build();
            }
            case HOTEL: {
                Optional<Hotel> hotelOpt = hotelRepository.findById(w.getTargetId());
                if (hotelOpt.isEmpty()) return null;
                Hotel h = hotelOpt.get();
                String location = h.getDestination() != null ? h.getDestination().getName() : h.getAddress();
                Double rating = h.getStarRating() != null ? h.getStarRating().doubleValue() : null;
                return WishlistItemResponse.builder()
                        .id(w.getId())
                        .targetType(w.getTargetType())
                        .targetId(w.getTargetId())
                        .title(h.getName())
                        .imageUrl(h.getHeroImageUrl())
                        .location(location)
                        .price(h.getStartingPricePerNight())
                        .rating(rating)
                        .linkUrl("/hotels/" + h.getId())
                        .createdAt(w.getCreatedAt())
                        .build();
            }
            case PACKAGE: {
                Optional<TravelPackage> pkgOpt = travelPackageRepository.findById(w.getTargetId());
                if (pkgOpt.isEmpty()) return null;
                TravelPackage p = pkgOpt.get();
                String location = p.getDestination() != null ? p.getDestination().getName() : "Various Locations";
                return WishlistItemResponse.builder()
                        .id(w.getId())
                        .targetType(w.getTargetType())
                        .targetId(w.getTargetId())
                        .title(p.getTitle())
                        .imageUrl(p.getHeroImageUrl())
                        .location(location)
                        .price(p.getBasePricePerPerson())
                        .rating(null)
                        .linkUrl("/packages/" + p.getId())
                        .createdAt(w.getCreatedAt())
                        .build();
            }
            default:
                return null;
        }
    }
}
