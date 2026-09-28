package com.travelsphere.repository;

import com.travelsphere.entity.PackageBookingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageBookingItemRepository extends JpaRepository<PackageBookingItem, Long> {
    List<PackageBookingItem> findByBookingId(Long bookingId);
}
