package com.travelsphere.service;

import com.travelsphere.dto.request.UpdateProfileRequest;
import com.travelsphere.dto.response.UserResponse;
import com.travelsphere.entity.CustomerProfile;
import com.travelsphere.entity.User;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.CustomerProfileRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId()).orElse(null);
        return AuthService.mapToUserResponse(user, profile);
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
            userRepository.save(user);
        }

        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    CustomerProfile newProfile = new CustomerProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (request.getPhoneCountryCode() != null) {
            profile.setPhoneCountryCode(request.getPhoneCountryCode().trim());
        }
        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getAddressLine() != null) {
            profile.setAddressLine(request.getAddressLine().trim());
        }
        if (request.getCity() != null) {
            profile.setCity(request.getCity().trim());
        }
        if (request.getState() != null) {
            profile.setState(request.getState().trim());
        }
        if (request.getCountry() != null) {
            profile.setCountry(request.getCountry().trim());
        }
        if (request.getPostalCode() != null) {
            profile.setPostalCode(request.getPostalCode().trim());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl().trim());
        }

        CustomerProfile savedProfile = customerProfileRepository.save(profile);
        log.info("Updated customer profile for user: {}", user.getUsername());

        return AuthService.mapToUserResponse(user, savedProfile);
    }
}
