package com.tradepro.service;

import com.tradepro.entity.RefreshToken;
import com.tradepro.entity.User;
import com.tradepro.repository.RefreshTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final long refreshExpirationMs;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               PasswordEncoder passwordEncoder,
                               @org.springframework.beans.factory.annotation.Value("${jwt.refresh-expiration:604800000}") long refreshExpirationMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public com.tradepro.dto.RefreshTokenPayload createRefreshToken(User user, String deviceId, String deviceName, String ipAddress, String userAgent) {
        String tokenId = UUID.randomUUID().toString();
        String rawToken = tokenId + "." + generateSecureString(64);
        String hashed = passwordEncoder.encode(rawToken);
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenId(tokenId);
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashed);
        refreshToken.setDeviceId(deviceId);
        refreshToken.setDeviceName(deviceName);
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setUserAgent(userAgent);
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(refreshExpirationMs)));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
        return new com.tradepro.dto.RefreshTokenPayload(refreshToken, rawToken);
    }

    public Optional<RefreshToken> findValidByRawToken(String rawToken) {
        if (rawToken == null || !rawToken.contains(".")) return Optional.empty();
        String tokenId = rawToken.split("\\.")[0];
        Optional<RefreshToken> optional = refreshTokenRepository.findByTokenId(tokenId);
        if (optional.isEmpty()) return Optional.empty();
        RefreshToken token = optional.get();
        if (token.getRevoked() || token.isExpired()) return Optional.empty();
        if (!passwordEncoder.matches(rawToken, token.getTokenHash())) return Optional.empty();
        return Optional.of(token);
    }

    public void revoke(RefreshToken token) {
        token.revoke();
        refreshTokenRepository.save(token);
    }

    private String generateSecureString(int length) {
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
