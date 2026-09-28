package com.travelsphere.controller;

import com.travelsphere.dto.request.UpdateProfileRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.UserResponse;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse response = userService.getCurrentUser(currentUser);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully.", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse response = userService.updateProfile(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully.", response));
    }
}
