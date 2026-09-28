package com.travelsphere.repository;

import com.travelsphere.entity.Wishlist;
import com.travelsphere.entity.enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByUserId(Long userId);

    List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Wishlist> findByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    void deleteByUserIdAndTargetTypeAndTargetId(Long userId, TargetType targetType, Long targetId);

    long countByUserId(Long userId);
}
