package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travelsphere.entity.enums.TargetType;
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
public class ReviewResponse {

    private Long id;
    private TargetType targetType;
    private Long targetId;
    private Integer rating;
    private String headline;
    private String reviewText;
    private Long userId;
    private String reviewerName;
    private String reviewerUsername;
    private Boolean isOwner;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
