package com.travelsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.config.RazorpayProperties;
import com.travelsphere.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Client adapter for interacting with the official Razorpay Orders API.
 * Uses Java 11+ standard HttpClient to communicate securely over TLS without extra heavyweight SDKs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayGatewayClient {

    private final RazorpayProperties razorpayProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

    /**
     * Create a Razorpay Order on the remote gateway or sandbox simulator.
     *
     * @param amountInSubunits The amount in subunits (e.g. paise for INR)
     * @param currency         ISO currency string (e.g. INR)
     * @param attemptReference Unique attempt reference used as receipt
     * @param bookingReference Master booking reference
     * @return Generated Razorpay order ID (e.g. order_XXXXX)
     */
    public String createOrder(long amountInSubunits, String currency, String attemptReference, String bookingReference) {
        if (!razorpayProperties.isConfigured()) {
            log.info("Razorpay credentials not fully configured; generating simulated development order for receipt: {}", attemptReference);
            return "order_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("amount", amountInSubunits);
            requestBody.put("currency", currency);
            requestBody.put("receipt", attemptReference);

            Map<String, String> notes = new HashMap<>();
            notes.put("bookingReference", bookingReference);
            requestBody.put("notes", notes);

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                    (razorpayProperties.getKeyId() + ":" + razorpayProperties.getKeySecret()).getBytes(StandardCharsets.UTF_8)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RAZORPAY_ORDERS_URL))
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                if (rootNode.has("id")) {
                    return rootNode.get("id").asText();
                }
            }

            log.error("Razorpay order creation failed with HTTP {}: {}", response.statusCode(), response.body());
            throw new BadRequestException("Failed to create payment order with gateway. Please try again later.");

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Network or parsing error communicating with Razorpay: {}", e.getMessage());
            throw new BadRequestException("Unable to contact payment provider. Please verify network connectivity.");
        }
    }
}
