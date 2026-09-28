package com.travelsphere.config;

import com.travelsphere.security.CustomUserDetailsService;
import com.travelsphere.security.JwtAuthenticationEntryPoint;
import com.travelsphere.security.JwtAuthenticationFilter;
import com.travelsphere.security.PasswordChangeEnforcementFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 6.x Configuration for TravelSphere REST API.
 *
 * Security Architecture Notes:
 * 1. CSRF is disabled because this is a stateless REST API with authentication
 *    carried in the Authorization HTTP header (Bearer JWT). Web browsers do not
 *    automatically submit Authorization headers on cross-origin requests, eliminating
 *    traditional browser CSRF vectors.
 * 2. Session creation policy is set to STATELESS; no HTTP sessions are created or stored.
 * 3. Security response headers (HSTS, CSP, FrameOptions, X-Content-Type-Options, Referrer-Policy)
 *    are strictly configured according to SECURITY_DESIGN.md.
 * 4. PasswordChangeEnforcementFilter intercepts calls to administrative functionality
 *    if an account still has requires_password_change = true.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final PasswordChangeEnforcementFilter passwordChangeEnforcementFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsConfig;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS & CSRF
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                // HTTP Security Headers
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                        .contentTypeOptions(Customizer.withDefaults())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                        )
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                        )
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; script-src 'self' https://checkout.razorpay.com; img-src 'self' data: https:; frame-ancestors 'none';")
                        )
                )

                // Exception Handling
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

                // Stateless Session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                .authorizeHttpRequests(authorize -> authorize
                        // Health check & actuator endpoints
                        .requestMatchers("/api/v1/health/**").permitAll()
                        .requestMatchers("/actuator/health/**").permitAll()

                        // Public authentication endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/reset-password"
                        ).permitAll()

                        // Authenticated authentication endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/logout",
                                "/api/v1/auth/change-password"
                        ).authenticated()

                        // User profile, booking, and payment endpoints
                        .requestMatchers("/api/v1/users/me").authenticated()
                        .requestMatchers("/api/v1/bookings/**").authenticated()
                        .requestMatchers("/api/v1/payments/**").authenticated()

                        // AI Chat assistant endpoints
                        .requestMatchers(HttpMethod.POST, "/api/v1/chat/message").permitAll()
                        .requestMatchers("/api/v1/chat/sessions/**").authenticated()
                        .requestMatchers("/api/v1/chat/**").authenticated()

                        // Wishlist and User Review endpoints (require authentication)
                        .requestMatchers("/api/v1/wishlist/**").authenticated()
                        .requestMatchers("/api/v1/reviews/me").authenticated()
                        .requestMatchers("/api/v1/reviews/*/*/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/reviews/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/reviews/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/reviews/**").authenticated()

                        // Public discovery endpoints (read-only)
                        .requestMatchers(HttpMethod.GET, "/api/v1/destinations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/places/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/hotels/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/hotel-rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/packages/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/weather/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/map/**").permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(passwordChangeEnforcementFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = new ArrayList<>();
        if (StringUtils.hasText(allowedOriginsConfig)) {
            for (String origin : allowedOriginsConfig.split(",")) {
                if (StringUtils.hasText(origin)) {
                    origins.add(origin.trim());
                }
            }
        }
        if (origins.isEmpty()) {
            origins.add("http://localhost:5173");
            origins.add("http://localhost:3000");
        }

        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
