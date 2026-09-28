package com.travelsphere.repository;

import com.travelsphere.entity.HotelBookingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HotelBookingItemRepository extends JpaRepository<HotelBookingItem, Long> {
    List<HotelBookingItem> findByBookingId(Long bookingId);

    @Query("SELECT COALESCE(SUM(hbi.roomsCount), 0L) FROM HotelBookingItem hbi " +
           "JOIN hbi.booking b " +
           "WHERE hbi.hotelRoom.id = :roomId " +
           "AND b.status != com.travelsphere.entity.enums.BookingStatus.CANCELLED " +
           "AND hbi.checkInDate < :checkOutDate " +
           "AND hbi.checkOutDate > :checkInDate")
    Long countBookedRooms(@Param("roomId") Long roomId,
                          @Param("checkInDate") LocalDate checkInDate,
                          @Param("checkOutDate") LocalDate checkOutDate);
}
