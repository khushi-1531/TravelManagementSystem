package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HotelResponse {
    private Long id;
    private String uuid;
    private Long destinationId;
    private String destinationName;
    private String name;
    private BigDecimal starRating;
    private String address;
    private String contactPhone;
    private String contactEmail;
    private String heroImageUrl;
    private String description;
    private BigDecimal startingPricePerNight;
    private Boolean hasSwimmingPool;
    private Boolean hasWifi;
    private Boolean hasParking;
    private Boolean hasRestaurant;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean isActive;
    private List<HotelRoomResponse> rooms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
