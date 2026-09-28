package com.travelsphere.repository;

import com.travelsphere.entity.PaymentAttempt;
import com.travelsphere.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    List<PaymentAttempt> findByBookingId(Long bookingId);
    Optional<PaymentAttempt> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentAttempt> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<PaymentAttempt> findByAttemptReference(String attemptReference);
    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);
    Optional<PaymentAttempt> findFirstByBookingIdAndStatus(Long bookingId, PaymentStatus status);
    List<PaymentAttempt> findByBookingBookingReferenceOrderByCreatedAtDesc(String bookingReference);

    Page<PaymentAttempt> findByStatus(PaymentStatus status, Pageable pageable);

    @Query("SELECT p.status, COUNT(p) FROM PaymentAttempt p GROUP BY p.status")
    List<Object[]> countPaymentsByStatus();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentAttempt p WHERE p.status = 'SUCCESS'")
    BigDecimal calculateTotalSuccessfulPayments();
}
