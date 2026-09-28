package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * External place/geocoding search result.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExternalPlaceResponse {
    private String placeId;
    private String name;
    private String displayName;
    private String type;
    private String category;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Double distanceKm;
    private String boundingBox;
}
