package com.travelsphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailureRequest {

    /**
     * The internal payment attempt reference (UUID).
     */
    @NotBlank(message = "Attempt reference is required")
    private String attemptReference;

    /**
     * Diagnostic reason (e.g. card declined, user dismissed modal, timeout).
     */
    private String failureReason;
}
