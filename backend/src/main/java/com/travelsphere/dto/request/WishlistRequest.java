package com.travelsphere.dto.request;

import com.travelsphere.entity.enums.TargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistRequest {

    @NotNull(message = "Target type is required (DESTINATION, HOTEL, PACKAGE)")
    private TargetType targetType;

    @NotNull(message = "Target ID is required")
    @Positive(message = "Target ID must be greater than zero")
    private Long targetId;
}
