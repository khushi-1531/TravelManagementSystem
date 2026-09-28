package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Destination response enriched with calculated distance from requested coordinates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NearbyDestinationResponse {
    private Long id;
    private String uuid;
    private String name;
    private String slug;
    private String state;
    private String country;
    private String description;
    private String climate;
    private String bestTimeToVisit;
    private String heroImageUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Double distanceKm;
    private Boolean isFeatured;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NearbyDestinationResponse from(DestinationResponse d, Double distanceKm) {
        return NearbyDestinationResponse.builder()
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
                .distanceKm(distanceKm)
                .isFeatured(d.getIsFeatured())
                .isPublished(d.getIsPublished())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
