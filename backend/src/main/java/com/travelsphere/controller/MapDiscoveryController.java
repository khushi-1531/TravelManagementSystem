package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.MapItemResponse;
import com.travelsphere.service.MapDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Map-based Travel Discovery and Nearby Explorations.
 * Provides public read-only discovery of destinations, places, and hotels.
 */
@RestController
@RequestMapping("/api/v1/map")
@RequiredArgsConstructor
public class MapDiscoveryController {

    private final MapDiscoveryService mapDiscoveryService;

    /**
     * Retrieve all map markers across the TravelSphere catalogue, optionally filtered.
     */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<MapItemResponse>>> getMapItems(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean featuredOnly) {

        List<MapItemResponse> items = mapDiscoveryService.getMapItems(type, category, destinationId, query, featuredOnly);
        return ResponseEntity.ok(ApiResponse.success("Map items retrieved successfully", items));
    }

    /**
     * Retrieve nearby travel spots within a geographic radius from given coordinates.
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<MapItemResponse>>> getNearbyMapItems(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer limit) {

        List<MapItemResponse> nearbyItems = mapDiscoveryService.getNearbyItems(
                latitude, longitude, radiusKm, type, category, limit
        );
        return ResponseEntity.ok(ApiResponse.success("Nearby map items retrieved successfully", nearbyItems));
    }

    /**
     * Unified search returning TravelSphere catalogue matches and external geocoded places.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchMapPlaces(
            @RequestParam String query,
            @RequestParam(required = false) Integer limit) {

        Map<String, Object> searchResults = mapDiscoveryService.searchMapPlaces(query, limit);
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved successfully", searchResults));
    }
}
