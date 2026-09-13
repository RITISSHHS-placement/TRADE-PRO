package com.tradepro.security;

import com.tradepro.service.RefreshTokenService;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

@Component
public class RefreshTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenFilter.class);

    private final RefreshTokenService refreshTokenService;
    private final UserDetailsService userDetailsService;

    public RefreshTokenFilter(RefreshTokenService refreshTokenService,
                              UserDetailsService userDetailsService) {
        this.refreshTokenService = refreshTokenService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().endsWith("/auth/refresh")) {
            filterChain.doFilter(request, response);
            return;
        }

        String rawToken = extractRefreshTokenFromCookie(request);
        if (rawToken == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<com.tradepro.entity.RefreshToken> optional = refreshTokenService.findValidByRawToken(rawToken);
        if (optional.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            var token = optional.get();
            if (token.isExpired()) {
                refreshTokenService.revoke(token);
                filterChain.doFilter(request, response);
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(token.getUser().getEmail());
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid refresh token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("refresh_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
