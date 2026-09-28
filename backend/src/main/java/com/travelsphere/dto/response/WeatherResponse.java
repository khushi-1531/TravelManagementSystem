package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Provider-neutral response containing current live weather and 5-day forecast.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WeatherResponse {

    /** Location name or city */
    private String locationName;

    /** Latitude coordinate */
    private BigDecimal latitude;

    /** Longitude coordinate */
    private BigDecimal longitude;

    /** Current temperature in Celsius */
    private Double temperature;

    /** 'Feels like' temperature in Celsius */
    private Double feelsLike;

    /** Minimum temperature in Celsius */
    private Double tempMin;

    /** Maximum temperature in Celsius */
    private Double tempMax;

    /** Relative humidity percentage (0-100) */
    private Integer humidity;

    /** Atmospheric pressure in hPa */
    private Integer pressure;

    /** Wind speed in km/h */
    private Double windSpeed;

    /** Wind direction in cardinal or degrees */
    private String windDirection;

    /** Weather condition classification: Clear, Clouds, Rain, Thunderstorm, Snow, Mist, Haze */
    private String condition;

    /** Detailed description, e.g., 'light rain and gentle breeze' */
    private String description;

    /** Standard weather icon key */
    private String iconCode;

    /** Neutral, factual travel context advice */
    private String travelContext;

    /** Observation / update timestamp */
    private String observedAt;

    /** Name of weather data source/provider */
    private String provider;

    /** Up to 5-day weather forecast outlook */
    private List<WeatherForecastDay> forecast;

    /** Availability flag indicating whether live weather data could be retrieved */
    private boolean available;

    /** Informational status or fallback message */
    private String message;

    public static WeatherResponse unavailable(String locationName, BigDecimal lat, BigDecimal lng, String message) {
        return WeatherResponse.builder()
                .locationName(locationName)
                .latitude(lat)
                .longitude(lng)
                .available(false)
                .message(message != null ? message : "Live weather data is currently unavailable.")
                .build();
    }
}
