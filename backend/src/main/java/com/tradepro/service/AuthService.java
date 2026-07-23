package com.tradepro.service;

import com.tradepro.dto.*;
import com.tradepro.entity.User;
import com.tradepro.entity.BoundDevice;
import com.tradepro.entity.UserSession;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.BoundDeviceRepository;
import com.tradepro.repository.UserSessionRepository;
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
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
        
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
        session.setRefreshToken(refreshToken);
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        session.setActive(true);
        
        userSessionRepository.save(session);
        
        // Create UserDto for response
        UserDto userDto = new UserDto(user);
        
        return new AuthResponse(accessToken, refreshToken, userDto);
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
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
        
        // Create/update user session
        UserSession session = new UserSession();
        session.setUser(user);
        session.setDeviceId(request.getDeviceId());
        session.setDeviceName(request.getDeviceName());
        session.setIpAddress(request.getIpAddress());
        session.setUserAgent(request.getUserAgent());
        session.setAccessToken(accessToken);
        session.setRefreshToken(refreshToken);
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        session.setActive(true);
        
        userSessionRepository.save(session);
        
        // Create UserDto for response
        UserDto userDto = new UserDto(user);
        
        return new AuthResponse(accessToken, refreshToken, userDto);
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!jwtService.isTokenValid(refreshToken, email)) {
            throw new RuntimeException("Invalid refresh token");
        }
        
        String newAccessToken = jwtService.generateToken(email);
        String newRefreshToken = jwtService.generateRefreshToken(email);
        
        // Update session
        UserSession session = userSessionRepository.findByRefreshToken(refreshToken)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setAccessToken(newAccessToken);
        session.setRefreshToken(newRefreshToken);
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        
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
    
    public void logout(String token) {
        // Extract token from Bearer format
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        // Find and deactivate session
        Optional<UserSession> session = userSessionRepository.findByAccessToken(token);
        if (session.isPresent()) {
            session.get().setActive(false);
            userSessionRepository.save(session.get());
        }
    }
}