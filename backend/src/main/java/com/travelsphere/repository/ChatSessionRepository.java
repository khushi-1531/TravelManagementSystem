package com.travelsphere.repository;

import com.travelsphere.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findBySessionUuid(String sessionUuid);
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);
}
