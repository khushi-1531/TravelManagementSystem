package com.travelsphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentOrderRequest {

    /**
     * The master booking reference (e.g. TS-123456).
     */
    @NotBlank(message = "Booking reference is required")
    private String bookingReference;

    /**
     * Optional booking ID fallback.
     */
    @Positive(message = "Booking ID must be greater than zero")
    private Long bookingId;
}
