package com.travelsphere.util;

import com.travelsphere.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Geolocation and spatial utility calculations for TravelSphere.
 * Provides Haversine distance computations, coordinate validations, and bounding boxes.
 */
public final class GeoUtils {

    public static final double EARTH_RADIUS_KM = 6371.0;
    public static final double DEFAULT_RADIUS_KM = 50.0;
    public static final double MAX_RADIUS_KM = 500.0;

    private GeoUtils() {
        // Utility class
    }

    /**
     * Validates that latitude and longitude conform to standard Earth coordinate ranges.
     */
    public static void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null) {
            throw new BadRequestException("Latitude is required");
        }
        if (longitude == null) {
            throw new BadRequestException("Longitude is required");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new BadRequestException("Latitude must be between -90.0 and 90.0 degrees. Provided: " + latitude);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new BadRequestException("Longitude must be between -180.0 and 180.0 degrees. Provided: " + longitude);
        }
    }

    /**
     * Validates radius parameter with minimum (> 0) and maximum bounds.
     */
    public static double validateAndResolveRadius(Double radiusKm, double defaultRadius, double maxRadius) {
        if (radiusKm == null) {
            return defaultRadius;
        }
        if (radiusKm <= 0.0) {
            throw new BadRequestException("Radius must be greater than zero. Provided: " + radiusKm);
        }
        if (radiusKm > maxRadius) {
            throw new BadRequestException("Requested radius exceeds allowable limit of " + maxRadius + " km. Provided: " + radiusKm);
        }
        return radiusKm;
    }

    /**
     * Calculates great-circle distance between two geographic points using Haversine formula.
     *
     * @return Distance in kilometers, rounded to 2 decimal places.
     */
    public static double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Overload for BigDecimal coordinates. Returns null if any coordinate is null.
     */
    public static Double haversineDistanceKm(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }
        return haversineDistanceKm(lat1.doubleValue(), lon1.doubleValue(), lat2.doubleValue(), lon2.doubleValue());
    }

    /**
     * Generates a bounding box around a center point for fast indexed spatial queries.
     */
    public static BoundingBox calculateBoundingBox(double centerLat, double centerLng, double radiusKm) {
        double latChange = Math.toDegrees(radiusKm / EARTH_RADIUS_KM);
        double lngChange = Math.toDegrees(radiusKm / (EARTH_RADIUS_KM * Math.cos(Math.toRadians(centerLat))));

        double minLat = Math.max(-90.0, centerLat - latChange);
        double maxLat = Math.min(90.0, centerLat + latChange);
        double minLng = Math.max(-180.0, centerLng - lngChange);
        double maxLng = Math.min(180.0, centerLng + lngChange);

        return new BoundingBox(
                BigDecimal.valueOf(minLat).setScale(8, RoundingMode.HALF_UP),
                BigDecimal.valueOf(maxLat).setScale(8, RoundingMode.HALF_UP),
                BigDecimal.valueOf(minLng).setScale(8, RoundingMode.HALF_UP),
                BigDecimal.valueOf(maxLng).setScale(8, RoundingMode.HALF_UP)
        );
    }

    public record BoundingBox(BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng) {}
}
