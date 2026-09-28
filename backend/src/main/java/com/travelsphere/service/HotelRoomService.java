package com.travelsphere.service;

import com.travelsphere.dto.response.HotelRoomResponse;
import com.travelsphere.entity.HotelRoom;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.HotelRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotelRoomService {

    private final HotelRoomRepository hotelRoomRepository;
    private final HotelRepository hotelRepository;

    @Transactional(readOnly = true)
    public List<HotelRoomResponse> getRoomsByHotel(Long hotelId) {
        if (!hotelRepository.existsById(hotelId)) {
            throw new ResourceNotFoundException("Hotel not found with id: " + hotelId);
        }
        return hotelRoomRepository.findByHotelIdAndIsActiveTrue(hotelId).stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HotelRoomResponse getRoomById(Long id) {
        HotelRoom room = hotelRoomRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel room not found with id: " + id));
        return mapToRoomResponse(room);
    }

    public HotelRoomResponse mapToRoomResponse(HotelRoom room) {
        return HotelRoomResponse.builder()
                .id(room.getId())
                .hotelId(room.getHotel() != null ? room.getHotel().getId() : null)
                .hotelName(room.getHotel() != null ? room.getHotel().getName() : null)
                .roomType(room.getRoomType() != null ? room.getRoomType().name() : null)
                .maxOccupancy(room.getMaxOccupancy())
                .hasAc(room.getHasAc())
                .isBreakfastIncluded(room.getIsBreakfastIncluded())
                .pricePerNight(room.getPricePerNight())
                .totalInventory(room.getTotalInventory())
                .availableInventory(room.getAvailableInventory())
                .isActive(room.getIsActive())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
