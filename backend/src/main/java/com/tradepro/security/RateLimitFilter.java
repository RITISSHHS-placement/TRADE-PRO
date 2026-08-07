package com.tradepro.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Rate-limiting filter for sensitive endpoints.
 *
 * Uses Redis when available; falls back to an in-process ConcurrentHashMap
 * counter so that a missing Redis instance never causes a 500 on auth calls.
 *
 * Limits: 20 requests / IP / minute for login, register, refresh, trade ops.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final StringRedisTemplate redis;

    // In-memory fallback: key → count
    private final Map<String, AtomicInteger> inMemoryCounts = new ConcurrentHashMap<>();
    // Prune stale keys every 60 seconds
    private static final ScheduledExecutorService SCHEDULER =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "rl-cleanup");
                t.setDaemon(true);
                return t;
            });

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
        // Clear in-memory window every minute
        SCHEDULER.scheduleAtFixedRate(inMemoryCounts::clear, 60, 60, TimeUnit.SECONDS);
    }

    // Paths that should be rate-limited — match both /auth/* and /api/auth/*
    private static final String[] RATE_LIMITED_PREFIXES = {
        "/auth/login",
        "/auth/register",
        "/auth/send-otp",
        "/auth/verify-otp",
        "/auth/login-with-otp",
        "/auth/refresh",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/send-otp",
        "/api/auth/login-with-otp",
        "/api/auth/refresh",
        "/trades/place",
        "/api/trades/place",
    };

    private static final int MAX_REQUESTS_PER_MINUTE = 20;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean isRateLimited = false;
        for (String prefix : RATE_LIMITED_PREFIXES) {
            if (path.startsWith(prefix)) {
                isRateLimited = true;
                break;
            }
        }

        if (!isRateLimited) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip   = getClientIp(request);
        String key  = "rl:" + ip + ":" + path;
        long current = 0;

        // Try Redis first; fall back to in-memory on any failure
        try {
            Long val = redis.opsForValue().increment(key);
            if (val != null) {
                if (val == 1L) redis.expire(key, Duration.ofMinutes(1));
                current = val;
            }
        } catch (Exception redisEx) {
            // Redis unavailable — use in-process fallback (fail-open for availability)
            log.debug("Redis unavailable for rate limiting, using in-memory fallback: {}", redisEx.getMessage());
            current = inMemoryCounts
                    .computeIfAbsent(key, k -> new AtomicInteger(0))
                    .incrementAndGet();
        }

        if (current > MAX_REQUESTS_PER_MINUTE) {
            log.warn("Rate limit exceeded: ip={} path={} count={}", ip, path, current);
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Too many requests. Please wait a minute and try again.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
