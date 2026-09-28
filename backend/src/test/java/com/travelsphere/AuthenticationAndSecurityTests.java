package com.travelsphere;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.dto.request.*;
import com.travelsphere.entity.PasswordResetToken;
import com.travelsphere.entity.Role;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.RoleType;
import com.travelsphere.entity.enums.UserStatus;
import com.travelsphere.repository.PasswordResetTokenRepository;
import com.travelsphere.repository.RefreshTokenRepository;
import com.travelsphere.repository.RoleRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.JwtTokenProvider;
import com.travelsphere.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthenticationAndSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthService authService;

    private Role userRole;
    private Role adminRole;

    @BeforeEach
    void setUpRoles() {
        userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_USER, "Customer")));
        adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_ADMIN, "Admin")));
    }

    private User createTestUser(String username, String email, String rawPassword, boolean isAdmin, boolean reqPasswordChange) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User();
            user.setUuid(UUID.randomUUID().toString());
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setFullName("Test User " + username);
            user.setStatus(UserStatus.ACTIVE);
            user.setRequiresPasswordChange(reqPasswordChange);
            Set<Role> roles = new HashSet<>();
            roles.add(userRole);
            if (isAdmin) {
                roles.add(adminRole);
            }
            user.setRoles(roles);
            return userRepository.save(user);
        });
    }

    private String obtainAccessToken(String username, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier(username)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("accessToken").asText();
    }

    // -------------------------------------------------------------
    // Test 1: Successful Registration
    // -------------------------------------------------------------
    @Test
    @Order(1)
    @DisplayName("1. Successful Registration - Valid Payload")
    void test01_successfulRegistration() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest req = RegisterRequest.builder()
                .username("reguser_" + suffix)
                .email("reguser_" + suffix + "@example.com")
                .password("SecureP@ss123")
                .confirmPassword("SecureP@ss123")
                .fullName("Registered User")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.uuid").isNotEmpty())
                .andExpect(jsonPath("$.data.username").value(req.getUsername()))
                .andExpect(jsonPath("$.data.email").value(req.getEmail()))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_USER")))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        User persisted = userRepository.findByUsername(req.getUsername()).orElseThrow();
        assertTrue(persisted.getPasswordHash().startsWith("$2a$12$") || persisted.getPasswordHash().startsWith("$2a$") || persisted.getPasswordHash().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches("SecureP@ss123", persisted.getPasswordHash()));
    }

    // -------------------------------------------------------------
    // Test 2: Duplicate Username
    // -------------------------------------------------------------
    @Test
    @Order(2)
    @DisplayName("2. Duplicate Username Rejection (409 Conflict)")
    void test02_duplicateUsername() throws Exception {
        String username = "dupuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "1@example.com", "SecureP@ss123", false, false);

        RegisterRequest req = RegisterRequest.builder()
                .username(username)
                .email(username + "2@example.com")
                .password("SecureP@ss123")
                .confirmPassword("SecureP@ss123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    // -------------------------------------------------------------
    // Test 3: Duplicate Email
    // -------------------------------------------------------------
    @Test
    @Order(3)
    @DisplayName("3. Duplicate Email Rejection (409 Conflict)")
    void test03_duplicateEmail() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        String email = "dupemail_" + suffix + "@example.com";
        createTestUser("dupemailuser1_" + suffix, email, "SecureP@ss123", false, false);

        RegisterRequest req = RegisterRequest.builder()
                .username("dupemailuser2_" + suffix)
                .email(email)
                .password("SecureP@ss123")
                .confirmPassword("SecureP@ss123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    // -------------------------------------------------------------
    // Test 4: Weak Password
    // -------------------------------------------------------------
    @Test
    @Order(4)
    @DisplayName("4. Weak Password Validation Failure (400 Bad Request)")
    void test04_weakPassword() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("weakpassuser")
                .email("weakpass@example.com")
                .password("12345") // weak
                .confirmPassword("12345")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.validationErrors", hasItem(hasEntry("field", "password"))));
    }

    // -------------------------------------------------------------
    // Test 5: Password Mismatch
    // -------------------------------------------------------------
    @Test
    @Order(5)
    @DisplayName("5. Password Mismatch Validation Failure (400 Bad Request)")
    void test05_passwordMismatch() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("mismatchuser")
                .email("mismatch@example.com")
                .password("SecureP@ss123")
                .confirmPassword("DifferentP@ss456")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("PASSWORD_MISMATCH"));
    }

    // -------------------------------------------------------------
    // Test 6: Successful Login
    // -------------------------------------------------------------
    @Test
    @Order(6)
    @DisplayName("6. Successful Login (Returns Access JWT and Refresh Token)")
    void test06_successfulLogin() throws Exception {
        String username = "loginuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        LoginRequest req = LoginRequest.builder()
                .identifier(username)
                .password("SecureP@ss123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresInSeconds").value(900L))
                .andExpect(jsonPath("$.data.user.username").value(username))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());
    }

    // -------------------------------------------------------------
    // Test 7: Invalid Password
    // -------------------------------------------------------------
    @Test
    @Order(7)
    @DisplayName("7. Invalid Password Rejection (401 Unauthorized)")
    void test07_invalidPassword() throws Exception {
        String username = "invpassuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        LoginRequest req = LoginRequest.builder()
                .identifier(username)
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // -------------------------------------------------------------
    // Test 8: Unknown User
    // -------------------------------------------------------------
    @Test
    @Order(8)
    @DisplayName("8. Unknown User Rejection (401 Unauthorized)")
    void test08_unknownUser() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .identifier("nonexistentuser_999999")
                .password("SecureP@ss123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // -------------------------------------------------------------
    // Test 9: Access Protected Endpoint Without JWT
    // -------------------------------------------------------------
    @Test
    @Order(9)
    @DisplayName("9. Access Protected Endpoint Without JWT (401 Unauthorized)")
    void test09_accessProtectedEndpointWithoutJwt() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------
    // Test 10: Access Protected Endpoint With Valid JWT
    // -------------------------------------------------------------
    @Test
    @Order(10)
    @DisplayName("10. Access Protected Endpoint With Valid JWT (200 OK)")
    void test10_accessProtectedEndpointWithValidJwt() throws Exception {
        String username = "jwtuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);
        String token = obtainAccessToken(username, "SecureP@ss123");

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value(username));
    }

    // -------------------------------------------------------------
    // Test 11: Access Admin Endpoint As USER
    // -------------------------------------------------------------
    @Test
    @Order(11)
    @DisplayName("11. Access Admin Endpoint as Standard USER (403 Forbidden)")
    void test11_accessAdminEndpointAsUser() throws Exception {
        String username = "stduser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);
        String token = obtainAccessToken(username, "SecureP@ss123");

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------
    // Test 12: Access Admin Endpoint As ADMIN
    // -------------------------------------------------------------
    @Test
    @Order(12)
    @DisplayName("12. Access Admin Endpoint as ADMIN (200 OK)")
    void test12_accessAdminEndpointAsAdmin() throws Exception {
        String username = "adminuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "AdminP@ss123", true, false);
        String token = obtainAccessToken(username, "AdminP@ss123");

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.bookingStatusCounts").exists());
    }

    // -------------------------------------------------------------
    // Test 13: Get Current User Profile
    // -------------------------------------------------------------
    @Test
    @Order(13)
    @DisplayName("13. Get Current User Profile Details")
    void test13_getCurrentUser() throws Exception {
        String username = "profileuser_" + UUID.randomUUID().toString().substring(0, 6);
        User user = createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);
        String token = obtainAccessToken(username, "SecureP@ss123");

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.uuid").value(user.getUuid()))
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.email").value(user.getEmail()))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_USER")));
    }

    // -------------------------------------------------------------
    // Test 14: Update Own Profile
    // -------------------------------------------------------------
    @Test
    @Order(14)
    @DisplayName("14. Update Own Profile Fields")
    void test14_updateOwnProfile() throws Exception {
        String username = "updateuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);
        String token = obtainAccessToken(username, "SecureP@ss123");

        UpdateProfileRequest updateReq = UpdateProfileRequest.builder()
                .fullName("Updated Full Name")
                .phoneCountryCode("+91")
                .phoneNumber("9876543210")
                .addressLine("123 Palm Grove")
                .city("Bengaluru")
                .state("Karnataka")
                .country("India")
                .postalCode("560001")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Updated Full Name"))
                .andExpect(jsonPath("$.data.profile.phoneNumber").value("9876543210"))
                .andExpect(jsonPath("$.data.profile.city").value("Bengaluru"));
    }

    // -------------------------------------------------------------
    // Test 15: Attempt Unauthorized Profile Access (IDOR Prevention)
    // -------------------------------------------------------------
    @Test
    @Order(15)
    @DisplayName("15. Attempt Unauthorized Profile Access / IDOR Prevention")
    void test15_attemptUnauthorizedProfileAccess() throws Exception {
        String userA = "victimuser_" + UUID.randomUUID().toString().substring(0, 6);
        User victim = createTestUser(userA, userA + "@example.com", "SecureP@ss123", false, false);

        String userB = "attackeruser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(userB, userB + "@example.com", "SecureP@ss123", false, false);
        String attackerToken = obtainAccessToken(userB, "SecureP@ss123");

        // Attacker calls /users/me with their own JWT; system must NEVER expose victim's data
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + attackerToken)
                        .param("userId", victim.getId().toString())
                        .param("uuid", victim.getUuid()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(userB))
                .andExpect(jsonPath("$.data.username").value(not(victim.getUsername())));
    }

    // -------------------------------------------------------------
    // Test 16: Change Password
    // -------------------------------------------------------------
    @Test
    @Order(16)
    @DisplayName("16. Change Password and Verify Old Password Invalidation")
    void test16_changePassword() throws Exception {
        String username = "chgpwduser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "OldPassword123!", false, false);
        String token = obtainAccessToken(username, "OldPassword123!");

        ChangePasswordRequest chgReq = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123!")
                .newPassword("NewPassword456@")
                .confirmPassword("NewPassword456@")
                .build();

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chgReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Old password must fail login
        LoginRequest oldLogin = LoginRequest.builder().identifier(username).password("OldPassword123!").build();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // New password must succeed
        LoginRequest newLogin = LoginRequest.builder().identifier(username).password("NewPassword456@").build();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // -------------------------------------------------------------
    // Test 17: Forgot Password
    // -------------------------------------------------------------
    @Test
    @Order(17)
    @DisplayName("17. Forgot Password - Safe Generic Response")
    void test17_forgotPassword() throws Exception {
        String username = "forgotuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        // Existing email
        ForgotPasswordRequest reqExisting = ForgotPasswordRequest.builder()
                .email(username + "@example.com")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqExisting)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the account exists, password reset instructions have been sent."));

        // Non-existent email (must return identical generic response)
        ForgotPasswordRequest reqNonExistent = ForgotPasswordRequest.builder()
                .email("ghost_nonexistent_999@example.com")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqNonExistent)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the account exists, password reset instructions have been sent."));
    }

    // -------------------------------------------------------------
    // Test 18: Reset Password
    // -------------------------------------------------------------
    @Test
    @Order(18)
    @DisplayName("18. Reset Password with Valid Token")
    void test18_resetPassword() throws Exception {
        String username = "resetuser_" + UUID.randomUUID().toString().substring(0, 6);
        User user = createTestUser(username, username + "@example.com", "OldPassword123!", false, false);

        String rawToken = authService.forgotPassword(ForgotPasswordRequest.builder().email(user.getEmail()).build());
        assertNotNull(rawToken);

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("BrandNewP@ss789")
                .confirmPassword("BrandNewP@ss789")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Login with new password works
        LoginRequest loginReq = LoginRequest.builder().identifier(username).password("BrandNewP@ss789").build();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------
    // Test 19: Expired Reset Token
    // -------------------------------------------------------------
    @Test
    @Order(19)
    @DisplayName("19. Expired Reset Token Rejection (400 Bad Request)")
    void test19_expiredResetToken() throws Exception {
        String username = "expireduser_" + UUID.randomUUID().toString().substring(0, 6);
        User user = createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        String rawToken = tokenProvider.generateSecureRandomToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenProvider.hashSha256(rawToken));
        resetToken.setExpiresAt(LocalDateTime.now().minusMinutes(10)); // Expired in past
        resetToken.setIsUsed(false);
        passwordResetTokenRepository.save(resetToken);

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("BrandNewP@ss789")
                .confirmPassword("BrandNewP@ss789")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_EXPIRED"));
    }

    // -------------------------------------------------------------
    // Test 20: Reused Reset Token
    // -------------------------------------------------------------
    @Test
    @Order(20)
    @DisplayName("20. Reused Reset Token Rejection (400 Bad Request)")
    void test20_reusedResetToken() throws Exception {
        String username = "reusedtokenuser_" + UUID.randomUUID().toString().substring(0, 6);
        User user = createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        String rawToken = tokenProvider.generateSecureRandomToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenProvider.hashSha256(rawToken));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetToken.setIsUsed(true); // Already used!
        passwordResetTokenRepository.save(resetToken);

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("BrandNewP@ss789")
                .confirmPassword("BrandNewP@ss789")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_ALREADY_USED"));
    }

    // -------------------------------------------------------------
    // Test 21: Logout Invalidates Refresh Token
    // -------------------------------------------------------------
    @Test
    @Order(21)
    @DisplayName("21. Logout Invalidates Refresh Token")
    void test21_logout() throws Exception {
        String username = "logoutuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        LoginRequest loginReq = LoginRequest.builder().identifier(username).password("SecureP@ss123").build();
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = json.path("data").path("accessToken").asText();
        String refreshToken = json.path("data").path("refreshToken").asText();

        // Logout
        RefreshTokenRequest logoutReq = RefreshTokenRequest.builder().refreshToken(refreshToken).build();
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk());

        // Attempt to use the refresh token must now fail
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder().refreshToken(refreshToken).build();
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------
    // Test 22: Refresh Token Yields New Access Token and Rotates
    // -------------------------------------------------------------
    @Test
    @Order(22)
    @DisplayName("22. Refresh Token Flow & Secure Rotation")
    void test22_refreshToken() throws Exception {
        String username = "refreshuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        LoginRequest loginReq = LoginRequest.builder().identifier(username).password("SecureP@ss123").build();
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String oldRefreshToken = json.path("data").path("refreshToken").asText();

        // Use refresh token
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder().refreshToken(oldRefreshToken).build();
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String newAccessToken = refreshJson.path("data").path("accessToken").asText();
        String newRefreshToken = refreshJson.path("data").path("refreshToken").asText();

        assertNotEquals(oldRefreshToken, newRefreshToken);

        // New access token can access protected endpoint
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + newAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(username));
    }

    // -------------------------------------------------------------
    // Test 23: Revoked Refresh Token Rejection
    // -------------------------------------------------------------
    @Test
    @Order(23)
    @DisplayName("23. Revoked Refresh Token Rejection (401 Unauthorized)")
    void test23_revokedRefreshToken() throws Exception {
        String username = "rotuser_" + UUID.randomUUID().toString().substring(0, 6);
        createTestUser(username, username + "@example.com", "SecureP@ss123", false, false);

        LoginRequest loginReq = LoginRequest.builder().identifier(username).password("SecureP@ss123").build();
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String oldRefreshToken = json.path("data").path("refreshToken").asText();

        // Rotate once
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(RefreshTokenRequest.builder().refreshToken(oldRefreshToken).build())))
                .andExpect(status().isOk());

        // Attempting to reuse old rotated refresh token must fail
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(RefreshTokenRequest.builder().refreshToken(oldRefreshToken).build())))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------
    // Test 24: Initial Admin Password Change Requirement
    // -------------------------------------------------------------
    @Test
    @Order(24)
    @DisplayName("24. Initial Admin Forced Password Change Before Admin Access")
    void test24_initialAdminPasswordChangeRequirement() throws Exception {
        String adminName = "initadmin_" + UUID.randomUUID().toString().substring(0, 6);
        // Created with requires_password_change = true
        createTestUser(adminName, adminName + "@travelsphere.com", "InitialTempPass123!", true, true);

        // Login as initial admin
        String adminToken = obtainAccessToken(adminName, "InitialTempPass123!");

        // Accessing admin dashboard should be blocked with 403 and PASSWORD_CHANGE_REQUIRED
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("PASSWORD_CHANGE_REQUIRED"));

        // Change password
        ChangePasswordRequest chgReq = ChangePasswordRequest.builder()
                .currentPassword("InitialTempPass123!")
                .newPassword("PermSecureAdminPass123@")
                .confirmPassword("PermSecureAdminPass123@")
                .build();

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chgReq)))
                .andExpect(status().isOk());

        // Login with new permanent password
        String newAdminToken = obtainAccessToken(adminName, "PermSecureAdminPass123@");

        // Now admin dashboard access must succeed
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + newAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.bookingStatusCounts").exists());
    }
}
