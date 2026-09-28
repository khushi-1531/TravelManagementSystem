package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private Long id;
    private String uuid;
    private String username;
    private String email;
    private String fullName;
    private String status;
    private Boolean requiresPasswordChange;
    private List<String> roles;
    private CustomerProfileResponse profile;
}
