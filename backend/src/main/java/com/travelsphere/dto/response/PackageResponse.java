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
public class PackageResponse {
    private Long id;
    private String uuid;
    private Long destinationId;
    private String destinationName;
    private String title;
    private String tier;
    private Integer durationDays;
    private Integer durationNights;
    private BigDecimal basePricePerPerson;
    private String heroImageUrl;
    private String inclusions;
    private String exclusions;
    private Boolean isActive;
    private List<PackageItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
