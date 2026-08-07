package com.tradepro.service;

import com.tradepro.entity.EmailOtp;
import com.tradepro.repository.EmailOtpRepository;
import com.tradepro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_RESEND_PER_HOUR = 10;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Value("${app.otp.expiration:300}")
    private long otpExpirationSeconds;

    private static final SecureRandom random = new SecureRandom();
    
    // Rate limiting tracking
    private final Map<String, RateLimitData> rateLimitData = new ConcurrentHashMap<>();

    private static class RateLimitData {
        int resendCount;
        LocalDateTime hourWindowStart;

        RateLimitData() {
            this.resendCount = 1;
            this.hourWindowStart = LocalDateTime.now();
        }
    }

    public String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    public void sendOtpEmail(String email, String otp) {
        // Always log OTP to console for testing/development
        System.out.println("========================================");
        System.out.println("OTP FOR EMAIL: " + email);
        System.out.println("OTP CODE: " + otp);
        System.out.println("========================================");
        logger.info("OTP generated for email: {} - OTP: {}", email, otp);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("TradePro - Your Verification OTP");
            message.setText(
                "Hello,\n\n" +
                "Your TradePro verification OTP is:\n\n" +
                otp + "\n\n" +
                "This OTP will expire in 5 minutes.\n" +
                "Do not share this code with anyone.\n\n" +
                "Regards,\nTradePro"
            );
            mailSender.send(message);
            logger.info("OTP sent to email: {}", email);
        } catch (Exception e) {
            // If real mail fails, OTP is already logged above — dev can proceed
            logger.error("Failed to send OTP email to: {}. OTP logged to console. Error: {}", email, e.getMessage());
        }
    }

    @Transactional
    public void storeOtp(String email, String otp) {
        // Hash OTP with BCrypt before storing
        String otpHash = passwordEncoder.encode(otp);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpExpirationSeconds);
        
        // Invalidate any existing OTP for this email
        emailOtpRepository.deleteByEmail(email);
        emailOtpRepository.flush(); // Force immediate delete
        
        // Create new OTP record
        EmailOtp emailOtp = new EmailOtp(email, otpHash, expiresAt);
        emailOtpRepository.save(emailOtp);
        
        logger.info("OTP stored in PostgreSQL for email: {}", email);
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        Optional<EmailOtp> otpRecordOpt = emailOtpRepository.findByEmailAndVerifiedFalse(email);
        
        if (otpRecordOpt.isEmpty()) {
            logger.warn("No active OTP found for email: {}", email);
            return false;
        }
        
        EmailOtp otpRecord = otpRecordOpt.get();
        
        // Check if expired
        if (otpRecord.isExpired()) {
            logger.warn("OTP expired for email: {}", email);
            emailOtpRepository.delete(otpRecord);
            return false;
        }
        
        // Check if max attempts exceeded
        if (otpRecord.isMaxAttemptsExceeded(MAX_ATTEMPTS)) {
            logger.warn("Max attempts exceeded for email: {}", email);
            emailOtpRepository.delete(otpRecord);
            return false;
        }
        
        // Verify OTP hash
        if (passwordEncoder.matches(otp, otpRecord.getOtpHash())) {
            // Mark as verified and delete
            otpRecord.setVerified(true);
            emailOtpRepository.save(otpRecord);
            emailOtpRepository.delete(otpRecord);
            
            // Mark user email as verified
            userRepository.findByEmail(email).ifPresent(user -> {
                user.setEmailVerified(true);
                userRepository.save(user);
            });
            
            logger.info("OTP verified successfully for email: {}", email);
            return true;
        } else {
            // Increment attempts
            otpRecord.incrementAttempts();
            emailOtpRepository.save(otpRecord);
            logger.warn("Invalid OTP attempt {} for email: {}", otpRecord.getAttempts(), email);
            return false;
        }
    }

    @Transactional
    public void clearOtp(String email) {
        emailOtpRepository.deleteByEmail(email);
        logger.info("OTP cleared for email: {}", email);
    }

    @Transactional
    public boolean canSendOtp(String email) {
        Optional<EmailOtp> existingOtp = emailOtpRepository.findByEmailAndVerifiedFalse(email);
        
        if (existingOtp.isEmpty()) {
            return true;
        }
        
        EmailOtp otp = existingOtp.get();
        
        // Check cooldown
        if (!otp.canResend(RESEND_COOLDOWN_SECONDS)) {
            logger.warn("OTP resend cooldown active for email: {}", email);
            return false;
        }
        
        // Check rate limit
        RateLimitData rateData = rateLimitData.computeIfAbsent(email, k -> new RateLimitData());
        
        // Reset if hour window passed
        if (LocalDateTime.now().isAfter(rateData.hourWindowStart.plusHours(1))) {
            rateData.resendCount = 1;
            rateData.hourWindowStart = LocalDateTime.now();
        }
        
        if (rateData.resendCount >= MAX_RESEND_PER_HOUR) {
            logger.warn("Max resend limit exceeded for email: {}", email);
            return false;
        }
        
        rateData.resendCount++;
        return true;
    }

    @Transactional
    public void cleanupExpiredOtps() {
        emailOtpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        logger.info("Cleaned up expired OTPs");
    }
}
