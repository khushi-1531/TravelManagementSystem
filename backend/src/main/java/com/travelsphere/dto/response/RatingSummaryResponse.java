package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travelsphere.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RatingSummaryResponse {

    private TargetType targetType;
    private Long targetId;
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution;
}
