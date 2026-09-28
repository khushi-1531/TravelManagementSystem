package com.travelsphere.repository;

import com.travelsphere.entity.TravelPackage;
import com.travelsphere.entity.enums.PackageTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelPackageRepository extends JpaRepository<TravelPackage, Long>, JpaSpecificationExecutor<TravelPackage> {
    Optional<TravelPackage> findByUuid(String uuid);
    Optional<TravelPackage> findByUuidAndIsActiveTrue(String uuid);
    Optional<TravelPackage> findByIdAndIsActiveTrue(Long id);
    List<TravelPackage> findByDestinationId(Long destinationId);
    List<TravelPackage> findByDestinationIdAndIsActiveTrue(Long destinationId);
    List<TravelPackage> findByTier(PackageTier tier);
    List<TravelPackage> findByIsActiveTrue();
    Page<TravelPackage> findByIsActiveTrue(Pageable pageable);
}
