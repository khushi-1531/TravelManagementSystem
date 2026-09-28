package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerProfileResponse {
    private String phoneCountryCode;
    private String phoneNumber;
    private String addressLine;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String avatarUrl;
}
