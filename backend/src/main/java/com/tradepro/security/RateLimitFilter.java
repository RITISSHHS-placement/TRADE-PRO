package com.tradepro.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;
    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/trades/place",
        "/api/trades/cancel",
        "/api/trades/pnl"
    );

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (RATE_LIMITED_PATHS.stream().noneMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = "rl:" + request.getRemoteAddr() + ":" + path;
        try {
            Long current = redis.opsForValue().increment(key);
            if (current == 1) {
                redis.expire(key, Duration.ofMinutes(1));
            }
            if (current != null && current > 20) { // limit: 20 requests per minute for sensitive routes
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Try again later.\"}");
                return;
            }
        } catch (Exception e) {
            // Redis unavailable — fail open but log. In production consider fail-closed.
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}
