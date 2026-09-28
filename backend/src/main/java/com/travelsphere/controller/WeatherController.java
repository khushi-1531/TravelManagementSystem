package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.WeatherResponse;
import com.travelsphere.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing weather information and multi-day forecasts for destinations and coordinates.
 */
@RestController
@RequestMapping("/api/v1/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * Retrieve live weather by geographic coordinates.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<WeatherResponse>> getWeatherByCoordinates(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String locationName) {

        WeatherResponse response = weatherService.getWeatherByCoordinates(latitude, longitude, locationName);
        return ResponseEntity.ok(ApiResponse.success("Weather retrieved successfully", response));
    }

    /**
     * Retrieve live weather for a specific destination.
     */
    @GetMapping("/destination/{id}")
    public ResponseEntity<ApiResponse<WeatherResponse>> getDestinationWeather(@PathVariable Long id) {
        WeatherResponse response = weatherService.getDestinationWeather(id);
        return ResponseEntity.ok(ApiResponse.success("Destination weather retrieved successfully", response));
    }

    /**
     * Retrieve live weather for a specific place of interest.
     */
    @GetMapping("/place/{id}")
    public ResponseEntity<ApiResponse<WeatherResponse>> getPlaceWeather(@PathVariable Long id) {
        WeatherResponse response = weatherService.getPlaceWeather(id);
        return ResponseEntity.ok(ApiResponse.success("Place weather retrieved successfully", response));
    }
}
