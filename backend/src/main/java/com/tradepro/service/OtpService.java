package com.tradepro.service;

import com.tradepro.entity.EmailOtp;
import com.tradepro.repository.EmailOtpRepository;
import com.tradepro.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Production-grade OTP service with:
 * - Async email delivery (non-blocking)
 * - Automatic retry (3 attempts, exponential backoff) on SMTP failure
 * - Fallback: logs OTP to console if all retries fail
 * - BCrypt-hashed OTP storage (never stores plaintext)
 * - Rate limiting: 60s cooldown + max 10 resends/hour
 * - Max 5 incorrect attempts before OTP is invalidated
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private static final int MAX_ATTEMPTS           = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_RESEND_PER_HOUR    = 10;

    private final JavaMailSender        mailSender;
    private final EmailOtpRepository    emailOtpRepository;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;

    @Value("${app.otp.expiration:300}")
    private long otpExpirationSeconds;

    @Value("${spring.mail.username:noreply@tradepro.com}")
    private String fromEmail;

    private static final SecureRandom random = new SecureRandom();

    /** In-memory rate-limit tracker (per-JVM; good enough for single-instance) */
    private final Map<String, RateLimitData> rateLimitData = new ConcurrentHashMap<>();

    private static class RateLimitData {
        int resendCount;
        LocalDateTime hourWindowStart;
        RateLimitData() {
            this.resendCount      = 1;
            this.hourWindowStart  = LocalDateTime.now();
        }
    }

    public OtpService(JavaMailSender mailSender,
                      EmailOtpRepository emailOtpRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.mailSender        = mailSender;
        this.emailOtpRepository = emailOtpRepository;
        this.userRepository    = userRepository;
        this.passwordEncoder   = passwordEncoder;
    }

    /** Generate a cryptographically-random 6-digit OTP */
    public String generateOtp() {
        return String.format("%06d", 100000 + random.nextInt(900000));
    }

    /**
     * Sends OTP asynchronously so the HTTP response returns immediately.
     * Retried up to 3 times with exponential backoff on any mail exception.
     */
    @Async("otpEmailExecutor")
    @Retryable(
        value   = { Exception.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2.0)
    )
    public void sendOtpEmail(String email, String otp) {
        // Always print to console for ops/debug visibility
        logger.info("═══════════════════════════════");
        logger.info("OTP for {}  →  {}", email, otp);
        logger.info("═══════════════════════════════");

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(email);
        msg.setSubject("TradePro — Your login OTP");
        msg.setText(
            "Hello,\n\n" +
            "Your TradePro one-time password is:\n\n" +
            "    " + otp + "\n\n" +
            "Valid for " + (otpExpirationSeconds / 60) + " minutes. " +
            "Do not share this code with anyone.\n\n" +
            "If you didn't request this, ignore this email.\n\n" +
            "— TradePro Security Team"
        );
        mailSender.send(msg);
        logger.info("OTP email delivered → {}", email);
    }

    /** Recovery method called when all 3 retry attempts are exhausted */
    @Recover
    public void recoverSendOtpEmail(Exception ex, String email, String otp) {
        logger.error("All email retries exhausted for {}. OTP (console only): {}", email, otp);
        // OTP is already stored in DB — user can still attempt login if they saw console
    }

    @Transactional
    public void storeOtp(String email, String otp) {
        String otpHash   = passwordEncoder.encode(otp);
        LocalDateTime exp = LocalDateTime.now().plusSeconds(otpExpirationSeconds);

        // Invalidate any existing active OTP for this email
        emailOtpRepository.deleteByEmail(email);
        emailOtpRepository.flush();

        EmailOtp record = new EmailOtp(email, otpHash, exp);
        emailOtpRepository.save(record);
        logger.debug("OTP record created for {}", email);
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        Optional<EmailOtp> opt = emailOtpRepository.findByEmailAndVerifiedFalse(email);
        if (opt.isEmpty()) {
            logger.warn("No active OTP found for {}", email);
            return false;
        }
        EmailOtp record = opt.get();

        if (record.isExpired()) {
            logger.warn("OTP expired for {}", email);
            emailOtpRepository.delete(record);
            return false;
        }
        if (record.isMaxAttemptsExceeded(MAX_ATTEMPTS)) {
            logger.warn("OTP max attempts exceeded for {}", email);
            emailOtpRepository.delete(record);
            return false;
        }

        if (passwordEncoder.matches(otp, record.getOtpHash())) {
            record.setVerified(true);
            emailOtpRepository.save(record);
            emailOtpRepository.delete(record);

            userRepository.findByEmail(email).ifPresent(u -> {
                u.setEmailVerified(true);
                userRepository.save(u);
            });
            logger.info("OTP verified for {}", email);
            return true;
        }

        // Wrong code — increment attempt counter
        record.incrementAttempts();
        emailOtpRepository.save(record);
        logger.warn("Incorrect OTP attempt #{} for {}", record.getAttempts(), email);
        return false;
    }

    @Transactional
    public boolean canSendOtp(String email) {
        Optional<EmailOtp> existing = emailOtpRepository.findByEmailAndVerifiedFalse(email);

        // First OTP for this email — always allowed
        if (existing.isEmpty()) return true;

        EmailOtp rec = existing.get();

        // Enforce cooldown
        if (!rec.canResend(RESEND_COOLDOWN_SECONDS)) {
            logger.warn("OTP resend cooldown active for {}", email);
            return false;
        }

        // Enforce hourly cap
        RateLimitData data = rateLimitData.computeIfAbsent(email, k -> new RateLimitData());
        if (LocalDateTime.now().isAfter(data.hourWindowStart.plusHours(1))) {
            data.resendCount      = 1;
            data.hourWindowStart  = LocalDateTime.now();
        }
        if (data.resendCount >= MAX_RESEND_PER_HOUR) {
            logger.warn("Hourly OTP limit reached for {}", email);
            return false;
        }
        data.resendCount++;
        return true;
    }

    @Transactional
    public void clearOtp(String email) {
        emailOtpRepository.deleteByEmail(email);
    }

    @Transactional
    public void cleanupExpiredOtps() {
        emailOtpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        logger.debug("Cleaned up expired OTP records");
    }
}
