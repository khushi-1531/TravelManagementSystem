package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HotelBookingItemResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private String destinationName;
    private Long hotelRoomId;
    private String roomType;
    private String heroImageUrl;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Long totalNights;
    private Integer roomsCount;
    private Integer guestsCount;
    private BigDecimal pricePerNight;
    private BigDecimal subtotal;
}
