package com.travelsphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    private String identifier;

    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

    public String getEffectiveIdentifier() {
        if (StringUtils.hasText(identifier)) {
            return identifier.trim();
        }
        if (StringUtils.hasText(usernameOrEmail)) {
            return usernameOrEmail.trim();
        }
        return "";
    }
}
