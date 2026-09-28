package com.travelsphere.service;

import com.travelsphere.config.WeatherProperties;
import com.travelsphere.dto.response.WeatherResponse;
import com.travelsphere.entity.Destination;
import com.travelsphere.entity.Place;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.PlaceRepository;
import com.travelsphere.service.weather.WeatherProvider;
import com.travelsphere.util.GeoUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for querying live destination weather and multi-day forecasts.
 * Employs a thread-safe short-lived in-memory cache to respect third-party rate limits.
 */
@Slf4j
@Service
public class WeatherService {

    private final DestinationRepository destinationRepository;
    private final PlaceRepository placeRepository;
    private final WeatherProperties weatherProperties;
    private final WeatherProvider openWeatherProvider;
    private final WeatherProvider openMeteoWeatherProvider;

    /** In-memory cache keyed by rounded coordinates (lat_2dec_lng_2dec) */
    private final Map<String, CacheEntry> weatherCache = new ConcurrentHashMap<>();

    public WeatherService(
            DestinationRepository destinationRepository,
            PlaceRepository placeRepository,
            WeatherProperties weatherProperties,
            @Qualifier("openWeatherProvider") WeatherProvider openWeatherProvider,
            @Qualifier("openMeteoWeatherProvider") WeatherProvider openMeteoWeatherProvider) {
        this.destinationRepository = destinationRepository;
        this.placeRepository = placeRepository;
        this.weatherProperties = weatherProperties;
        this.openWeatherProvider = openWeatherProvider;
        this.openMeteoWeatherProvider = openMeteoWeatherProvider;
    }

    /**
     * Retrieves weather information for explicit geographic coordinates.
     */
    public WeatherResponse getWeatherByCoordinates(Double latitude, Double longitude, String locationName) {
        GeoUtils.validateCoordinates(latitude, longitude);

        String cacheKey = buildCacheKey(latitude, longitude);
        CacheEntry cached = weatherCache.get(cacheKey);

        if (cached != null && Instant.now().isBefore(cached.expiresAt())) {
            log.debug("Serving weather for ({}, {}) from cache", latitude, longitude);
            return cached.response();
        }

        WeatherProvider provider = resolveProvider();
        WeatherResponse response = provider.getWeather(latitude, longitude, locationName);

        // Cache successful responses
        if (response != null && response.isAvailable()) {
            int ttlMinutes = Math.max(1, weatherProperties.getCacheTtlMinutes());
            weatherCache.put(cacheKey, new CacheEntry(response, Instant.now().plus(Duration.ofMinutes(ttlMinutes))));
        }

        return response;
    }

    /**
     * Retrieves weather information for an existing TravelSphere destination.
     */
    @Transactional(readOnly = true)
    public WeatherResponse getDestinationWeather(Long destinationId) {
        if (destinationId == null || destinationId <= 0) {
            throw new BadRequestException("Valid destination ID is required");
        }

        Destination destination = destinationRepository.findByIdAndIsPublishedTrue(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", destinationId));

        if (destination.getLatitude() == null || destination.getLongitude() == null) {
            return WeatherResponse.unavailable(
                    destination.getName(), null, null,
                    "No geographic coordinates configured for destination: " + destination.getName()
            );
        }

        return getWeatherByCoordinates(
                destination.getLatitude().doubleValue(),
                destination.getLongitude().doubleValue(),
                destination.getName()
        );
    }

    /**
     * Retrieves weather information for a point of interest place.
     */
    @Transactional(readOnly = true)
    public WeatherResponse getPlaceWeather(Long placeId) {
        if (placeId == null || placeId <= 0) {
            throw new BadRequestException("Valid place ID is required");
        }

        Place place = placeRepository.findByIdAndIsActiveTrue(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place", "id", placeId));

        BigDecimal lat = place.getLatitude() != null ? place.getLatitude() : (place.getDestination() != null ? place.getDestination().getLatitude() : null);
        BigDecimal lng = place.getLongitude() != null ? place.getLongitude() : (place.getDestination() != null ? place.getDestination().getLongitude() : null);

        if (lat == null || lng == null) {
            return WeatherResponse.unavailable(
                    place.getName(), null, null,
                    "No geographic coordinates configured for place: " + place.getName()
            );
        }

        return getWeatherByCoordinates(lat.doubleValue(), lng.doubleValue(), place.getName());
    }

    /**
     * Clears all cached weather entries.
     */
    public void clearCache() {
        weatherCache.clear();
    }

    private WeatherProvider resolveProvider() {
        String chosen = weatherProperties.getProvider();
        if ("openweather".equalsIgnoreCase(chosen)) {
            if (openWeatherProvider.isConfigured()) {
                return openWeatherProvider;
            }
            // If OpenWeather is configured without key, fallback to OpenMeteo for working out-of-the-box
            log.debug("OpenWeather API key not present; using Open-Meteo as zero-key fallback provider.");
            return openMeteoWeatherProvider;
        }
        return openMeteoWeatherProvider;
    }

    private String buildCacheKey(double lat, double lng) {
        // Round coordinates to 2 decimal places (~1.1 km precision) to normalize cache hits
        long roundedLat = Math.round(lat * 100.0);
        long roundedLng = Math.round(lng * 100.0);
        return roundedLat + "_" + roundedLng;
    }

    private record CacheEntry(WeatherResponse response, Instant expiresAt) {}
}
