package com.tradepro.repository;

import com.tradepro.entity.User;
import com.tradepro.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findByAccessToken(String accessToken);
    Optional<UserSession> findByRefreshToken(String refreshToken);
    List<UserSession> findByUserAndActive(User user, Boolean active);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.user = :user")
    void deactivateAllUserSessions(User user);

    /** Deactivate all sessions whose expiresAt is in the past */
    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.expiresAt < :now AND s.active = true")
    void deactivateExpiredSessions(@org.springframework.data.repository.query.Param("now") LocalDateTime now);

    default void deactivateExpiredSessions() {
        deactivateExpiredSessions(LocalDateTime.now());
    }
}
