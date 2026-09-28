package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Daily forecast item for multi-day travel outlook.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WeatherForecastDay {

    /** ISO date string, e.g., '2026-09-23' */
    private String date;

    /** Day name, e.g., 'Wednesday' */
    private String dayOfWeek;

    /** Minimum temperature in Celsius */
    private Double tempMin;

    /** Maximum temperature in Celsius */
    private Double tempMax;

    /** Primary weather condition keyword: 'Clear', 'Clouds', 'Rain', etc. */
    private String condition;

    /** Human-readable weather description */
    private String description;

    /** Standard icon identifier */
    private String iconCode;

    /** Precipitation chance in percentage (0-100), if provided */
    private Integer precipitationProbability;

    /** Maximum expected wind speed in km/h */
    private Double windSpeed;
}
