package com.travelsphere.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "TravelSphere Backend API");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());

        // Check MySQL database connectivity
        Map<String, Object> dbHealth = new LinkedHashMap<>();
        try {
            Integer queryResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (queryResult != null && queryResult == 1) {
                dbHealth.put("status", "UP");
                dbHealth.put("database", "MySQL 8.x");

                // Count total tables in database
                Integer tableCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()",
                        Integer.class
                );
                dbHealth.put("tableCount", tableCount);
            } else {
                dbHealth.put("status", "DEGRADED");
            }
        } catch (Exception ex) {
            log.error("Database health check failed", ex);
            dbHealth.put("status", "DOWN");
            dbHealth.put("error", "Database connection unavailable");
            response.put("status", "DEGRADED");
        }

        response.put("database", dbHealth);

        return ResponseEntity.ok(response);
    }
}
