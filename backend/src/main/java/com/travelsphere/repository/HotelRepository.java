package com.travelsphere.repository;

import com.travelsphere.entity.Hotel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {
    Optional<Hotel> findByUuid(String uuid);
    Optional<Hotel> findByUuidAndIsActiveTrue(String uuid);
    Optional<Hotel> findByName(String name);
    Optional<Hotel> findByIdAndIsActiveTrue(Long id);
    List<Hotel> findByDestinationId(Long destinationId);
    List<Hotel> findByDestinationIdAndIsActiveTrue(Long destinationId);
    Page<Hotel> findByIsActiveTrue(Pageable pageable);
}
