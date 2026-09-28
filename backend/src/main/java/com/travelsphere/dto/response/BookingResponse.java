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
public class BookingResponse {
    private Long id;
    private String bookingReference;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String bookingType;
    private String status;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private String currency;
    private String customerNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<PackageBookingItemResponse> packageItems;
    private List<HotelBookingItemResponse> hotelItems;
}
