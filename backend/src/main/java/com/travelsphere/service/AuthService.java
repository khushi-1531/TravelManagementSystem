package com.travelsphere.service;

import com.travelsphere.dto.request.*;
import com.travelsphere.dto.response.AuthResponse;
import com.travelsphere.dto.response.CustomerProfileResponse;
import com.travelsphere.dto.response.UserResponse;
import com.travelsphere.entity.CustomerProfile;
import com.travelsphere.entity.PasswordResetToken;
import com.travelsphere.entity.RefreshToken;
import com.travelsphere.entity.Role;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.RoleType;
import com.travelsphere.entity.enums.UserStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.DuplicateResourceException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.exception.UnauthorizedException;
import com.travelsphere.repository.CustomerProfileRepository;
import com.travelsphere.repository.PasswordResetTokenRepository;
import com.travelsphere.repository.RefreshTokenRepository;
import com.travelsphere.repository.RoleRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.JwtTokenProvider;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("PASSWORD_MISMATCH", "Password and confirm password do not match");
        }

        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("User", "username", username);
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User", "email", email);
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_USER, "Standard registered customer account")));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(StringUtils.hasText(request.getFullName()) ? request.getFullName().trim() : username);
        user.setStatus(UserStatus.ACTIVE);
        user.setRequiresPasswordChange(false);
        user.setRoles(new HashSet<>(List.of(userRole)));

        User savedUser = userRepository.save(user);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(savedUser);
        customerProfileRepository.save(profile);

        log.info("Successfully registered new user: {}", savedUser.getUsername());

        return mapToUserResponse(savedUser, profile);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEffectiveIdentifier();
        if (!StringUtils.hasText(identifier)) {
            throw new BadRequestException("BAD_REQUEST", "Username or email is required for login");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is suspended or pending verification");
        }

        String accessToken = tokenProvider.generateToken(authentication);
        String rawRefreshToken = tokenProvider.generateSecureRandomToken();
        String refreshTokenHash = tokenProvider.hashSha256(rawRefreshToken);

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        LocalDateTime refreshExpiry = LocalDateTime.now().plus(Duration.ofMillis(tokenProvider.getRefreshTokenExpirationMs()));
        RefreshToken refreshToken = new RefreshToken(user, refreshTokenHash, refreshExpiry);
        refreshTokenRepository.save(refreshToken);

        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId()).orElse(null);
        UserResponse userResponse = mapToUserResponse(user, profile);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(tokenProvider.getJwtExpirationMs() / 1000)
                .requiresPasswordChange(Boolean.TRUE.equals(user.getRequiresPasswordChange()))
                .user(userResponse)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String rawRefreshToken = request.getRefreshToken();
        if (!StringUtils.hasText(rawRefreshToken)) {
            throw new BadRequestException("BAD_REQUEST", "Refresh token is required");
        }

        String tokenHash = tokenProvider.hashSha256(rawRefreshToken.trim());

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (Boolean.TRUE.equals(refreshTokenEntity.getRevoked())) {
            log.warn("Attempt to use revoked refresh token for user id: {}", refreshTokenEntity.getUser().getId());
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        if (refreshTokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Attempt to use expired refresh token for user id: {}", refreshTokenEntity.getUser().getId());
            throw new UnauthorizedException("Refresh token has expired");
        }

        User user = refreshTokenEntity.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is suspended or inactive");
        }

        // Secure token rotation: revoke old token and issue new pair
        refreshTokenEntity.setRevoked(true);
        refreshTokenRepository.save(refreshTokenEntity);

        String newRawRefreshToken = tokenProvider.generateSecureRandomToken();
        String newRefreshTokenHash = tokenProvider.hashSha256(newRawRefreshToken);
        LocalDateTime newRefreshExpiry = LocalDateTime.now().plus(Duration.ofMillis(tokenProvider.getRefreshTokenExpirationMs()));

        RefreshToken newRefreshToken = new RefreshToken(user, newRefreshTokenHash, newRefreshExpiry);
        refreshTokenRepository.save(newRefreshToken);

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        String newAccessToken = tokenProvider.generateTokenFromUser(
                user.getId(),
                user.getUuid(),
                user.getUsername(),
                user.getEmail(),
                roles,
                Boolean.TRUE.equals(user.getRequiresPasswordChange())
        );

        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId()).orElse(null);
        UserResponse userResponse = mapToUserResponse(user, profile);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(tokenProvider.getJwtExpirationMs() / 1000)
                .requiresPasswordChange(Boolean.TRUE.equals(user.getRequiresPasswordChange()))
                .user(userResponse)
                .build();
    }

    @Transactional
    public void logout(String rawRefreshToken, UserPrincipal currentUser) {
        if (StringUtils.hasText(rawRefreshToken)) {
            String tokenHash = tokenProvider.hashSha256(rawRefreshToken.trim());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }

        if (currentUser != null) {
            userRepository.findById(currentUser.getId()).ifPresent(refreshTokenRepository::revokeAllByUser);
        }
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, UserPrincipal currentUser) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("PASSWORD_MISMATCH", "New password and confirm password do not match");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("INVALID_CREDENTIALS", "Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("PASSWORD_SAME", "New password cannot be the same as the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setRequiresPasswordChange(false);
        userRepository.save(user);

        // Revoke all existing refresh tokens
        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password successfully changed for user: {}", user.getUsername());
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String rawToken = tokenProvider.generateSecureRandomToken();
            String tokenHash = tokenProvider.hashSha256(rawToken);
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setTokenHash(tokenHash);
            resetToken.setExpiresAt(expiresAt);
            resetToken.setIsUsed(false);
            passwordResetTokenRepository.save(resetToken);

            log.info("Generated password reset token for user: {} (simulated email dispatch)", user.getEmail());
            return rawToken; // Returned internally or logged for testing
        }

        // Generic response to avoid account enumeration
        return null;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("PASSWORD_MISMATCH", "New password and confirm password do not match");
        }

        String rawToken = request.getToken().trim();
        String tokenHash = tokenProvider.hashSha256(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("INVALID_TOKEN", "Password reset token is invalid"));

        if (Boolean.TRUE.equals(resetToken.getIsUsed())) {
            throw new BadRequestException("TOKEN_ALREADY_USED", "Password reset token has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("TOKEN_EXPIRED", "Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setRequiresPasswordChange(false);
        userRepository.save(user);

        resetToken.setIsUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password successfully reset via token for user: {}", user.getUsername());
    }

    public static UserResponse mapToUserResponse(User user, CustomerProfile profile) {
        CustomerProfileResponse profileResponse = null;
        if (profile != null) {
            profileResponse = CustomerProfileResponse.builder()
                    .phoneCountryCode(profile.getPhoneCountryCode())
                    .phoneNumber(profile.getPhoneNumber())
                    .addressLine(profile.getAddressLine())
                    .city(profile.getCity())
                    .state(profile.getState())
                    .country(profile.getCountry())
                    .postalCode(profile.getPostalCode())
                    .avatarUrl(profile.getAvatarUrl())
                    .build();
        }

        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        return UserResponse.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus() != null ? user.getStatus().name() : UserStatus.ACTIVE.name())
                .requiresPasswordChange(Boolean.TRUE.equals(user.getRequiresPasswordChange()))
                .roles(roleNames)
                .profile(profileResponse)
                .build();
    }
}
