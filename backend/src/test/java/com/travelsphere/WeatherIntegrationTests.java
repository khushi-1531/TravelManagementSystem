package com.travelsphere;

import com.travelsphere.dto.response.WeatherResponse;
import com.travelsphere.entity.Destination;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.service.WeatherService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class WeatherIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private DestinationRepository destinationRepository;

    @Test
    @Order(1)
    @DisplayName("1. GET /api/v1/weather with valid coordinates returns 200 and structured WeatherResponse")
    void testGetWeatherByCoordinates() throws Exception {
        // Jaipur coordinates: 26.9124 N, 75.7873 E
        mockMvc.perform(get("/api/v1/weather")
                        .param("latitude", "26.9124")
                        .param("longitude", "75.7873")
                        .param("locationName", "Jaipur")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.locationName", is("Jaipur")))
                .andExpect(jsonPath("$.data.latitude", notNullValue()))
                .andExpect(jsonPath("$.data.longitude", notNullValue()));
    }

    @Test
    @Order(2)
    @DisplayName("2. GET /api/v1/weather/destination/{id} returns 200 with destination weather")
    void testGetDestinationWeather() throws Exception {
        Destination destination = destinationRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsPublished()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("At least one destination should exist"));

        mockMvc.perform(get("/api/v1/weather/destination/" + destination.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.locationName", is(destination.getName())));
    }

    @Test
    @Order(3)
    @DisplayName("3. GET /api/v1/destinations/{id}/weather endpoint matches destination weather")
    void testGetDestinationWeatherThroughDestinationController() throws Exception {
        Destination destination = destinationRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsPublished()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("At least one destination should exist"));

        mockMvc.perform(get("/api/v1/destinations/" + destination.getId() + "/weather")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.locationName", is(destination.getName())));
    }

    @Test
    @Order(4)
    @DisplayName("4. GET /api/v1/weather with invalid latitude (> 90) returns 400 Bad Request")
    void testInvalidLatitudeReturns400() throws Exception {
        mockMvc.perform(get("/api/v1/weather")
                        .param("latitude", "95.5")
                        .param("longitude", "75.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(5)
    @DisplayName("5. GET /api/v1/weather with invalid longitude (< -180) returns 400 Bad Request")
    void testInvalidLongitudeReturns400() throws Exception {
        mockMvc.perform(get("/api/v1/weather")
                        .param("latitude", "25.0")
                        .param("longitude", "-190.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    @DisplayName("6. GET /api/v1/weather/destination/{id} with nonexistent ID returns 404 Not Found")
    void testNonexistentDestinationReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/weather/destination/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(7)
    @DisplayName("7. In-memory cache returns cached response for repeated queries")
    void testWeatherCacheEfficiency() {
        weatherService.clearCache();

        WeatherResponse resp1 = weatherService.getWeatherByCoordinates(26.9124, 75.7873, "Jaipur");
        assertNotNull(resp1);

        // Immediate subsequent call should retrieve identical cached entry
        WeatherResponse resp2 = weatherService.getWeatherByCoordinates(26.9124, 75.7873, "Jaipur");
        assertNotNull(resp2);
        assertEquals(resp1.getLocationName(), resp2.getLocationName());
        assertEquals(resp1.getObservedAt(), resp2.getObservedAt());
    }
}
