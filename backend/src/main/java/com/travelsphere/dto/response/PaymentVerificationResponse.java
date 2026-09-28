package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentVerificationResponse {

    private String bookingReference;
    private String bookingStatus;
    private String paymentStatus;
    private String paymentId;
    private String attemptReference;
    private LocalDateTime paidAt;
}
