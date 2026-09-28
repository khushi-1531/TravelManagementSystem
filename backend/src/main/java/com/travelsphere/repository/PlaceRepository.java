package com.travelsphere.repository;

import com.travelsphere.entity.Place;
import com.travelsphere.entity.enums.PlaceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long>, JpaSpecificationExecutor<Place> {
    List<Place> findByDestinationId(Long destinationId);
    List<Place> findByDestinationIdAndIsActiveTrue(Long destinationId);
    List<Place> findByCategory(PlaceCategory category);
    List<Place> findByCategoryAndIsActiveTrue(PlaceCategory category);
    Optional<Place> findByIdAndIsActiveTrue(Long id);
    Page<Place> findByIsActiveTrue(Pageable pageable);
}
