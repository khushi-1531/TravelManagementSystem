package com.travelsphere.service;

import com.travelsphere.dto.response.ExternalPlaceResponse;
import com.travelsphere.dto.response.MapItemResponse;
import com.travelsphere.entity.Destination;
import com.travelsphere.entity.Hotel;
import com.travelsphere.entity.Place;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.PlaceRepository;
import com.travelsphere.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.*;

/**
 * Service for Map-based discovery and nearby place queries across the TravelSphere catalogue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MapDiscoveryService {

    private final DestinationRepository destinationRepository;
    private final PlaceRepository placeRepository;
    private final HotelRepository hotelRepository;
    private final ExternalMapService externalMapService;

    private static final double DEFAULT_NEARBY_RADIUS_KM = 50.0;
    private static final double MAX_NEARBY_RADIUS_KM = 500.0;
    private static final int DEFAULT_LIMIT = 30;
    private static final int MAX_LIMIT = 100;

    /**
     * Retrieves all map markers across the TravelSphere catalogue with optional filtering.
     */
    @Transactional(readOnly = true)
    public List<MapItemResponse> getMapItems(String type, String category, Long destinationId, String query, Boolean featuredOnly) {
        List<MapItemResponse> items = new ArrayList<>();
        String queryLower = StringUtils.hasText(query) ? query.trim().toLowerCase() : null;
        String typeFilter = StringUtils.hasText(type) ? type.trim().toUpperCase() : "ALL";

        // 1. Destinations
        if ("ALL".equals(typeFilter) || "DESTINATION".equals(typeFilter)) {
            List<Destination> destinations = Boolean.TRUE.equals(featuredOnly)
                    ? destinationRepository.findByIsFeaturedTrueAndIsPublishedTrue()
                    : destinationRepository.findAll().stream().filter(d -> Boolean.TRUE.equals(d.getIsPublished())).toList();

            for (Destination d : destinations) {
                if (d.getLatitude() == null || d.getLongitude() == null) continue;
                if (destinationId != null && !destinationId.equals(d.getId())) continue;
                if (queryLower != null && !matchesQuery(d.getName(), d.getDescription(), d.getState(), queryLower)) continue;

                items.add(toDestinationMapItem(d, null));
            }
        }

        // 2. Places of Interest
        if ("ALL".equals(typeFilter) || "PLACE".equals(typeFilter)) {
            List<Place> places = destinationId != null
                    ? placeRepository.findByDestinationIdAndIsActiveTrue(destinationId)
                    : placeRepository.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getIsActive())).toList();

            for (Place p : places) {
                if (p.getLatitude() == null || p.getLongitude() == null) continue;
                if (StringUtils.hasText(category) && !category.equalsIgnoreCase("ALL")
                        && (p.getCategory() == null || !p.getCategory().name().equalsIgnoreCase(category))) {
                    continue;
                }
                if (queryLower != null && !matchesQuery(p.getName(), p.getDescription(), null, queryLower)) continue;

                items.add(toPlaceMapItem(p, null));
            }
        }

        // 3. Hotels
        if ("ALL".equals(typeFilter) || "HOTEL".equals(typeFilter)) {
            List<Hotel> hotels = destinationId != null
                    ? hotelRepository.findByDestinationIdAndIsActiveTrue(destinationId)
                    : hotelRepository.findAll().stream().filter(h -> Boolean.TRUE.equals(h.getIsActive())).toList();

            for (Hotel h : hotels) {
                BigDecimal lat = h.getLatitude() != null ? h.getLatitude() : (h.getDestination() != null ? h.getDestination().getLatitude() : null);
                BigDecimal lng = h.getLongitude() != null ? h.getLongitude() : (h.getDestination() != null ? h.getDestination().getLongitude() : null);

                if (lat == null || lng == null) continue;
                if (queryLower != null && !matchesQuery(h.getName(), h.getDescription(), h.getAddress(), queryLower)) continue;

                items.add(toHotelMapItem(h, lat, lng, null));
            }
        }

        return items;
    }

    /**
     * Finds all catalogue places, destinations, and hotels within a specified radius from given coordinates.
     */
    @Transactional(readOnly = true)
    public List<MapItemResponse> getNearbyItems(Double latitude, Double longitude, Double radiusKm, String type, String category, Integer limit) {
        GeoUtils.validateCoordinates(latitude, longitude);
        double effectiveRadius = GeoUtils.validateAndResolveRadius(radiusKm, DEFAULT_NEARBY_RADIUS_KM, MAX_NEARBY_RADIUS_KM);
        int effectiveLimit = limit != null && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;

        List<MapItemResponse> allItems = getMapItems(type, category, null, null, null);
        List<MapItemResponse> nearbyItems = new ArrayList<>();

        for (MapItemResponse item : allItems) {
            if (item.getLatitude() == null || item.getLongitude() == null) continue;

            double distance = GeoUtils.haversineDistanceKm(
                    latitude, longitude,
                    item.getLatitude().doubleValue(), item.getLongitude().doubleValue()
            );

            if (distance <= effectiveRadius) {
                item.setDistanceKm(distance);
                nearbyItems.add(item);
            }
        }

        nearbyItems.sort(Comparator.comparingDouble(MapItemResponse::getDistanceKm));

        if (nearbyItems.size() > effectiveLimit) {
            return nearbyItems.subList(0, effectiveLimit);
        }
        return nearbyItems;
    }

    /**
     * Unified search supporting both internal TravelSphere catalogue results and external geocoded places.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> searchMapPlaces(String query, Integer limit) {
        int effectiveLimit = limit != null && limit > 0 ? Math.min(limit, 20) : 10;

        List<MapItemResponse> catalogueMatches = getMapItems("ALL", null, null, query, false);
        if (catalogueMatches.size() > effectiveLimit) {
            catalogueMatches = catalogueMatches.subList(0, effectiveLimit);
        }

        List<ExternalPlaceResponse> externalMatches = Collections.emptyList();
        if (StringUtils.hasText(query) && query.trim().length() >= 2) {
            externalMatches = externalMapService.searchExternalPlaces(query, effectiveLimit);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query", query);
        result.put("catalogueCount", catalogueMatches.size());
        result.put("catalogueItems", catalogueMatches);
        result.put("externalCount", externalMatches.size());
        result.put("externalItems", externalMatches);

        return result;
    }

    private boolean matchesQuery(String title, String description, String extra, String queryLower) {
        if (title != null && title.toLowerCase().contains(queryLower)) return true;
        if (description != null && description.toLowerCase().contains(queryLower)) return true;
        return extra != null && extra.toLowerCase().contains(queryLower);
    }

    private MapItemResponse toDestinationMapItem(Destination d, Double distanceKm) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("state", d.getState());
        metadata.put("climate", d.getClimate());
        metadata.put("bestTimeToVisit", d.getBestTimeToVisit());

        return MapItemResponse.builder()
                .id("dest-" + d.getId())
                .itemId(d.getId())
                .type("DESTINATION")
                .name(d.getName())
                .category("DESTINATION_HUB")
                .description(d.getDescription())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .distanceKm(distanceKm)
                .destinationName(d.getName())
                .destinationId(d.getId())
                .imageUrl(d.getHeroImageUrl())
                .detailUrl("/destinations/" + (d.getSlug() != null ? d.getSlug() : d.getId()))
                .badgeText(Boolean.TRUE.equals(d.getIsFeatured()) ? "Featured Destination" : "Travel Hub")
                .source("CATALOGUE")
                .metadata(metadata)
                .build();
    }

    private MapItemResponse toPlaceMapItem(Place p, Double distanceKm) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("openingTime", p.getOpeningTime());
        metadata.put("closingTime", p.getClosingTime());
        metadata.put("entryFee", p.getEntryFee());

        String categoryName = p.getCategory() != null ? p.getCategory().name() : "HERITAGE";
        String destName = p.getDestination() != null ? p.getDestination().getName() : null;
        Long destId = p.getDestination() != null ? p.getDestination().getId() : null;

        return MapItemResponse.builder()
                .id("place-" + p.getId())
                .itemId(p.getId())
                .type("PLACE")
                .name(p.getName())
                .category(categoryName)
                .description(p.getDescription())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .distanceKm(distanceKm)
                .destinationName(destName)
                .destinationId(destId)
                .imageUrl(p.getImageUrl())
                .price(p.getEntryFee())
                .detailUrl(destId != null ? "/destinations/" + destId : "/places")
                .badgeText(categoryName)
                .source("CATALOGUE")
                .metadata(metadata)
                .build();
    }

    private MapItemResponse toHotelMapItem(Hotel h, BigDecimal lat, BigDecimal lng, Double distanceKm) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("address", h.getAddress());
        metadata.put("hasSwimmingPool", h.getHasSwimmingPool());
        metadata.put("hasWifi", h.getHasWifi());
        metadata.put("hasRestaurant", h.getHasRestaurant());

        String destName = h.getDestination() != null ? h.getDestination().getName() : null;
        Long destId = h.getDestination() != null ? h.getDestination().getId() : null;

        return MapItemResponse.builder()
                .id("hotel-" + h.getId())
                .itemId(h.getId())
                .type("HOTEL")
                .name(h.getName())
                .category("HOTEL")
                .description(h.getDescription())
                .latitude(lat)
                .longitude(lng)
                .distanceKm(distanceKm)
                .destinationName(destName)
                .destinationId(destId)
                .imageUrl(h.getHeroImageUrl())
                .price(h.getStartingPricePerNight())
                .rating(h.getStarRating())
                .detailUrl("/hotels/" + h.getId())
                .badgeText(h.getStarRating() != null ? h.getStarRating() + "★ Stay" : "Hotel Stay")
                .source("CATALOGUE")
                .metadata(metadata)
                .build();
    }
}
