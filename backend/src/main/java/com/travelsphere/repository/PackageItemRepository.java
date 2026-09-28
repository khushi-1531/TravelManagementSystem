package com.travelsphere.repository;

import com.travelsphere.entity.PackageItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageItemRepository extends JpaRepository<PackageItem, Long> {
    List<PackageItem> findByTravelPackageIdOrderByDayNumberAsc(Long packageId);
}
