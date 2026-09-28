package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travelsphere.entity.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WishlistItemResponse {

    private Long id;
    private TargetType targetType;
    private Long targetId;
    private String title;
    private String imageUrl;
    private String location;
    private BigDecimal price;
    private Double rating;
    private String linkUrl;
    private LocalDateTime createdAt;
}
