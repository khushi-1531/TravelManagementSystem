package com.travelsphere.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDestinationRequest {

    @NotBlank(message = "Destination name is required")
    @Size(max = 100, message = "Destination name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @NotBlank(message = "Country is required")
    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;

    @NotBlank(message = "Description is required")
    private String description;

    @Size(max = 100, message = "Climate description cannot exceed 100 characters")
    private String climate;

    @Size(max = 100, message = "Best time to visit cannot exceed 100 characters")
    private String bestTimeToVisit;

    @NotBlank(message = "Hero image URL is required")
    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String heroImageUrl;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90 degrees")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90 degrees")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180 degrees")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180 degrees")
    private BigDecimal longitude;

    private Boolean isFeatured;
    private Boolean isPublished;
}
