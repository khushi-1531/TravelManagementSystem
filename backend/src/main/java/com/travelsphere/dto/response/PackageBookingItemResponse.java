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
public class PackageBookingItemResponse {
    private Long id;
    private Long packageId;
    private String packageTitle;
    private String destinationName;
    private String heroImageUrl;
    private String tier;
    private Integer durationDays;
    private Integer durationNights;
    private LocalDate startDate;
    private Integer guestsCount;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
