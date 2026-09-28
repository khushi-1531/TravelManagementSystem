package com.travelsphere.dto.request;

import com.travelsphere.entity.enums.BookingType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Booking type is required (HOTEL or PACKAGE)")
    private BookingType bookingType;

    @Size(max = 500, message = "Customer notes cannot exceed 500 characters")
    private String customerNotes;

    // Package booking fields
    @Positive(message = "Package ID must be greater than zero")
    private Long packageId;
    private LocalDate startDate;
    @Positive(message = "Guests count must be at least 1")
    @Max(value = 50, message = "Guests count cannot exceed 50")
    private Integer guestsCount;

    // Hotel booking fields
    @Positive(message = "Hotel room ID must be greater than zero")
    private Long hotelRoomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    @Positive(message = "Rooms count must be at least 1")
    @Max(value = 20, message = "Rooms count cannot exceed 20")
    private Integer roomsCount;
}
