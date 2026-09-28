package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentOrderResponse {

    /**
     * Unique internal attempt reference identifier.
     */
    private String attemptReference;

    /**
     * Razorpay order identifier (e.g. order_XXXX).
     */
    private String orderId;

    /**
     * Amount expressed in subunit integers (e.g. 150000 paise = 1500.00 INR).
     */
    private Long amountInSubunits;

    /**
     * Total amount in primary currency.
     */
    private BigDecimal totalAmount;

    /**
     * Standard ISO currency code (e.g. INR).
     */
    private String currency;

    /**
     * Public key ID for initializing Razorpay checkout modal (safe for frontend).
     */
    private String keyId;

    /**
     * Master booking reference.
     */
    private String bookingReference;

    /**
     * Booking type (HOTEL or PACKAGE).
     */
    private String bookingType;

    /**
     * Flag indicating whether the order is generated in simulated demo/development mode.
     */
    private Boolean demoMode;
}
