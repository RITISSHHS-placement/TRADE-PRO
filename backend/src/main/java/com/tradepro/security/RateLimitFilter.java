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

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String key = "rl:" + request.getRemoteAddr() + ":" + path;
        try {
            Long current = redis.opsForValue().increment(key);
            if (current == 1) {
                redis.expire(key, Duration.ofMinutes(1)); // 1 minute window
            }
            if (current != null && current > 60) { // limit: 60 requests per minute
                response.setStatus(429);
                response.getWriter().write("Rate limit exceeded");
                return;
            }
        } catch (Exception e) {
            // Redis down — fail open but log
            // In production consider fail-closed depending on policy
        }

        filterChain.doFilter(request, response);
    }
}
