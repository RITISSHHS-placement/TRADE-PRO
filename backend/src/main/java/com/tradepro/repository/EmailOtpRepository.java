package com.tradepro.repository;

import com.tradepro.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findByEmail(String email);
    Optional<EmailOtp> findByEmailAndVerifiedFalse(String email);
    void deleteByEmail(String email);
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
    boolean existsByEmail(String email);
}
