package com.travelsphere.repository;

import com.travelsphere.entity.Booking;
import com.travelsphere.entity.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {
    Optional<Booking> findByBookingReference(String bookingReference);
    Optional<Booking> findByIdAndUserId(Long id, Long userId);
    Optional<Booking> findByBookingReferenceAndUserId(String bookingReference, Long userId);
    boolean existsByBookingReference(String bookingReference);

    List<Booking> findByUserId(Long userId);
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);
    List<Booking> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, BookingStatus status);

    Page<Booking> findByUserId(Long userId, Pageable pageable);
    Page<Booking> findByUserIdAndStatus(Long userId, BookingStatus status, Pageable pageable);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("SELECT b FROM Booking b JOIN b.user u WHERE LOWER(b.bookingReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Booking> searchBookings(@Param("search") String search, Pageable pageable);

    @Query("SELECT b FROM Booking b JOIN b.user u WHERE b.status = :status AND (LOWER(b.bookingReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Booking> searchBookingsByStatus(@Param("status") BookingStatus status, @Param("search") String search, Pageable pageable);

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countBookingsByStatus();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = 'CONFIRMED'")
    BigDecimal calculateTotalRevenue();
}

