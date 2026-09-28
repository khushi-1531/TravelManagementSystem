package com.travelsphere.service;

import com.travelsphere.dto.response.HotelResponse;
import com.travelsphere.dto.response.HotelRoomResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.entity.Hotel;
import com.travelsphere.entity.HotelRoom;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.HotelRoomRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;
    private final HotelRoomRepository hotelRoomRepository;
    private final DestinationRepository destinationRepository;

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 50;

    @Transactional(readOnly = true)
    public PageResponse<HotelResponse> getHotels(
            Long destinationId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            BigDecimal minRating,
            String query,
            int page,
            int size,
            String sortParam) {

        validatePagination(page, size);

        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("INVALID_PRICE_RANGE", "minPrice cannot be greater than maxPrice");
        }

        int effectiveSize = Math.min(size, MAX_SIZE);
        Sort sort = resolveSort(sortParam);
        Pageable pageable = PageRequest.of(page, effectiveSize, sort);

        Specification<Hotel> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (destinationId != null) {
                predicates.add(cb.equal(root.get("destination").get("id"), destinationId));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startingPricePerNight"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startingPricePerNight"), maxPrice));
            }

            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("starRating"), minRating));
            }

            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate addressMatch = cb.like(cb.lower(root.get("address")), pattern);
                predicates.add(cb.or(nameMatch, descMatch, addressMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Hotel> hotelPage = hotelRepository.findAll(spec, pageable);
        List<HotelResponse> dtos = hotelPage.getContent().stream()
                .map(this::mapToResponseWithoutRooms)
                .collect(Collectors.toList());

        return PageResponse.from(hotelPage, dtos);
    }

    @Transactional(readOnly = true)
    public HotelResponse getHotelById(String identifier) {
        Hotel hotel = findActiveHotel(identifier);
        List<HotelRoom> activeRooms = hotelRoomRepository.findByHotelIdAndIsActiveTrue(hotel.getId());
        List<HotelRoomResponse> roomDtos = activeRooms.stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());

        HotelResponse response = mapToResponseWithoutRooms(hotel);
        response.setRooms(roomDtos);
        return response;
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> getHotelsByDestination(Long destinationId) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new ResourceNotFoundException("Destination not found with id: " + destinationId);
        }
        return hotelRepository.findByDestinationIdAndIsActiveTrue(destinationId).stream()
                .map(this::mapToResponseWithoutRooms)
                .collect(Collectors.toList());
    }

    private Hotel findActiveHotel(String identifier) {
        try {
            Long id = Long.parseLong(identifier);
            Optional<Hotel> opt = hotelRepository.findByIdAndIsActiveTrue(id);
            if (opt.isPresent()) {
                return opt.get();
            }
        } catch (NumberFormatException ignored) {
            // Identifier is UUID
        }

        return hotelRepository.findByUuidAndIsActiveTrue(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with identifier: " + identifier));
    }

    public HotelResponse mapToResponseWithoutRooms(Hotel hotel) {
        return HotelResponse.builder()
                .id(hotel.getId())
                .uuid(hotel.getUuid())
                .destinationId(hotel.getDestination() != null ? hotel.getDestination().getId() : null)
                .destinationName(hotel.getDestination() != null ? hotel.getDestination().getName() : null)
                .name(hotel.getName())
                .starRating(hotel.getStarRating())
                .address(hotel.getAddress())
                .contactPhone(hotel.getContactPhone())
                .contactEmail(hotel.getContactEmail())
                .heroImageUrl(hotel.getHeroImageUrl())
                .description(hotel.getDescription())
                .startingPricePerNight(hotel.getStartingPricePerNight())
                .hasSwimmingPool(hotel.getHasSwimmingPool())
                .hasWifi(hotel.getHasWifi())
                .hasParking(hotel.getHasParking())
                .hasRestaurant(hotel.getHasRestaurant())
                .latitude(hotel.getLatitude() != null ? hotel.getLatitude() : (hotel.getDestination() != null ? hotel.getDestination().getLatitude() : null))
                .longitude(hotel.getLongitude() != null ? hotel.getLongitude() : (hotel.getDestination() != null ? hotel.getDestination().getLongitude() : null))
                .isActive(hotel.getIsActive())
                .createdAt(hotel.getCreatedAt())
                .updatedAt(hotel.getUpdatedAt())
                .build();
    }

    public HotelRoomResponse mapToRoomResponse(HotelRoom room) {
        return HotelRoomResponse.builder()
                .id(room.getId())
                .hotelId(room.getHotel() != null ? room.getHotel().getId() : null)
                .hotelName(room.getHotel() != null ? room.getHotel().getName() : null)
                .roomType(room.getRoomType() != null ? room.getRoomType().name() : null)
                .maxOccupancy(room.getMaxOccupancy())
                .hasAc(room.getHasAc())
                .isBreakfastIncluded(room.getIsBreakfastIncluded())
                .pricePerNight(room.getPricePerNight())
                .totalInventory(room.getTotalInventory())
                .availableInventory(room.getAvailableInventory())
                .isActive(room.getIsActive())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("INVALID_PAGINATION", "Page index cannot be negative");
        }
        if (size < 1) {
            throw new BadRequestException("INVALID_PAGINATION", "Page size must be at least 1");
        }
    }

    private Sort resolveSort(String sortParam) {
        if (!StringUtils.hasText(sortParam)) {
            return Sort.by(Sort.Direction.DESC, "starRating");
        }
        return switch (sortParam.trim().toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "startingPricePerNight");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "startingPricePerNight");
            case "rating_desc" -> Sort.by(Sort.Direction.DESC, "starRating");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "starRating");
        };
    }
}
