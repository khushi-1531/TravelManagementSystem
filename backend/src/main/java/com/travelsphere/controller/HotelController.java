package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.HotelResponse;
import com.travelsphere.dto.response.HotelRoomResponse;
import com.travelsphere.dto.response.PageResponse;
import com.travelsphere.service.HotelRoomService;
import com.travelsphere.service.HotelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;
    private final HotelRoomService hotelRoomService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<HotelResponse>>> getHotels(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "rating_desc") String sort) {

        PageResponse<HotelResponse> response = hotelService.getHotels(
                destinationId, minPrice, maxPrice, minRating, query, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Hotels retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HotelResponse>> getHotelById(@PathVariable String id) {
        HotelResponse response = hotelService.getHotelById(id);
        return ResponseEntity.ok(ApiResponse.success("Hotel retrieved successfully", response));
    }

    @GetMapping("/{hotelId}/rooms")
    public ResponseEntity<ApiResponse<List<HotelRoomResponse>>> getRoomsByHotel(@PathVariable Long hotelId) {
        List<HotelRoomResponse> rooms = hotelRoomService.getRoomsByHotel(hotelId);
        return ResponseEntity.ok(ApiResponse.success("Hotel rooms retrieved successfully", rooms));
    }
}
