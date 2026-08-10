package com.tradepro.service;

import com.tradepro.repository.EmailOtpRepository;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.UserSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Auth Health & Maintenance Service.
 *
 * Responsibilities:
 * 1. Scheduled cleanup of expired OTP records (runs every 5 minutes)
 *    → prevents DB bloat under high traffic
 * 2. Scheduled cleanup of expired sessions (runs every 30 minutes)
 * 3. Exposes metrics for the health endpoint
 *
 * Under 99.99% uptime design: this runs on the same JVM instance.
 * With multiple instances, each instance runs its own cleanup
 * (safe because deleteByExpiresAtBefore is idempotent on PostgreSQL).
 */
@Service
public class AuthHealthService {

    private static final Logger log = LoggerFactory.getLogger(AuthHealthService.class);

    private final EmailOtpRepository    emailOtpRepository;
    private final UserRepository        userRepository;
    private final UserSessionRepository userSessionRepository;

    // Runtime counters — reset on restart (fine for ops visibility)
    private volatile long totalRegistrations = 0;
    private volatile long totalLogins        = 0;
    private volatile long totalOtpsSent      = 0;
    private volatile long totalOtpsFailed    = 0;
    private volatile long startupTime        = System.currentTimeMillis();

    public AuthHealthService(EmailOtpRepository emailOtpRepository,
                             UserRepository userRepository,
                             UserSessionRepository userSessionRepository) {
        this.emailOtpRepository = emailOtpRepository;
        this.userRepository     = userRepository;
        this.userSessionRepository = userSessionRepository;
    }

    /** Clean up expired OTP records every 5 minutes */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void cleanupExpiredOtps() {
        try {
            emailOtpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
            log.debug("OTP cleanup completed");
        } catch (Exception e) {
            log.warn("OTP cleanup failed (non-critical): {}", e.getMessage());
        }
    }

    /** Clean up expired sessions every 30 minutes — deactivate sessions older than 7 days */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    @Transactional
    public void cleanupExpiredSessions() {
        try {
            userSessionRepository.deactivateExpiredSessions();
            log.debug("Session cleanup completed");
        } catch (Exception e) {
            log.warn("Session cleanup failed (non-critical): {}", e.getMessage());
        }
    }

    /** Counters — incremented by other services */
    public void recordRegistration() { totalRegistrations++; }
    public void recordLogin()        { totalLogins++; }
    public void recordOtpSent()      { totalOtpsSent++; }
    public void recordOtpFailed()    { totalOtpsFailed++; }

    /** Metrics snapshot for health endpoint */
    public AuthMetrics getMetrics() {
        long users = 0;
        try { users = userRepository.count(); } catch (Exception ignored) {}
        return new AuthMetrics(
            totalRegistrations, totalLogins,
            totalOtpsSent, totalOtpsFailed,
            users, System.currentTimeMillis() - startupTime
        );
    }

    public record AuthMetrics(
        long registrations,
        long logins,
        long otpsSent,
        long otpsFailed,
        long totalUsers,
        long uptimeMs
    ) {}
}
