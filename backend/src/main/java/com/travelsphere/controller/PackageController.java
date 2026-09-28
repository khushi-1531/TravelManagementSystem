package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.PackageItemResponse;
import com.travelsphere.dto.response.PackageResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.entity.enums.PackageTier;
import com.travelsphere.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getPackages(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) PackageTier tier,
            @RequestParam(required = false) Integer durationDays,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "price_asc") String sort) {

        PageResponse<PackageResponse> response = packageService.getPackages(
                destinationId, tier, durationDays, minPrice, maxPrice, query, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Travel packages retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> getPackageById(@PathVariable String id) {
        PackageResponse response = packageService.getPackageById(id);
        return ResponseEntity.ok(ApiResponse.success("Travel package retrieved successfully", response));
    }

    @GetMapping("/{packageId}/items")
    public ResponseEntity<ApiResponse<List<PackageItemResponse>>> getPackageItems(@PathVariable Long packageId) {
        List<PackageItemResponse> items = packageService.getPackageItems(packageId);
        return ResponseEntity.ok(ApiResponse.success("Package items retrieved successfully", items));
    }
}
