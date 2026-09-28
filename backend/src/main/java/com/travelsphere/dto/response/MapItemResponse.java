package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Unified representation of any mapped travel entity in TravelSphere
 * (Destination hub, Place of interest, Hotel stay, or External discovery result).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MapItemResponse {

    /** Unique key composed of type and id, e.g., 'place-5' or 'destination-1' */
    private String id;

    /** Raw database/source identifier */
    private Long itemId;

    /** Category type: DESTINATION, PLACE, HOTEL, EXTERNAL */
    private String type;

    /** Display name */
    private String name;

    /** Subcategory or theme, e.g., HERITAGE, NATURE, BEACH, ADVENTURE, RELIGIOUS, HOTEL */
    private String category;

    /** Descriptive summary snippet */
    private String description;

    /** Geographic latitude */
    private BigDecimal latitude;

    /** Geographic longitude */
    private BigDecimal longitude;

    /** Calculated distance in kilometers from current queried location (if nearby search) */
    private Double distanceKm;

    /** Associated destination name */
    private String destinationName;

    /** Associated destination ID */
    private Long destinationId;

    /** Main visual media URL */
    private String imageUrl;

    /** Price indicator (e.g. entry fee or hotel starting price) */
    private BigDecimal price;

    /** Star rating for hotels or curated quality score */
    private BigDecimal rating;

    /** Frontend deep-link route for full details */
    private String detailUrl;

    /** Badge label for map UI chips (e.g. 'Featured Hub', 'Heritage Landmark', '4.5 Star') */
    private String badgeText;

    /** Source tag: 'CATALOGUE' or 'EXTERNAL' */
    private String source;

    /** Additional metadata such as opening hours, address, amenities */
    private Map<String, Object> metadata;
}
