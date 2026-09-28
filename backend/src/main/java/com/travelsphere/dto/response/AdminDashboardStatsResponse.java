package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminDashboardStatsResponse {

    private long totalUsers;
    private long totalDestinations;
    private long totalHotels;
    private long totalPackages;
    private long totalBookings;
    private long totalReviews;
    private long totalWishlists;
    private BigDecimal totalRevenue;

    private Map<String, Long> bookingStatusCounts;
    private Map<String, Long> paymentStatusCounts;

    private List<BookingResponse> recentBookings;
    private List<PaymentAttemptResponse> recentPayments;
}
