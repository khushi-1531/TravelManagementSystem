package com.travelsphere.service;

import com.travelsphere.dto.response.DestinationResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.entity.Destination;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.DestinationRepository;
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
public class DestinationService {

    private final DestinationRepository destinationRepository;

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 50;

    @Transactional(readOnly = true)
    public PageResponse<DestinationResponse> getDestinations(
            String query, String country, String state, Boolean featured, int page, int size, String sortParam) {

        validatePagination(page, size);
        int effectiveSize = Math.min(size, MAX_SIZE);
        Sort sort = resolveSort(sortParam);
        Pageable pageable = PageRequest.of(page, effectiveSize, sort);

        Specification<Destination> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isPublished")));

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                Predicate stateMatch = cb.like(cb.lower(root.get("state")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch, stateMatch));
            }

            if (StringUtils.hasText(country)) {
                predicates.add(cb.equal(cb.lower(root.get("country")), country.trim().toLowerCase()));
            }

            if (StringUtils.hasText(state)) {
                predicates.add(cb.equal(cb.lower(root.get("state")), state.trim().toLowerCase()));
            }

            if (featured != null) {
                predicates.add(cb.equal(root.get("isFeatured"), featured));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Destination> pageResult = destinationRepository.findAll(spec, pageable);
        List<DestinationResponse> content = pageResult.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.from(pageResult, content);
    }

    @Transactional(readOnly = true)
    public DestinationResponse getDestinationById(String idOrUuid) {
        if (!StringUtils.hasText(idOrUuid)) {
            throw new BadRequestException("Destination identifier is required");
        }

        Destination destination;
        if (idOrUuid.matches("^\\d+$")) {
            Long id = Long.parseLong(idOrUuid);
            destination = destinationRepository.findByIdAndIsPublishedTrue(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", id));
        } else {
            destination = destinationRepository.findByUuidAndIsPublishedTrue(idOrUuid.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination", "uuid", idOrUuid));
        }

        return mapToResponse(destination);
    }

    @Transactional(readOnly = true)
    public DestinationResponse getDestinationBySlug(String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new BadRequestException("Slug cannot be empty");
        }

        Destination destination = destinationRepository.findBySlugAndIsPublishedTrue(slug.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "slug", slug));

        return mapToResponse(destination);
    }

    @Transactional(readOnly = true)
    public List<com.travelsphere.dto.response.NearbyDestinationResponse> getNearbyDestinations(
            Double latitude, Double longitude, Double radiusKm, Integer limit) {

        com.travelsphere.util.GeoUtils.validateCoordinates(latitude, longitude);
        double effectiveRadius = com.travelsphere.util.GeoUtils.validateAndResolveRadius(
                radiusKm, 200.0, 1000.0);
        int effectiveLimit = limit != null && limit > 0 ? Math.min(limit, 50) : 10;

        List<Destination> candidates = destinationRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsPublished()))
                .toList();

        List<com.travelsphere.dto.response.NearbyDestinationResponse> nearbyList = new ArrayList<>();

        for (Destination d : candidates) {
            if (d.getLatitude() == null || d.getLongitude() == null) {
                continue;
            }

            double distance = com.travelsphere.util.GeoUtils.haversineDistanceKm(
                    latitude, longitude,
                    d.getLatitude().doubleValue(), d.getLongitude().doubleValue()
            );

            if (distance <= effectiveRadius) {
                nearbyList.add(com.travelsphere.dto.response.NearbyDestinationResponse.from(mapToResponse(d), distance));
            }
        }

        nearbyList.sort(java.util.Comparator.comparingDouble(com.travelsphere.dto.response.NearbyDestinationResponse::getDistanceKm));

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
            return Sort.by(Sort.Direction.DESC, "isFeatured").and(Sort.by(Sort.Direction.ASC, "name"));
        }

        return switch (sortParam.trim().toLowerCase()) {
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            case "featured_desc" -> Sort.by(Sort.Direction.DESC, "isFeatured").and(Sort.by(Sort.Direction.ASC, "name"));
            case "created_desc" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> throw new BadRequestException("Invalid sort parameter: " + sortParam + ". Allowed: name_asc, name_desc, featured_desc, created_desc");
        };
    }

    public DestinationResponse mapToResponse(Destination d) {
        return DestinationResponse.builder()
                .id(d.getId())
                .uuid(d.getUuid())
                .name(d.getName())
                .slug(d.getSlug())
                .state(d.getState())
                .country(d.getCountry())
                .description(d.getDescription())
                .climate(d.getClimate())
                .bestTimeToVisit(d.getBestTimeToVisit())
                .heroImageUrl(d.getHeroImageUrl())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .isFeatured(Boolean.TRUE.equals(d.getIsFeatured()))
                .isPublished(Boolean.TRUE.equals(d.getIsPublished()))
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
