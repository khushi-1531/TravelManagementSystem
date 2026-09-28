package com.travelsphere.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.razorpay")
public class RazorpayProperties {

    /**
     * Razorpay Public Key ID (safe for frontend checkout modal).
     */
    private String keyId;

    /**
     * Razorpay Secret Key (confidential, only used on backend for HMAC-SHA256 signature verification).
     */
    private String keySecret;

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank() && !keyId.contains("placeholder")
                && keySecret != null && !keySecret.isBlank() && !keySecret.contains("placeholder");
    }
}
