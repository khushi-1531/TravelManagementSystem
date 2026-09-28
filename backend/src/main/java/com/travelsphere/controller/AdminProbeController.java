package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminProbeController {

    @GetMapping("/probe")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminProbe() {
        return ResponseEntity.ok(ApiResponse.success("Admin probe accessed successfully.", Map.of(
                "systemStatus", "OPERATIONAL",
                "role", "ROLE_ADMIN"
        )));
    }
}
