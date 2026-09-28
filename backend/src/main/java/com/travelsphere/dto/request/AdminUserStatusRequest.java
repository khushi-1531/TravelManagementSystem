package com.travelsphere.dto.request;

import com.travelsphere.entity.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusRequest {

    @NotNull(message = "User status is required (ACTIVE, SUSPENDED, PENDING_VERIFICATION)")
    private UserStatus status;
}
