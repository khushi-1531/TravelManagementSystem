package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PackageItemResponse {
    private Long id;
    private Long packageId;
    private Integer dayNumber;
    private String activityTitle;
    private String activityDescription;
    private Boolean isMealsIncluded;
    private LocalDateTime createdAt;
}
