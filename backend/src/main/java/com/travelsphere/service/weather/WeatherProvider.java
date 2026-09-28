package com.travelsphere.service.weather;

import com.travelsphere.dto.response.WeatherResponse;

/**
 * Common abstraction for external weather data providers.
 */
public interface WeatherProvider {

    /**
     * Retrieves current weather and available forecast for the specified coordinates.
     *
     * @param latitude     Valid latitude [-90.0, 90.0]
     * @param longitude    Valid longitude [-180.0, 180.0]
     * @param locationName Display name for the location
     * @return WeatherResponse with current conditions and forecast
     */
    WeatherResponse getWeather(double latitude, double longitude, String locationName);

    /**
     * Indicates whether this provider is properly configured with any required credentials.
     */
    boolean isConfigured();

    /**
     * Display name of this provider implementation.
     */
    String getProviderName();
}
