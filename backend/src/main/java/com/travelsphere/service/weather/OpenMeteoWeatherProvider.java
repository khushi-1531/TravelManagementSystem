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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Open-access weather provider using Open-Meteo API.
 * Requires no private API keys; provides immediate out-of-the-box live weather and forecasts.
 */
@Slf4j
@Component("openMeteoWeatherProvider")
@RequiredArgsConstructor
public class OpenMeteoWeatherProvider implements WeatherProvider {

    private final WeatherProperties weatherProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    @Override
    public WeatherResponse getWeather(double latitude, double longitude, String locationName) {
        BigDecimal latBd = BigDecimal.valueOf(latitude).setScale(4, RoundingMode.HALF_UP);
        BigDecimal lngBd = BigDecimal.valueOf(longitude).setScale(4, RoundingMode.HALF_UP);

        try {
            String url = String.format(
                    "%s/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto",
                    weatherProperties.getOpenMeteoBaseUrl(), latitude, longitude
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("User-Agent", "TravelSphere-Weather/1.0")
                    .timeout(Duration.ofMillis(weatherProperties.getTimeoutMs()))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Open-Meteo returned HTTP status {}: {}", response.statusCode(), response.body());
                return WeatherResponse.unavailable(
                        locationName, latBd, lngBd,
                        "Open-Meteo service responded with HTTP " + response.statusCode()
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode current = root.path("current");

            double temp = current.path("temperature_2m").asDouble(25.0);
            double feelsLike = current.path("apparent_temperature").asDouble(temp);
            int humidity = current.path("relative_humidity_2m").asInt(50);
            int pressure = (int) Math.round(current.path("surface_pressure").asDouble(1013.0));
            double windSpeed = current.path("wind_speed_10m").asDouble(0.0);
            int windDir = current.path("wind_direction_10m").asInt(0);
            int wmoCode = current.path("weather_code").asInt(0);

            WmoInfo wmo = interpretWmoCode(wmoCode);

            // Daily forecast parsing
            List<WeatherForecastDay> forecastDays = parseDailyForecast(root.path("daily"));

            // Get day min/max from forecast day 0 if present
            double tempMin = temp - 3.0;
            double tempMax = temp + 3.0;
            if (!forecastDays.isEmpty()) {
                tempMin = forecastDays.get(0).getTempMin() != null ? forecastDays.get(0).getTempMin() : tempMin;
                tempMax = forecastDays.get(0).getTempMax() != null ? forecastDays.get(0).getTempMax() : tempMax;
            }

            String travelContext = generateTravelContext(temp, wmo.condition, wmo.isRain, windSpeed);

            return WeatherResponse.builder()
                    .locationName(locationName != null ? locationName : "Selected Region")
                    .latitude(latBd)
                    .longitude(lngBd)
                    .temperature(Math.round(temp * 10.0) / 10.0)
                    .feelsLike(Math.round(feelsLike * 10.0) / 10.0)
                    .tempMin(Math.round(tempMin * 10.0) / 10.0)
                    .tempMax(Math.round(tempMax * 10.0) / 10.0)
                    .humidity(humidity)
                    .pressure(pressure)
                    .windSpeed(Math.round(windSpeed * 10.0) / 10.0)
                    .windDirection(windDegToCardinal(windDir))
                    .condition(wmo.condition)
                    .description(wmo.description)
                    .iconCode(wmo.iconCode)
                    .travelContext(travelContext)
                    .observedAt(Instant.now().toString())
                    .provider("Open-Meteo")
                    .forecast(forecastDays)
                    .available(true)
                    .message("Weather retrieved successfully.")
                    .build();

        } catch (Exception e) {
            log.warn("Failed to fetch weather from Open-Meteo: {}", e.getMessage());
            return WeatherResponse.unavailable(
                    locationName, latBd, lngBd,
                    "Weather service temporarily unavailable."
            );
        }
    }

    private List<WeatherForecastDay> parseDailyForecast(JsonNode daily) {
        List<WeatherForecastDay> list = new ArrayList<>();
        if (daily == null || daily.isMissingNode()) return list;

        JsonNode timeArr = daily.path("time");
        JsonNode codeArr = daily.path("weather_code");
        JsonNode maxArr = daily.path("temperature_2m_max");
        JsonNode minArr = daily.path("temperature_2m_min");
        JsonNode popArr = daily.path("precipitation_probability_max");
        JsonNode windArr = daily.path("wind_speed_10m_max");

        int size = timeArr.size();
        for (int i = 0; i < Math.min(size, 5); i++) {
            String dateStr = timeArr.get(i).asText();
            LocalDate date = LocalDate.parse(dateStr);
            int code = codeArr.path(i).asInt(0);
            WmoInfo info = interpretWmoCode(code);

            list.add(WeatherForecastDay.builder()
                    .date(dateStr)
                    .dayOfWeek(date.getDayOfWeek().name().substring(0, 1) + date.getDayOfWeek().name().substring(1).toLowerCase())
                    .tempMin(Math.round(minArr.path(i).asDouble(20.0) * 10.0) / 10.0)
                    .tempMax(Math.round(maxArr.path(i).asDouble(28.0) * 10.0) / 10.0)
                    .condition(info.condition)
                    .description(info.description)
                    .iconCode(info.iconCode)
                    .precipitationProbability(popArr.path(i).asInt(0))
                    .windSpeed(Math.round(windArr.path(i).asDouble(10.0) * 10.0) / 10.0)
                    .build());
        }
        return list;
    }

    private String generateTravelContext(double temp, String condition, boolean rain, double windSpeed) {
        StringBuilder sb = new StringBuilder();
        if (temp >= 32.0) {
            sb.append("Hot conditions (").append(Math.round(temp)).append("°C). Light fabrics and hydration recommended. ");
        } else if (temp <= 12.0) {
            sb.append("Cool conditions (").append(Math.round(temp)).append("°C). Warm attire recommended for touring. ");
        } else {
            sb.append("Mild temperatures (").append(Math.round(temp)).append("°C). Favorable for sightseeing. ");
        }

        if (rain) {
            sb.append("Rain or showers anticipated. Consider indoor attractions or carry an umbrella. ");
        } else if ("Clear".equalsIgnoreCase(condition)) {
            sb.append("Pleasant clear skies with good visibility. ");
        }

        if (windSpeed >= 30.0) {
            sb.append("Breezy winds (").append(Math.round(windSpeed)).append(" km/h).");
        }
        return sb.toString().trim();
    }

    private WmoInfo interpretWmoCode(int code) {
        return switch (code) {
            case 0 -> new WmoInfo("Clear", "clear sky", "01d", false);
            case 1 -> new WmoInfo("Mainly Clear", "mainly clear sky", "02d", false);
            case 2 -> new WmoInfo("Partly Cloudy", "partly cloudy", "03d", false);
            case 3 -> new WmoInfo("Overcast", "overcast", "04d", false);
            case 45, 48 -> new WmoInfo("Fog", "foggy conditions", "50d", false);
            case 51, 53, 55 -> new WmoInfo("Drizzle", "light drizzle", "09d", true);
            case 61, 63, 65 -> new WmoInfo("Rain", "moderate rain", "10d", true);
            case 71, 73, 75, 77 -> new WmoInfo("Snow", "snowfall", "13d", false);
            case 80, 81, 82 -> new WmoInfo("Rain Showers", "rain showers", "09d", true);
            case 95, 96, 99 -> new WmoInfo("Thunderstorm", "thunderstorm", "11d", true);
            default -> new WmoInfo("Clouds", "cloudy conditions", "03d", false);
        };
    }

    private String windDegToCardinal(int deg) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        int idx = (int) Math.round(((deg % 360) / 45.0)) % 8;
        return directions[idx];
    }

    @Override
    public boolean isConfigured() {
        return true; // Zero-API-key open provider
    }

    @Override
    public String getProviderName() {
        return "Open-Meteo";
    }

    private record WmoInfo(String condition, String description, String iconCode, boolean isRain) {}
}
