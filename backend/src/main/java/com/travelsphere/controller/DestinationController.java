package com.travelsphere.controller;

import com.travelsphere.dto.response.*;
import com.travelsphere.service.DestinationService;
import com.travelsphere.service.HotelService;
import com.travelsphere.service.PackageService;
import com.travelsphere.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;
    private final PlaceService placeService;
    private final HotelService hotelService;
    private final PackageService packageService;
    private final com.travelsphere.service.WeatherService weatherService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DestinationResponse>>> getDestinations(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name_asc") String sort) {

        PageResponse<DestinationResponse> response = destinationService.getDestinations(
                query, country, state, featured, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Destinations retrieved successfully", response));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<com.travelsphere.dto.response.NearbyDestinationResponse>>> getNearbyDestinations(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) Integer limit) {

        List<com.travelsphere.dto.response.NearbyDestinationResponse> response =
                destinationService.getNearbyDestinations(latitude, longitude, radiusKm, limit);
        return ResponseEntity.ok(ApiResponse.success("Nearby destinations retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DestinationResponse>> getDestinationById(@PathVariable String id) {
        DestinationResponse response = destinationService.getDestinationById(id);
        return ResponseEntity.ok(ApiResponse.success("Destination retrieved successfully", response));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<DestinationResponse>> getDestinationBySlug(@PathVariable String slug) {
        DestinationResponse response = destinationService.getDestinationBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Destination retrieved successfully", response));
    }

    @GetMapping("/{destinationId}/places")
    public ResponseEntity<ApiResponse<List<PlaceResponse>>> getPlacesByDestination(
            @PathVariable Long destinationId) {
        List<PlaceResponse> places = placeService.getPlacesByDestination(destinationId);
        return ResponseEntity.ok(ApiResponse.success("Places retrieved successfully", places));
    }

    @GetMapping("/{destinationId}/hotels")
    public ResponseEntity<ApiResponse<List<HotelResponse>>> getHotelsByDestination(
            @PathVariable Long destinationId) {
        List<HotelResponse> hotels = hotelService.getHotelsByDestination(destinationId);
        return ResponseEntity.ok(ApiResponse.success("Hotels retrieved successfully", hotels));
    }

    @GetMapping("/{destinationId}/packages")
    public ResponseEntity<ApiResponse<List<PackageResponse>>> getPackagesByDestination(
            @PathVariable Long destinationId) {
        List<PackageResponse> packages = packageService.getPackagesByDestination(destinationId);
        return ResponseEntity.ok(ApiResponse.success("Packages retrieved successfully", packages));
    }

    @GetMapping("/{destinationId}/weather")
    public ResponseEntity<ApiResponse<WeatherResponse>> getDestinationWeather(
            @PathVariable Long destinationId) {
        WeatherResponse weather = weatherService.getDestinationWeather(destinationId);
        return ResponseEntity.ok(ApiResponse.success("Destination weather retrieved successfully", weather));
    }
}
