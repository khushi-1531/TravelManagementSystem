package com.travelsphere.dto.request;

import com.travelsphere.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBookingStatusRequest {

    @NotNull(message = "Booking status is required")
    private BookingStatus status;
}
