package com.travelsphere.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @Size(max = 10, message = "Country code cannot exceed 10 characters")
    @Pattern(regexp = "^$|^\\+[0-9]{1,5}$", message = "Phone country code must start with + followed by 1 to 5 digits")
    private String phoneCountryCode;

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Pattern(regexp = "^$|^[0-9]{7,15}$", message = "Phone number must be between 7 and 15 digits")
    private String phoneNumber;

    @Size(max = 255, message = "Address line cannot exceed 255 characters")
    private String addressLine;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    @Size(max = 500, message = "Avatar URL cannot exceed 500 characters")
    private String avatarUrl;
}
