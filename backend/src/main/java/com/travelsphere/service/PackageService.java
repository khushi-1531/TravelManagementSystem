package com.travelsphere.service;

import com.travelsphere.dto.response.PackageItemResponse;
import com.travelsphere.dto.response.PackageResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.entity.PackageItem;
import com.travelsphere.entity.TravelPackage;
import com.travelsphere.entity.enums.PackageTier;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.PackageItemRepository;
import com.travelsphere.repository.TravelPackageRepository;
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
public class PackageService {

    private final TravelPackageRepository packageRepository;
    private final PackageItemRepository packageItemRepository;
    private final DestinationRepository destinationRepository;

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 50;

    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getPackages(
            Long destinationId,
            PackageTier tier,
            Integer durationDays,
            BigDecimal minPrice,
            BigDecimal maxPrice,
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

        Specification<TravelPackage> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (destinationId != null) {
                predicates.add(cb.equal(root.get("destination").get("id"), destinationId));
            }

            if (tier != null) {
                predicates.add(cb.equal(root.get("tier"), tier));
            }

            if (durationDays != null) {
                predicates.add(cb.equal(root.get("durationDays"), durationDays));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePricePerPerson"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePricePerPerson"), maxPrice));
            }

            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate incMatch = cb.like(cb.lower(root.get("inclusions")), pattern);
                Predicate excMatch = cb.like(cb.lower(root.get("exclusions")), pattern);
                predicates.add(cb.or(titleMatch, incMatch, excMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<TravelPackage> packagePage = packageRepository.findAll(spec, pageable);
        List<PackageResponse> dtos = packagePage.getContent().stream()
                .map(this::mapToResponseWithoutItems)
                .collect(Collectors.toList());

        return PageResponse.from(packagePage, dtos);
    }

    @Transactional(readOnly = true)
    public PackageResponse getPackageById(String identifier) {
        TravelPackage travelPackage = findActivePackage(identifier);
        List<PackageItem> items = packageItemRepository.findByTravelPackageIdOrderByDayNumberAsc(travelPackage.getId());
        List<PackageItemResponse> itemDtos = items.stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());

        PackageResponse response = mapToResponseWithoutItems(travelPackage);
        response.setItems(itemDtos);
        return response;
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getPackagesByDestination(Long destinationId) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new ResourceNotFoundException("Destination not found with id: " + destinationId);
        }
        return packageRepository.findByDestinationIdAndIsActiveTrue(destinationId).stream()
                .map(this::mapToResponseWithoutItems)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PackageItemResponse> getPackageItems(Long packageId) {
        if (!packageRepository.existsById(packageId)) {
            throw new ResourceNotFoundException("Travel package not found with id: " + packageId);
        }
        return packageItemRepository.findByTravelPackageIdOrderByDayNumberAsc(packageId).stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());
    }

    private TravelPackage findActivePackage(String identifier) {
        try {
            Long id = Long.parseLong(identifier);
            Optional<TravelPackage> opt = packageRepository.findByIdAndIsActiveTrue(id);
            if (opt.isPresent()) {
                return opt.get();
            }
        } catch (NumberFormatException ignored) {
            // Identifier is UUID
        }

        return packageRepository.findByUuidAndIsActiveTrue(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Travel package not found with identifier: " + identifier));
    }

    public PackageResponse mapToResponseWithoutItems(TravelPackage travelPackage) {
        return PackageResponse.builder()
                .id(travelPackage.getId())
                .uuid(travelPackage.getUuid())
                .destinationId(travelPackage.getDestination() != null ? travelPackage.getDestination().getId() : null)
                .destinationName(travelPackage.getDestination() != null ? travelPackage.getDestination().getName() : null)
                .title(travelPackage.getTitle())
                .tier(travelPackage.getTier() != null ? travelPackage.getTier().name() : null)
                .durationDays(travelPackage.getDurationDays())
                .durationNights(travelPackage.getDurationNights())
                .basePricePerPerson(travelPackage.getBasePricePerPerson())
                .heroImageUrl(travelPackage.getHeroImageUrl())
                .inclusions(travelPackage.getInclusions())
                .exclusions(travelPackage.getExclusions())
                .isActive(travelPackage.getIsActive())
                .createdAt(travelPackage.getCreatedAt())
                .updatedAt(travelPackage.getUpdatedAt())
                .build();
    }

    public PackageItemResponse mapToItemResponse(PackageItem item) {
        return PackageItemResponse.builder()
                .id(item.getId())
                .packageId(item.getTravelPackage() != null ? item.getTravelPackage().getId() : null)
                .dayNumber(item.getDayNumber())
                .activityTitle(item.getActivityTitle())
                .activityDescription(item.getActivityDescription())
                .isMealsIncluded(item.getIsMealsIncluded())
                .createdAt(item.getCreatedAt())
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
            return Sort.by(Sort.Direction.ASC, "basePricePerPerson");
        }
        return switch (sortParam.trim().toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePricePerPerson");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePricePerPerson");
            case "duration_asc" -> Sort.by(Sort.Direction.ASC, "durationDays");
            case "duration_desc" -> Sort.by(Sort.Direction.DESC, "durationDays");
            case "title_asc", "name_asc" -> Sort.by(Sort.Direction.ASC, "title");
            default -> Sort.by(Sort.Direction.ASC, "basePricePerPerson");
        };
    }
}
