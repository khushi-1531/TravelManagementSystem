package com.travelsphere.repository;

import com.travelsphere.entity.Review;
import com.travelsphere.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByTargetTypeAndTargetId(TargetType targetType, Long targetId, Pageable pageable);

    List<Review> findByTargetTypeAndTargetId(TargetType targetType, Long targetId);

    Optional<Review> findByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    List<Review> findByUserId(Long userId);

    Page<Review> findByUserId(Long userId, Pageable pageable);

    Page<Review> findByTargetType(TargetType targetType, Pageable pageable);

    Page<Review> findByRating(Integer rating, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    Double calculateAverageRating(@Param("targetType") TargetType targetType, @Param("targetId") Long targetId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    Long countByTargetTypeAndTargetId(@Param("targetType") TargetType targetType, @Param("targetId") Long targetId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId GROUP BY r.rating")
    List<Object[]> getRatingDistribution(@Param("targetType") TargetType targetType, @Param("targetId") Long targetId);
}
