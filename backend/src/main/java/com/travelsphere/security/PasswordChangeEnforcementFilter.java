package com.travelsphere.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travelsphere.dto.response.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class PasswordChangeEnforcementFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    public PasswordChangeEnforcementFilter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {

            if (userPrincipal.isRequiresPasswordChange()) {
                String path = request.getRequestURI();

                // If accessing administrative functionality, block until password is changed
                if (path.startsWith("/api/v1/admin")) {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                    ApiErrorResponse errorResponse = ApiErrorResponse.builder()
                            .success(false)
                            .errorCode("PASSWORD_CHANGE_REQUIRED")
                            .message("Mandatory password change required before accessing administrative functionality. Please change your password at /api/v1/auth/change-password.")
                            .timestamp(LocalDateTime.now())
                            .path(path)
                            .build();

                    response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
