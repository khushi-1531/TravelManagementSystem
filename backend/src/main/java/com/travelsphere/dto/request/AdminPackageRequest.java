package com.travelsphere.dto.request;

import com.travelsphere.entity.enums.PackageTier;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class AdminPackageRequest {

    @NotNull(message = "Destination ID is required")
    private Long destinationId;

    @NotBlank(message = "Package title is required")
    @Size(max = 150, message = "Package title cannot exceed 150 characters")
    private String title;

    @NotNull(message = "Package tier is required (BUDGET, STANDARD, PREMIUM, LUXURY)")
    private PackageTier tier;

    @NotNull(message = "Duration days is required")
    @Min(value = 1, message = "Duration must be at least 1 day")
    private Integer durationDays;

    @NotNull(message = "Duration nights is required")
    @Min(value = 0, message = "Duration nights cannot be negative")
    private Integer durationNights;

    @NotNull(message = "Base price per person is required")
    @DecimalMin(value = "0.0", message = "Base price cannot be negative")
    private BigDecimal basePricePerPerson;

    @NotBlank(message = "Hero image URL is required")
    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String heroImageUrl;

    @NotBlank(message = "Inclusions list is required")
    private String inclusions;

    @NotBlank(message = "Exclusions list is required")
    private String exclusions;

    private Boolean isActive;
}
