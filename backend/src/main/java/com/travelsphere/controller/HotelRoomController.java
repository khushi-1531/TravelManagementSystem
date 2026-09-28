package com.travelsphere.controller;

import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.HotelRoomResponse;
import com.travelsphere.service.HotelRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hotel-rooms")
@RequiredArgsConstructor
public class HotelRoomController {

    private final HotelRoomService hotelRoomService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HotelRoomResponse>> getRoomById(@PathVariable Long id) {
        HotelRoomResponse response = hotelRoomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success("Hotel room retrieved successfully", response));
    }
}
