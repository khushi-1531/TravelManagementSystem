package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HotelRoomResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private String roomType;
    private Integer maxOccupancy;
    private Boolean hasAc;
    private Boolean isBreakfastIncluded;
    private BigDecimal pricePerNight;
    private Integer totalInventory;
    private Integer availableInventory;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
