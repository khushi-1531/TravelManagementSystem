package com.travelsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.dto.response.ExternalPlaceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service for querying external geographic search/geocoding providers (OpenStreetMap Nominatim).
 * Keeps provider requests strictly server-side, with timeout controls and graceful fallback.
 */
@Slf4j
@Service
public class ExternalMapService {

    private final boolean externalSearchEnabled;
    private final int timeoutMs;
    private final String userAgent;
    private final String baseUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public ExternalMapService(
            @Value("${app.maps.external-search-enabled:true}") boolean externalSearchEnabled,
            @Value("${app.maps.timeout-ms:8000}") int timeoutMs,
            @Value("${app.maps.user-agent:TravelSphere-Platform/1.0 (contact@travelsphere.example)}") String userAgent,
            @Value("${app.maps.nominatim-base-url:https://nominatim.openstreetmap.org}") String baseUrl) {
        this.externalSearchEnabled = externalSearchEnabled;
        this.timeoutMs = timeoutMs;
        this.userAgent = userAgent;
        this.baseUrl = baseUrl;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    /**
     * Searches external geographic places and points of interest by text query.
     *
     * @param query Search query text (city, landmark, region)
     * @param limit Maximum results (capped at 10)
     * @return List of external place results, or empty list on any error or when disabled.
     */
    public List<ExternalPlaceResponse> searchExternalPlaces(String query, int limit) {
        if (!externalSearchEnabled || !StringUtils.hasText(query) || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        int effectiveLimit = Math.min(Math.max(1, limit), 10);

        try {
            String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            String url = String.format(
                    "%s/search?q=%s&format=json&addressdetails=1&limit=%d&countrycodes=in",
                    baseUrl, encodedQuery, effectiveLimit
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", userAgent)
                    .header("Accept", "application/json")
                    .timeout(Duration.ofMillis(timeoutMs))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && StringUtils.hasText(response.body())) {
                JsonNode arrayNode = objectMapper.readTree(response.body());
                if (arrayNode.isArray()) {
                    List<ExternalPlaceResponse> results = new ArrayList<>();
                    for (JsonNode item : arrayNode) {
                        try {
                            String placeId = item.path("place_id").asText();
                            String displayName = item.path("display_name").asText();
                            String name = item.path("name").asText(displayName.split(",")[0]);
                            String type = item.path("type").asText("place");
                            String category = item.path("class").asText("tourism");
                            double lat = item.path("lat").asDouble();
                            double lon = item.path("lon").asDouble();

                            results.add(ExternalPlaceResponse.builder()
                                    .placeId(placeId)
                                    .name(name)
                                    .displayName(displayName)
                                    .type(type)
                                    .category(category)
                                    .latitude(BigDecimal.valueOf(lat))
                                    .longitude(BigDecimal.valueOf(lon))
                                    .build());
                        } catch (Exception itemEx) {
                            log.debug("Skipping unparseable external place item: {}", itemEx.getMessage());
                        }
                    }
                    return results;
                }
            } else {
                log.warn("External map provider returned HTTP status {}", response.statusCode());
            }

        } catch (Exception e) {
            // Graceful degradation: log warning and return empty list rather than failing user request
            log.warn("External map provider lookup failed gracefully for query '{}': {}", query, e.getMessage());
        }

        return Collections.emptyList();
    }
}
