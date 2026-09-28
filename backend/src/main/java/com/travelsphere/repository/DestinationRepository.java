package com.travelsphere.repository;

import com.travelsphere.entity.Destination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long>, JpaSpecificationExecutor<Destination> {
    Optional<Destination> findByUuid(String uuid);
    Optional<Destination> findByName(String name);
    Optional<Destination> findBySlug(String slug);
    Optional<Destination> findBySlugAndIsPublishedTrue(String slug);
    Optional<Destination> findByIdAndIsPublishedTrue(Long id);
    Optional<Destination> findByUuidAndIsPublishedTrue(String uuid);
    List<Destination> findByIsFeaturedTrueAndIsPublishedTrue();
    Page<Destination> findByIsPublishedTrue(Pageable pageable);
}
