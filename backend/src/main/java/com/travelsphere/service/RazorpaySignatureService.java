package com.travelsphere.service;

import com.travelsphere.config.RazorpayProperties;
import com.travelsphere.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Service for cryptographically verifying and generating Razorpay HMAC-SHA256 signatures.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpaySignatureService {

    private final RazorpayProperties razorpayProperties;
    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Compute HMAC-SHA256 signature for Razorpay payload: orderId + "|" + paymentId
     *
     * @param orderId   The Razorpay order ID
     * @param paymentId The Razorpay payment ID
     * @param secret    The Razorpay secret key
     * @return Hexadecimal lowercase signature string
     */
    public String calculateSignature(String orderId, String paymentId, String secret) {
        if (orderId == null || paymentId == null || secret == null) {
            throw new IllegalArgumentException("OrderId, paymentId, and secret must not be null for signature calculation.");
        }
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("HMAC-SHA256 algorithm is not available in the runtime environment", e);
        } catch (Exception e) {
            log.error("Failed to compute HMAC-SHA256 signature: {}", e.getMessage());
            throw new BadRequestException("Failed to calculate cryptographic payment signature.");
        }
    }

    /**
     * Verify the payment signature received from client against server-computed HMAC-SHA256.
     * Uses constant-time comparison to protect against timing attacks.
     *
     * @param orderId          The Razorpay order ID
     * @param paymentId        The Razorpay payment ID
     * @param receivedSignature The signature provided by Razorpay checkout
     * @return true if signature is cryptographically authentic, false otherwise
     */
    public boolean verifySignature(String orderId, String paymentId, String receivedSignature) {
        if (orderId == null || paymentId == null || receivedSignature == null) {
            return false;
        }

        String secret = razorpayProperties.getKeySecret();
        if (secret == null || secret.isBlank()) {
            log.warn("Razorpay secret key is not configured; cannot verify signature.");
            return false;
        }

        String calculatedSignature = calculateSignature(orderId, paymentId, secret);

        return MessageDigest.isEqual(
                calculatedSignature.toLowerCase().getBytes(StandardCharsets.UTF_8),
                receivedSignature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
    }
}
