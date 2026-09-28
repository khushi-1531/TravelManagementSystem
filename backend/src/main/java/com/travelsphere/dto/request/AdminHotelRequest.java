package com.travelsphere.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class AdminHotelRequest {

    @NotNull(message = "Destination ID is required")
    private Long destinationId;

    @NotBlank(message = "Hotel name is required")
    @Size(max = 150, message = "Hotel name cannot exceed 150 characters")
    private String name;

    @DecimalMin(value = "1.0", message = "Star rating must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Star rating cannot exceed 5.0")
    private BigDecimal starRating;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    @Size(max = 30, message = "Contact phone cannot exceed 30 characters")
    private String contactPhone;

    @Size(max = 100, message = "Contact email cannot exceed 100 characters")
    @Email(message = "Contact email must be a valid email format")
    private String contactEmail;

    @NotBlank(message = "Hero image URL is required")
    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String heroImageUrl;

    private String description;

    @NotNull(message = "Starting price per night is required")
    @DecimalMin(value = "0.0", message = "Starting price cannot be negative")
    private BigDecimal startingPricePerNight;

    private Boolean hasSwimmingPool;
    private Boolean hasWifi;
    private Boolean hasParking;
    private Boolean hasRestaurant;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90 degrees")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90 degrees")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180 degrees")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180 degrees")
    private BigDecimal longitude;

    private Boolean isActive;
}
