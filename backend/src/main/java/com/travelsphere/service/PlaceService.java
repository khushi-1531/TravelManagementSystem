package com.travelsphere.service;

import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.dto.response.PlaceResponse;
import com.travelsphere.entity.Place;
import com.travelsphere.entity.enums.PlaceCategory;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.PlaceRepository;
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

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 50;

    @Transactional(readOnly = true)
    public PageResponse<PlaceResponse> getPlaces(
            Long destinationId, PlaceCategory category, String query, int page, int size, String sortParam) {

        validatePagination(page, size);
        int effectiveSize = Math.min(size, MAX_SIZE);
        Sort sort = resolveSort(sortParam);
        Pageable pageable = PageRequest.of(page, effectiveSize, sort);

        Specification<Place> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (destinationId != null) {
                predicates.add(cb.equal(root.get("destination").get("id"), destinationId));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Place> pageResult = placeRepository.findAll(spec, pageable);
        List<PlaceResponse> content = pageResult.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.from(pageResult, content);
    }

    @Transactional(readOnly = true)
    public PlaceResponse getPlaceById(Long id) {
        if (id == null || id <= 0) {
            throw new BadRequestException("Valid place ID is required");
        }

        Place place = placeRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place", "id", id));

        return mapToResponse(place);
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> getPlacesByDestination(Long destinationId) {
        if (destinationId == null || destinationId <= 0) {
            throw new BadRequestException("Valid destination ID is required");
        }

        return placeRepository.findByDestinationIdAndIsActiveTrue(destinationId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.travelsphere.dto.response.NearbyPlaceResponse> getNearbyPlaces(
            Double latitude, Double longitude, Double radiusKm, PlaceCategory category, Integer limit) {

        com.travelsphere.util.GeoUtils.validateCoordinates(latitude, longitude);
        double effectiveRadius = com.travelsphere.util.GeoUtils.validateAndResolveRadius(
                radiusKm, com.travelsphere.util.GeoUtils.DEFAULT_RADIUS_KM, com.travelsphere.util.GeoUtils.MAX_RADIUS_KM);
        int effectiveLimit = limit != null && limit > 0 ? Math.min(limit, 50) : 20;

        List<Place> candidates = category != null
                ? placeRepository.findByCategoryAndIsActiveTrue(category)
                : placeRepository.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getIsActive())).toList();

        List<com.travelsphere.dto.response.NearbyPlaceResponse> nearbyList = new ArrayList<>();

        for (Place p : candidates) {
            if (p.getLatitude() == null || p.getLongitude() == null) {
                continue;
            }

            double distance = com.travelsphere.util.GeoUtils.haversineDistanceKm(
                    latitude, longitude,
                    p.getLatitude().doubleValue(), p.getLongitude().doubleValue()
            );

            if (distance <= effectiveRadius) {
                nearbyList.add(com.travelsphere.dto.response.NearbyPlaceResponse.from(mapToResponse(p), distance));
            }
        }

        nearbyList.sort(java.util.Comparator.comparingDouble(com.travelsphere.dto.response.NearbyPlaceResponse::getDistanceKm));

        if (nearbyList.size() > effectiveLimit) {
            return nearbyList.subList(0, effectiveLimit);
        }
        return nearbyList;
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Page index must not be less than zero");
        }
        if (size < 1) {
            throw new BadRequestException("Page size must not be less than one");
        }
    }

    private Sort resolveSort(String sortParam) {
        if (!StringUtils.hasText(sortParam)) {
            return Sort.by(Sort.Direction.ASC, "name");
        }

        return switch (sortParam.trim().toLowerCase()) {
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            case "fee_asc" -> Sort.by(Sort.Direction.ASC, "entryFee");
            case "fee_desc" -> Sort.by(Sort.Direction.DESC, "entryFee");
            default -> throw new BadRequestException("Invalid sort parameter: " + sortParam + ". Allowed: name_asc, name_desc, fee_asc, fee_desc");
        };
    }

    public PlaceResponse mapToResponse(Place p) {
        return PlaceResponse.builder()
                .id(p.getId())
                .destinationId(p.getDestination() != null ? p.getDestination().getId() : null)
                .destinationName(p.getDestination() != null ? p.getDestination().getName() : null)
                .name(p.getName())
                .category(p.getCategory() != null ? p.getCategory().name() : null)
                .description(p.getDescription())
                .entryFee(p.getEntryFee())
                .openingTime(p.getOpeningTime())
                .closingTime(p.getClosingTime())
                .imageUrl(p.getImageUrl())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .isActive(Boolean.TRUE.equals(p.getIsActive()))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
