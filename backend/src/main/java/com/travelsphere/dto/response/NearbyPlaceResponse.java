package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Place response enriched with calculated distance from requested coordinates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NearbyPlaceResponse {
    private Long id;
    private Long destinationId;
    private String destinationName;
    private String name;
    private String category;
    private String description;
    private BigDecimal entryFee;
    private String openingTime;
    private String closingTime;
    private String imageUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Double distanceKm;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NearbyPlaceResponse from(PlaceResponse p, Double distanceKm) {
        return NearbyPlaceResponse.builder()
                .id(p.getId())
                .destinationId(p.getDestinationId())
                .destinationName(p.getDestinationName())
                .name(p.getName())
                .category(p.getCategory())
                .description(p.getDescription())
                .entryFee(p.getEntryFee())
                .openingTime(p.getOpeningTime())
                .closingTime(p.getClosingTime())
                .imageUrl(p.getImageUrl())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .distanceKm(distanceKm)
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
