package com.travelsphere.service.weather;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.config.WeatherProperties;
import com.travelsphere.dto.response.WeatherForecastDay;
import com.travelsphere.dto.response.WeatherResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Weather provider implementation integrating with OpenWeatherMap REST API.
 */
@Slf4j
@Component("openWeatherProvider")
@RequiredArgsConstructor
public class OpenWeatherProvider implements WeatherProvider {

    private final WeatherProperties weatherProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    @Override
    public WeatherResponse getWeather(double latitude, double longitude, String locationName) {
        BigDecimal latBd = BigDecimal.valueOf(latitude).setScale(4, RoundingMode.HALF_UP);
        BigDecimal lngBd = BigDecimal.valueOf(longitude).setScale(4, RoundingMode.HALF_UP);

        if (!isConfigured()) {
            log.info("OpenWeather API key not configured. Returning graceful unavailable status.");
            return WeatherResponse.unavailable(
                    locationName, latBd, lngBd,
                    "Live weather provider is not configured with an API key."
            );
        }

        try {
            // 1. Fetch Current Weather
            String currentWeatherUrl = String.format(
                    "%s/weather?lat=%.4f&lon=%.4f&appid=%s&units=metric",
                    weatherProperties.getBaseUrl(), latitude, longitude, weatherProperties.getApiKey()
            );

            HttpRequest currentRequest = HttpRequest.newBuilder()
                    .uri(URI.create(currentWeatherUrl))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofMillis(weatherProperties.getTimeoutMs()))
                    .GET()
                    .build();

            HttpResponse<String> currentResponse = httpClient.send(currentRequest, HttpResponse.BodyHandlers.ofString());

            if (currentResponse.statusCode() != 200) {
                log.warn("OpenWeather current weather returned HTTP {}", currentResponse.statusCode());
                return WeatherResponse.unavailable(
                        locationName, latBd, lngBd,
                        "External weather service responded with HTTP " + currentResponse.statusCode()
                );
            }

            JsonNode root = objectMapper.readTree(currentResponse.body());
            JsonNode main = root.path("main");
            JsonNode wind = root.path("wind");
            JsonNode weatherArr = root.path("weather");
            JsonNode firstWeather = (weatherArr.isArray() && !weatherArr.isEmpty()) ? weatherArr.get(0) : null;

            double temp = main.path("temp").asDouble(25.0);
            double feelsLike = main.path("feels_like").asDouble(temp);
            double tempMin = main.path("temp_min").asDouble(temp);
            double tempMax = main.path("temp_max").asDouble(temp);
            int humidity = main.path("humidity").asInt(50);
            int pressure = main.path("pressure").asInt(1013);
            double windSpeedKmH = Math.round(wind.path("speed").asDouble(0.0) * 3.6 * 10.0) / 10.0;
            int windDeg = wind.path("deg").asInt(0);

            String condition = firstWeather != null ? firstWeather.path("main").asText("Clear") : "Clear";
            String description = firstWeather != null ? firstWeather.path("description").asText("clear sky") : "clear sky";
            String icon = firstWeather != null ? firstWeather.path("icon").asText("01d") : "01d";
            String locName = (locationName != null && !locationName.isBlank()) ? locationName : root.path("name").asText("Region");

            // 2. Fetch Forecast (5-day / 3-hour)
            List<WeatherForecastDay> forecastDays = fetchForecast(latitude, longitude);

            // 3. Synthesize factual travel note
            String travelContext = generateTravelContext(temp, condition, rainLikely(condition, forecastDays), windSpeedKmH);

            return WeatherResponse.builder()
                    .locationName(locName)
                    .latitude(latBd)
                    .longitude(lngBd)
                    .temperature(Math.round(temp * 10.0) / 10.0)
                    .feelsLike(Math.round(feelsLike * 10.0) / 10.0)
                    .tempMin(Math.round(tempMin * 10.0) / 10.0)
                    .tempMax(Math.round(tempMax * 10.0) / 10.0)
                    .humidity(humidity)
                    .pressure(pressure)
                    .windSpeed(windSpeedKmH)
                    .windDirection(windDegToCardinal(windDeg))
                    .condition(condition)
                    .description(description)
                    .iconCode(icon)
                    .travelContext(travelContext)
                    .observedAt(Instant.now().toString())
                    .provider("OpenWeather")
                    .forecast(forecastDays)
                    .available(true)
                    .message("Current weather retrieved successfully.")
                    .build();

        } catch (Exception e) {
            log.warn("Failed to fetch weather from OpenWeather: {}", e.getMessage());
            return WeatherResponse.unavailable(
                    locationName, latBd, lngBd,
                    "Weather service temporarily unavailable."
            );
        }
    }

    private List<WeatherForecastDay> fetchForecast(double latitude, double longitude) {
        List<WeatherForecastDay> forecastDays = new ArrayList<>();
        try {
            String forecastUrl = String.format(
                    "%s/forecast?lat=%.4f&lon=%.4f&appid=%s&units=metric",
                    weatherProperties.getBaseUrl(), latitude, longitude, weatherProperties.getApiKey()
            );

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(forecastUrl))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofMillis(weatherProperties.getTimeoutMs()))
                    .GET()
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(res.body());
                JsonNode listNode = root.path("list");
                if (listNode.isArray()) {
                    Map<String, List<JsonNode>> dayMap = new LinkedHashMap<>();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

                    for (JsonNode item : listNode) {
                        long dt = item.path("dt").asLong();
                        LocalDate date = Instant.ofEpochSecond(dt).atZone(ZoneId.systemDefault()).toLocalDate();
                        String dateStr = date.format(formatter);
                        dayMap.computeIfAbsent(dateStr, k -> new ArrayList<>()).add(item);
                    }

                    int count = 0;
                    for (Map.Entry<String, List<JsonNode>> entry : dayMap.entrySet()) {
                        if (count >= 5) break;
                        LocalDate entryDate = LocalDate.parse(entry.getKey());
                        List<JsonNode> samples = entry.getValue();

                        double min = Double.MAX_VALUE;
                        double max = -Double.MAX_VALUE;
                        String cond = "Clear";
                        String desc = "clear sky";
                        String icon = "01d";
                        double maxWind = 0.0;
                        int maxPop = 0;

                        for (JsonNode s : samples) {
                            JsonNode m = s.path("main");
                            double tMin = m.path("temp_min").asDouble();
                            double tMax = m.path("temp_max").asDouble();
                            if (tMin < min) min = tMin;
                            if (tMax > max) max = tMax;

                            JsonNode w = s.path("wind");
                            double wSpeed = w.path("speed").asDouble() * 3.6;
                            if (wSpeed > maxWind) maxWind = wSpeed;

                            int pop = (int) Math.round(s.path("pop").asDouble(0.0) * 100);
                            if (pop > maxPop) maxPop = pop;

                            // Sample middle of the day for representative weather
                            JsonNode wArr = s.path("weather");
                            if (wArr.isArray() && !wArr.isEmpty()) {
                                cond = wArr.get(0).path("main").asText(cond);
                                desc = wArr.get(0).path("description").asText(desc);
                                icon = wArr.get(0).path("icon").asText(icon);
                            }
                        }

                        forecastDays.add(WeatherForecastDay.builder()
                                .date(entry.getKey())
                                .dayOfWeek(entryDate.getDayOfWeek().name().substring(0, 1) + entryDate.getDayOfWeek().name().substring(1).toLowerCase())
                                .tempMin(Math.round(min * 10.0) / 10.0)
                                .tempMax(Math.round(max * 10.0) / 10.0)
                                .condition(cond)
                                .description(desc)
                                .iconCode(icon)
                                .precipitationProbability(maxPop)
                                .windSpeed(Math.round(maxWind * 10.0) / 10.0)
                                .build());
                        count++;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not retrieve forecast items from OpenWeather: {}", ex.getMessage());
        }
        return forecastDays;
    }

    private String generateTravelContext(double temp, String condition, boolean rainLikely, double windSpeed) {
        StringBuilder sb = new StringBuilder();
        if (temp >= 32.0) {
            sb.append("Hot conditions (").append(Math.round(temp)).append("°C). Stay hydrated and use sun protection. ");
        } else if (temp <= 12.0) {
            sb.append("Cool to cold conditions (").append(Math.round(temp)).append("°C). Warm layered clothing advised. ");
        } else {
            sb.append("Moderate temperatures (").append(Math.round(temp)).append("°C). Comfortable for outdoor sightseeing. ");
        }

        if (rainLikely || "Rain".equalsIgnoreCase(condition) || "Drizzle".equalsIgnoreCase(condition) || "Thunderstorm".equalsIgnoreCase(condition)) {
            sb.append("Rain or showers anticipated. Carry an umbrella or waterproof outerwear. ");
        } else if ("Clear".equalsIgnoreCase(condition)) {
            sb.append("Clear skies with good visibility for travel. ");
        }

        if (windSpeed >= 30.0) {
            sb.append("Breezy to windy conditions (").append(Math.round(windSpeed)).append(" km/h).");
        }
        return sb.toString().trim();
    }

    private boolean rainLikely(String condition, List<WeatherForecastDay> forecast) {
        if ("Rain".equalsIgnoreCase(condition) || "Thunderstorm".equalsIgnoreCase(condition)) return true;
        if (forecast != null && !forecast.isEmpty()) {
            return forecast.get(0).getPrecipitationProbability() != null && forecast.get(0).getPrecipitationProbability() >= 40;
        }
        return false;
    }

    private String windDegToCardinal(int deg) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        int idx = (int) Math.round(((deg % 360) / 45.0)) % 8;
        return directions[idx];
    }

    @Override
    public boolean isConfigured() {
        return weatherProperties.isConfigured();
    }

    @Override
    public String getProviderName() {
        return "OpenWeather";
    }
}
