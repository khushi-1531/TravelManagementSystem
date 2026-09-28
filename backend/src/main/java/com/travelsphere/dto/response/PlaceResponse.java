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
public class PlaceResponse {
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
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
