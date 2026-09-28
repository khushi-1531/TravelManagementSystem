package com.travelsphere.repository;

import com.travelsphere.entity.HotelRoom;
import com.travelsphere.entity.enums.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRoomRepository extends JpaRepository<HotelRoom, Long> {
    List<HotelRoom> findByHotelId(Long hotelId);
    List<HotelRoom> findByHotelIdAndIsActiveTrue(Long hotelId);
    Optional<HotelRoom> findByIdAndIsActiveTrue(Long id);
    Optional<HotelRoom> findByHotelIdAndRoomType(Long hotelId, RoomType roomType);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT hr FROM HotelRoom hr WHERE hr.id = :id AND hr.isActive = true")
    Optional<HotelRoom> findByIdWithLock(@Param("id") Long id);
}
