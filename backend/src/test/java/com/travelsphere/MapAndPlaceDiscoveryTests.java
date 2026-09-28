package com.travelsphere;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.util.GeoUtils;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MapAndPlaceDiscoveryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // =========================================================================
    // 1. GEO-SPATIAL UTILITY UNIT TESTS
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("1. Haversine distance correctly calculates distance between known Indian cities")
    void testHaversineDistanceCalculation() {
        // Jaipur: 26.9124 N, 75.7873 E
        // Agra:   27.1767 N, 78.0081 E
        // Approximate great-circle distance is ~223 km
        double distance = GeoUtils.haversineDistanceKm(26.9124, 75.7873, 27.1767, 78.0081);

        assertTrue(distance > 210.0 && distance < 240.0,
                "Distance between Jaipur and Agra should be approx 223 km. Computed: " + distance);

        // Same point distance should be 0.0
        double zeroDist = GeoUtils.haversineDistanceKm(26.9124, 75.7873, 26.9124, 75.7873);
        assertEquals(0.0, zeroDist, 0.01);
    }

    @Test
    @Order(2)
    @DisplayName("2. Coordinate validation accepts valid ranges and rejects invalid latitudes/longitudes")
    void testCoordinateValidation() {
        // Valid coordinates
        assertDoesNotThrow(() -> GeoUtils.validateCoordinates(26.9124, 75.7873));
        assertDoesNotThrow(() -> GeoUtils.validateCoordinates(0.0, 0.0));
        assertDoesNotThrow(() -> GeoUtils.validateCoordinates(90.0, 180.0));
        assertDoesNotThrow(() -> GeoUtils.validateCoordinates(-90.0, -180.0));

        // Invalid latitudes
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(90.1, 75.0));
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(-91.0, 75.0));
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(null, 75.0));

        // Invalid longitudes
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(26.0, 180.1));
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(26.0, -180.1));
        assertThrows(BadRequestException.class, () -> GeoUtils.validateCoordinates(26.0, null));
    }

    @Test
    @Order(3)
    @DisplayName("3. Radius validation enforces positive bounds and max limits")
    void testRadiusValidation() {
        assertEquals(50.0, GeoUtils.validateAndResolveRadius(null, 50.0, 500.0));
        assertEquals(25.0, GeoUtils.validateAndResolveRadius(25.0, 50.0, 500.0));

        // Non-positive radius
        assertThrows(BadRequestException.class, () -> GeoUtils.validateAndResolveRadius(0.0, 50.0, 500.0));
        assertThrows(BadRequestException.class, () -> GeoUtils.validateAndResolveRadius(-10.0, 50.0, 500.0));

        // Exceeding maximum
        assertThrows(BadRequestException.class, () -> GeoUtils.validateAndResolveRadius(600.0, 50.0, 500.0));
    }

    @Test
    @Order(4)
    @DisplayName("4. Bounding box computation generates valid min/max coordinates")
    void testBoundingBoxCalculation() {
        GeoUtils.BoundingBox bbox = GeoUtils.calculateBoundingBox(26.9124, 75.7873, 50.0);

        assertNotNull(bbox);
        assertTrue(bbox.minLat().compareTo(bbox.maxLat()) < 0);
        assertTrue(bbox.minLng().compareTo(bbox.maxLng()) < 0);
        assertTrue(bbox.minLat().compareTo(BigDecimal.valueOf(26.0)) > 0);
        assertTrue(bbox.maxLat().compareTo(BigDecimal.valueOf(28.0)) < 0);
    }

    // =========================================================================
    // 2. MAP DISCOVERY REST ENDPOINT TESTS
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("5. GET /api/v1/map/items returns 200 with all catalogue items")
    void testGetAllMapItems() throws Exception {
        mockMvc.perform(get("/api/v1/map/items")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(not(empty()))))
                .andExpect(jsonPath("$.data[0].id", notNullValue()))
                .andExpect(jsonPath("$.data[0].latitude", notNullValue()))
                .andExpect(jsonPath("$.data[0].longitude", notNullValue()));
    }

    @Test
    @Order(6)
    @DisplayName("6. GET /api/v1/map/items?type=DESTINATION filters to destination hubs only")
    void testGetDestinationMapItems() throws Exception {
        mockMvc.perform(get("/api/v1/map/items")
                        .param("type", "DESTINATION")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(12))))
                .andExpect(jsonPath("$.data[*].type", everyItem(is("DESTINATION"))));
    }

    @Test
    @Order(7)
    @DisplayName("7. GET /api/v1/map/items?type=PLACE filters to places of interest only")
    void testGetPlaceMapItems() throws Exception {
        mockMvc.perform(get("/api/v1/map/items")
                        .param("type", "PLACE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(not(empty()))))
                .andExpect(jsonPath("$.data[*].type", everyItem(is("PLACE"))));
    }

    @Test
    @Order(8)
    @DisplayName("8. GET /api/v1/map/nearby returns nearby items with calculated distance sorted ascending")
    void testGetNearbyMapItems() throws Exception {
        // Center on Jaipur: lat 26.9124, lng 75.7873
        mockMvc.perform(get("/api/v1/map/nearby")
                        .param("latitude", "26.9124")
                        .param("longitude", "75.7873")
                        .param("radiusKm", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(not(empty()))))
                .andExpect(jsonPath("$.data[0].distanceKm", notNullValue()))
                .andExpect(jsonPath("$.data[0].distanceKm", lessThanOrEqualTo(50.0)));
    }

    @Test
    @Order(9)
    @DisplayName("9. GET /api/v1/places/nearby returns places within specified radius")
    void testGetNearbyPlaces() throws Exception {
        mockMvc.perform(get("/api/v1/places/nearby")
                        .param("latitude", "26.9124")
                        .param("longitude", "75.7873")
                        .param("radiusKm", "40")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(not(empty()))))
                .andExpect(jsonPath("$.data[0].distanceKm", lessThanOrEqualTo(40.0)));
    }

    @Test
    @Order(10)
    @DisplayName("10. GET /api/v1/destinations/nearby returns destinations within radius")
    void testGetNearbyDestinations() throws Exception {
        // From Jaipur, within 300 km includes Agra and Delhi
        mockMvc.perform(get("/api/v1/destinations/nearby")
                        .param("latitude", "26.9124")
                        .param("longitude", "75.7873")
                        .param("radiusKm", "300")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(not(empty()))))
                .andExpect(jsonPath("$.data[0].name", is("Jaipur"))) // Distance ~ 0.0 km
                .andExpect(jsonPath("$.data[0].distanceKm", lessThan(1.0)));
    }

    @Test
    @Order(11)
    @DisplayName("11. GET /api/v1/map/nearby with invalid coordinates returns 400 Bad Request")
    void testInvalidCoordinatesReturn400() throws Exception {
        // Latitude > 90
        mockMvc.perform(get("/api/v1/map/nearby")
                        .param("latitude", "105.0")
                        .param("longitude", "75.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        // Longitude < -180
        mockMvc.perform(get("/api/v1/map/nearby")
                        .param("latitude", "26.0")
                        .param("longitude", "-190.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        // Negative radius
        mockMvc.perform(get("/api/v1/map/nearby")
                        .param("latitude", "26.0")
                        .param("longitude", "75.0")
                        .param("radiusKm", "-5.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(12)
    @DisplayName("12. GET /api/v1/map/search returns catalogue and external structured results")
    void testMapSearch() throws Exception {
        mockMvc.perform(get("/api/v1/map/search")
                        .param("query", "Jaipur")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.catalogueItems", is(not(empty()))))
                .andExpect(jsonPath("$.data.externalItems", notNullValue()));
    }
}
