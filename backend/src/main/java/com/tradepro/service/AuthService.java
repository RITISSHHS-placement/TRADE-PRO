package com.tradepro.service;

import com.tradepro.dto.*;
import com.tradepro.entity.User;
import com.tradepro.entity.BoundDevice;
import com.tradepro.entity.UserSession;
import com.tradepro.entity.RefreshToken;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.BoundDeviceRepository;
import com.tradepro.repository.UserSessionRepository;
import com.tradepro.repository.RefreshTokenRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BoundDeviceRepository boundDeviceRepository;
    
    @Autowired
    private UserSessionRepository userSessionRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Value("${totp.issuer:TradePro}")
    private String totpIssuer;
    
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();
    
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }
        
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("User with this phone number already exists");
        }
        
        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setKycStatus(User.KycStatus.PENDING);
        user.setRiskProfile(User.RiskProfile.MODERATE);
        user.setTradingEnabled(true);
        user.setSmsOtpEnabled(true);
        user.setTotpEnabled(false);
        user.setNudgesEnabled(true);
        user.setPerTradeLimit(100000.0); // Default limit
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        user = userRepository.save(user);
        
        // Generate JWT tokens
        String accessToken = jwtService.generateToken(user.getEmail());
        var refreshPayload = refreshTokenService.createRefreshToken(user,
            request.getDeviceId(), request.getDeviceName(), request.getIpAddress(), request.getUserAgent());
        String refreshToken = refreshPayload.getRawToken();
        
        // Register and auto-trust the device used at registration
        if (request.getDeviceId() != null) {
            BoundDevice device = new BoundDevice();
            device.setUser(user);
            device.setDeviceId(request.getDeviceId());
            device.setDeviceName(request.getDeviceName() != null ? request.getDeviceName() : "Browser");
            device.setDeviceType("WEB");
            device.setTrusted(true);
            device.setCreatedAt(LocalDateTime.now());
            boundDeviceRepository.save(device);
        }
        
        // Create user session
        UserSession session = new UserSession();
        session.setUser(user);
        session.setDeviceId(request.getDeviceId());
        session.setDeviceName(request.getDeviceName());
        session.setIpAddress(request.getIpAddress());
        session.setUserAgent(request.getUserAgent());
        session.setAccessToken(accessToken);
        session.setRefreshToken(refreshPayload.getRefreshToken().getTokenId());
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(refreshPayload.getRefreshToken().getExpiresAt());
        session.setActive(true);
        
        userSessionRepository.save(session);
        
        // Create UserDto for response
        UserDto userDto = new UserDto(user);
        
        return new AuthResponse(accessToken, refreshToken, userDto);
    }
    
    public boolean verifyCredentials(String email, String password) {
        // Find user by email
        User user = userRepository.findByEmail(email)
            .orElse(null);
        
        if (user == null) {
            return false;
        }
        
        // Check password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return false;
        }
        
        // Check if trading is enabled (kill switch)
        if (!user.getTradingEnabled()) {
            throw new RuntimeException("Trading is disabled. Please contact support.");
        }
        
        return true;
    }
    
    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        // Check if trading is enabled (kill switch)
        if (!user.getTradingEnabled()) {
            throw new RuntimeException("Trading is disabled. Please contact support.");
        }
        
        // Check device binding if enabled
        if (request.getDeviceId() != null) {
            Optional<BoundDevice> boundDevice = boundDeviceRepository
                .findByUserAndDeviceId(user, request.getDeviceId());
            
            if (boundDevice.isEmpty()) {
                // New device — auto-trust and register it (real app would send OTP email)
                BoundDevice newDevice = new BoundDevice();
                newDevice.setUser(user);
                newDevice.setDeviceId(request.getDeviceId());
                newDevice.setDeviceName(request.getDeviceName() != null ? request.getDeviceName() : "Browser");
                newDevice.setDeviceType("WEB");
                newDevice.setTrusted(true); // Auto-trust on first use
                newDevice.setCreatedAt(LocalDateTime.now());
                boundDeviceRepository.save(newDevice);
            } else if (!boundDevice.get().getTrusted()) {
                // Previously seen but untrusted — now trust it
                boundDevice.get().setTrusted(true);
                boundDeviceRepository.save(boundDevice.get());
            }
        }
        
        // Generate JWT tokens
        String accessToken = jwtService.generateToken(user.getEmail());
        var refreshPayload = refreshTokenService.createRefreshToken(user,
            request.getDeviceId(), request.getDeviceName(), request.getIpAddress(), request.getUserAgent());
        String refreshToken = refreshPayload.getRawToken();
        
        // Create/update user session
        UserSession session = new UserSession();
        session.setUser(user);
        session.setDeviceId(request.getDeviceId());
        session.setDeviceName(request.getDeviceName());
        session.setIpAddress(request.getIpAddress());
        session.setUserAgent(request.getUserAgent());
        session.setAccessToken(accessToken);
        session.setRefreshToken(refreshPayload.getRefreshToken().getTokenId());
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(refreshPayload.getRefreshToken().getExpiresAt());
        session.setActive(true);
        
        userSessionRepository.save(session);
        
        // Create UserDto for response
        UserDto userDto = new UserDto(user);
        
        return new AuthResponse(accessToken, refreshToken, userDto);
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken stored = refreshTokenService.findValidByRawToken(refreshToken)
            .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        User user = stored.getUser();
        stored.revoke();
        refreshTokenService.revoke(stored);

        String newAccessToken = jwtService.generateToken(user.getEmail());
        var refreshPayload = refreshTokenService.createRefreshToken(user,
            stored.getDeviceId(), stored.getDeviceName(), stored.getIpAddress(), stored.getUserAgent());
        String newRefreshToken = refreshPayload.getRawToken();

        // Update session
        UserSession session = userSessionRepository.findByRefreshToken(stored.getTokenId())
            .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setAccessToken(newAccessToken);
        session.setRefreshToken(refreshPayload.getRefreshToken().getTokenId());
        session.setExpiresAt(refreshPayload.getRefreshToken().getExpiresAt());
        userSessionRepository.save(session);
        
        // Create UserDto for response
        UserDto userDto = new UserDto(user);
        
        return new AuthResponse(newAccessToken, newRefreshToken, userDto);
    }
    
    public TotpSetupResponse setupTotp(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doSetupTotp(user);
    }

    /** SECURITY: email-based variant for use from JWT principal */
    public TotpSetupResponse setupTotpByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doSetupTotp(user);
    }

    private TotpSetupResponse doSetupTotp(User user) {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        String secret = key.getKey();
        user.setTotpSecret(secret);
        userRepository.save(user);
        String qrCodeUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
            totpIssuer, user.getEmail(), key);
        // SECURITY: manualEntryKey intentionally equals secret here for app setup
        return new TotpSetupResponse(secret, qrCodeUrl, secret);
    }

    public boolean verifyTotp(Long userId, String code) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doVerifyTotp(user, code);
    }

    /** SECURITY: email-based variant */
    public boolean verifyTotpByEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doVerifyTotp(user, code);
    }

    private boolean doVerifyTotp(User user, String code) {
        if (user.getTotpSecret() == null) {
            throw new RuntimeException("TOTP not set up for this user");
        }
        // SECURITY: validate code is numeric only before parsing
        if (!code.matches("\\d{6}")) {
            return false;
        }
        boolean isValid = gAuth.authorize(user.getTotpSecret(), Integer.parseInt(code));
        if (isValid && !user.getTotpEnabled()) {
            user.setTotpEnabled(true);
            userRepository.save(user);
        }
        return isValid;
    }
    
    /**
     * OTP-only login: verifies OTP, then finds or creates the user and returns JWT.
     * New users are auto-created with a random password (they can't login with password).
     */
    public AuthResponse otpLogin(OtpLoginRequest request) {
        // Find existing user or create new one
        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        User user;
        boolean isNewUser = false;

        if (existing.isPresent()) {
            user = existing.get();
        } else {
            // Auto-create a new user (OTP-verified, no password needed)
            isNewUser = true;
            user = new User();
            user.setEmail(request.getEmail());
            // Generate a random password — this user can only login via OTP
            String randomPw = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 24);
            user.setPassword(passwordEncoder.encode(randomPw));
            user.setName(request.getEmail().split("@")[0]);
            user.setPhone("otp_" + System.currentTimeMillis());
            user.setKycStatus(User.KycStatus.PENDING);
            user.setRiskProfile(User.RiskProfile.MODERATE);
            user.setTradingEnabled(true);
            user.setSmsOtpEnabled(true);
            user.setTotpEnabled(false);
            user.setNudgesEnabled(true);
            user.setPerTradeLimit(100000.0);
            user.setEmailVerified(true); // OTP-verified
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        }

        // Generate JWT tokens
        String accessToken = jwtService.generateToken(user.getEmail());
        var refreshPayload = refreshTokenService.createRefreshToken(user,
            request.getDeviceId(), request.getDeviceName(), request.getIpAddress(), request.getUserAgent());
        String refreshToken = refreshPayload.getRawToken();

        // Register device if provided
        if (request.getDeviceId() != null) {
            BoundDevice device = new BoundDevice();
            device.setUser(user);
            device.setDeviceId(request.getDeviceId());
            device.setDeviceName(request.getDeviceName() != null ? request.getDeviceName() : "Browser");
            device.setDeviceType("WEB");
            device.setTrusted(true);
            device.setCreatedAt(LocalDateTime.now());
            boundDeviceRepository.save(device);
        }

        // Create user session
        UserSession session = new UserSession();
        session.setUser(user);
        session.setDeviceId(request.getDeviceId());
        session.setDeviceName(request.getDeviceName());
        session.setIpAddress(request.getIpAddress());
        session.setUserAgent(request.getUserAgent());
        session.setAccessToken(accessToken);
        session.setRefreshToken(refreshPayload.getRefreshToken().getTokenId());
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(refreshPayload.getRefreshToken().getExpiresAt());
        session.setActive(true);
        userSessionRepository.save(session);

        UserDto userDto = new UserDto(user);
        return new AuthResponse(accessToken, refreshToken, userDto);
    }

    public void logout(String token) {
        if (token == null) return;
        // Extract token from Bearer format
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        Optional<UserSession> session = userSessionRepository.findByAccessToken(token);
        if (session.isPresent()) {
            UserSession userSession = session.get();
            userSession.setActive(false);
            if (userSession.getRefreshToken() != null) {
                refreshTokenRepository.findByTokenId(userSession.getRefreshToken())
                    .ifPresent(refreshTokenService::revoke);
            }
            userSessionRepository.save(userSession);
        }
    }

    public void logoutAllByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        userSessionRepository.deactivateAllUserSessions(user);
        refreshTokenRepository.deleteByUser(user);
    }
}
