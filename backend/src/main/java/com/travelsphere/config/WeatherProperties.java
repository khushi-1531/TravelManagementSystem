package com.travelsphere.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Configuration properties for external weather providers.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.weather")
public class WeatherProperties {

    /** Provider choice: 'openweather' or 'openmeteo' */
    private String provider = "openweather";

    /** Secret API key for authenticated weather APIs (e.g. OpenWeatherMap) */
    private String apiKey;

    /** Base endpoint for OpenWeather API */
    private String baseUrl = "https://api.openweathermap.org/data/2.5";

    /** Base endpoint for Open-Meteo open weather API */
    private String openMeteoBaseUrl = "https://api.open-meteo.com/v1";

    /** HTTP request timeout in milliseconds */
    private int timeoutMs = 6000;

    /** In-memory cache TTL in minutes */
    private int cacheTtlMinutes = 15;

    /**
     * Checks if the active provider has required configuration.
     */
    public boolean isConfigured() {
        if ("openmeteo".equalsIgnoreCase(provider)) {
            return true; // Open-Meteo does not require an API key
        }
        return StringUtils.hasText(apiKey) && !apiKey.startsWith("your_");
    }
}
