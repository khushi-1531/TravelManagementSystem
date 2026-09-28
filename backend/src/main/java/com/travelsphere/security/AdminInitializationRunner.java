package com.travelsphere.security;

import com.travelsphere.entity.CustomerProfile;
import com.travelsphere.entity.Role;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.RoleType;
import com.travelsphere.entity.enums.UserStatus;
import com.travelsphere.repository.CustomerProfileRepository;
import com.travelsphere.repository.RoleRepository;
import com.travelsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializationRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin.username:}")
    private String adminUsername;

    @Value("${app.initial-admin.email:}")
    private String adminEmail;

    @Value("${app.initial-admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure roles exist
        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_ADMIN, "Full administrative privileges")));

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_USER, "Standard registered customer account with booking privileges")));

        // Check if any admin already exists in system
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN));

        if (adminExists) {
            log.info("Administrator account already exists in database. Skipping initialization.");
            return;
        }

        // Verify credentials provided via environment
        if (!StringUtils.hasText(adminUsername) || !StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("================================================================================");
            log.warn("SECURITY NOTICE: Initial administrator environment variables not set!");
            log.warn("Set TRAVELSPHERE_INITIAL_ADMIN_USERNAME, TRAVELSPHERE_INITIAL_ADMIN_EMAIL, and");
            log.warn("TRAVELSPHERE_INITIAL_ADMIN_PASSWORD to bootstrap the primary admin account.");
            log.warn("================================================================================");
            return;
        }

        Optional<User> existingUser = userRepository.findByUsername(adminUsername);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.getRoles().add(adminRole);
            userRepository.save(user);
            log.info("Granted ROLE_ADMIN to existing user: {}", adminUsername);
            return;
        }

        // Create initial admin with BCrypt hashed password and forced password change
        User newAdmin = new User();
        newAdmin.setUsername(adminUsername.trim());
        newAdmin.setEmail(adminEmail.trim().toLowerCase());
        newAdmin.setPasswordHash(passwordEncoder.encode(adminPassword));
        newAdmin.setFullName("System Administrator");
        newAdmin.setStatus(UserStatus.ACTIVE);
        newAdmin.setRequiresPasswordChange(true);
        newAdmin.setRoles(new HashSet<>());
        newAdmin.getRoles().add(adminRole);

        User savedAdmin = userRepository.save(newAdmin);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(savedAdmin);
        customerProfileRepository.save(profile);

        log.info("================================================================================");
        log.info("SECURITY: Initial Administrator initialized successfully!");
        log.info("Username: {}", savedAdmin.getUsername());
        log.info("Email:    {}", savedAdmin.getEmail());
        log.info("Flag:     requires_password_change = true");
        log.info("NOTE: Password was securely hashed with BCrypt. Plaintext password was not stored.");
        log.info("================================================================================");
    }
}
