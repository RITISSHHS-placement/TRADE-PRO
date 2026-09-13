package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.service.OtpService;
import com.tradepro.service.AuthService;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.EmailOtpRepository;
import com.tradepro.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Lightweight health/warmup endpoint.
 *
 * Render free-tier sleeps after 15 min of inactivity. The frontend keepAlive
 * pings /health every 10 min to prevent this.
 *
 * This endpoint also preloads critical Spring beans on first call,
 * so subsequent API calls (auth, market data) are instant.
 */
@RestController
@RequestMapping({"/health", "/api/health"})
public class HealthController {

    @Autowired private AuthService authService;
    @Autowired private OtpService otpService;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailOtpRepository emailOtpRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("service", "TradePro Backend");
        data.put("timestamp", System.currentTimeMillis());

        // Preload repositories and services (lazy-init means first call is slow)
        // Subsequent calls will be instant because beans are now cached
        try {
            data.put("users", userRepository.count());
            data.put("activeOtps", emailOtpRepository.count());
            data.put("emailConfigured", otpService.isEmailConfigured());
        } catch (Exception e) {
            // DB might not be ready yet during startup
            data.put("dbStatus", "initializing");
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Healthy", data));
    }

    /**
     * Ultra-lightweight ping — no bean loading, just returns 200.
     * Used by UptimeRobot / external cron services.
     */
    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(new ApiResponse<>(true, "pong", "OK"));
    }
}
