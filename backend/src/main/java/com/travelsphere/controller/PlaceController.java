package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.dto.response.PlaceResponse;
import com.travelsphere.entity.enums.PlaceCategory;
import com.travelsphere.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PlaceResponse>>> getPlaces(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) PlaceCategory category,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name_asc") String sort) {

        PageResponse<PlaceResponse> response = placeService.getPlaces(
                destinationId, category, query, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Places retrieved successfully", response));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<java.util.List<com.travelsphere.dto.response.NearbyPlaceResponse>>> getNearbyPlaces(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) PlaceCategory category,
            @RequestParam(required = false) Integer limit) {

        java.util.List<com.travelsphere.dto.response.NearbyPlaceResponse> response =
                placeService.getNearbyPlaces(latitude, longitude, radiusKm, category, limit);
        return ResponseEntity.ok(ApiResponse.success("Nearby places retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceResponse>> getPlaceById(@PathVariable Long id) {
        PlaceResponse response = placeService.getPlaceById(id);
        return ResponseEntity.ok(ApiResponse.success("Place retrieved successfully", response));
    }
}
