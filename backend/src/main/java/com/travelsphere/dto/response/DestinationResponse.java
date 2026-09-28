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
public class DestinationResponse {
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
    private Boolean isFeatured;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
