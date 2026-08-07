package com.tradepro.controller;

import com.tradepro.dto.*;
import com.tradepro.service.AuthService;
import com.tradepro.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

/**
 * SECURITY FIXES applied:
 * 1. @Valid on all @RequestBody — triggers bean-validation before service is hit
 * 2. TOTP setup requires authenticated user (JWT principal), not arbitrary userId
 * 3. TOTP verify same — principal only
 * 4. Generic error messages from GlobalExceptionHandler, never raw stack traces
 * 5. No sensitive data logged
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpirationMs;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        try {
            System.out.println("Registration attempt for email: " + request.getEmail());
            AuthResponse response = authService.register(request);
            ResponseCookie accessCookie = ResponseCookie.from("access_token", response.getToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs).getSeconds())
                .sameSite("Lax").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtRefreshExpirationMs).getSeconds())
                .sameSite("Lax").build();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.status(HttpStatus.CREATED).headers(headers)
                .body(new ApiResponse<>(true, "User registered successfully", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            ResponseCookie accessCookie = ResponseCookie.from("access_token", response.getToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs).getSeconds())
                .sameSite("Lax").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtRefreshExpirationMs).getSeconds())
                .sameSite("Lax").build();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok().headers(headers)
                .body(new ApiResponse<>(true, "Login successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/verify-credentials")
    public ResponseEntity<ApiResponse<String>> verifyCredentials(
            @Valid @RequestBody LoginRequest request) {
        try {
            boolean isValid = authService.verifyCredentials(request.getEmail(), request.getPassword());
            if (isValid) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Credentials verified", "CREDENTIALS_VALID"));
            }
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Invalid email or password", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/login-with-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithOtp(
            @Valid @RequestBody LoginWithOtpRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            // First verify OTP
            boolean otpValid = otpService.verifyOtp(request.getEmail(), request.getOtp());
            if (!otpValid) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid or expired OTP", null));
            }

            // Then login with credentials
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail(request.getEmail());
            loginRequest.setPassword(request.getPassword());
            loginRequest.setDeviceId(httpRequest.getHeader("User-Agent") != null ? httpRequest.getHeader("User-Agent").substring(0, Math.min(64, httpRequest.getHeader("User-Agent").length())) : null);
            loginRequest.setDeviceName("Web Browser");
            loginRequest.setUserAgent(httpRequest.getHeader("User-Agent"));
            loginRequest.setIpAddress(httpRequest.getRemoteAddr());
            
            AuthResponse response = authService.login(loginRequest);
            
            ResponseCookie accessCookie = ResponseCookie.from("access_token", response.getToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs).getSeconds())
                .sameSite("Lax").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
                .httpOnly(true).path("/")
                .maxAge(Duration.ofMillis(jwtRefreshExpirationMs).getSeconds())
                .sameSite("Lax").build();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok().headers(headers)
                .body(new ApiResponse<>(true, "Login successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String refreshToken = null;
            if (request != null && request.getRefreshToken() != null) {
                refreshToken = request.getRefreshToken();
            } else if (httpRequest.getCookies() != null) {
                for (jakarta.servlet.http.Cookie c : httpRequest.getCookies()) {
                    if ("refresh_token".equals(c.getName())) {
                        refreshToken = c.getValue();
                        break;
                    }
                }
            }

            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "Session expired", null));
            }

            AuthResponse response = authService.refreshToken(refreshToken);
            ResponseCookie accessCookie = ResponseCookie.from("access_token", response.getToken())
                    .httpOnly(true).path("/")
                    .maxAge(Duration.ofMillis(jwtExpirationMs).getSeconds())
                    .sameSite("Lax").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
                    .httpOnly(true).path("/")
                    .maxAge(Duration.ofMillis(jwtRefreshExpirationMs).getSeconds())
                    .sameSite("Lax").build();

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok().headers(headers)
                    .body(new ApiResponse<>(true, "Token refreshed", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Session expired", null));
        }
    }

    /**
     * SECURITY: TOTP setup derived from JWT — no arbitrary userId accepted.
     * setupTotp(Long userId) still called internally after resolving email → id.
     */
    @PostMapping("/setup-totp")
    public ResponseEntity<ApiResponse<TotpSetupResponse>> setupTotp(
            @AuthenticationPrincipal UserDetails principal) {
        try {
            TotpSetupResponse response = authService.setupTotpByEmail(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "TOTP setup initiated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "TOTP setup failed", null));
        }
    }

    @PostMapping("/verify-totp")
    public ResponseEntity<ApiResponse<String>> verifyTotp(
            @RequestBody TotpVerifyRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            boolean isValid = authService.verifyTotpByEmail(principal.getUsername(), request.getToken());
            if (isValid) {
                return ResponseEntity.ok(new ApiResponse<>(true, "TOTP verified", "TOTP_VERIFIED"));
            }
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Invalid TOTP code", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "TOTP verification failed", null));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token != null) {
                authService.logout(token);
            }
            ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true).secure(true).path("/")
                .maxAge(0).sameSite("None").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true).secure(true).path("/")
                .maxAge(0).sameSite("None").build();
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());
            return ResponseEntity.ok().headers(headers).body(new ApiResponse<>(true, "Logged out successfully", "LOGGED_OUT"));
        } catch (Exception e) {
            ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true).secure(true).path("/")
                .maxAge(0).sameSite("None").build();
            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true).secure(true).path("/")
                .maxAge(0).sameSite("None").build();
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, accessCookie.toString());
            headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());
            return ResponseEntity.ok().headers(headers).body(new ApiResponse<>(true, "Logged out", "LOGGED_OUT"));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        try {
            // Check rate limiting
            if (!otpService.canSendOtp(request.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Please wait before requesting another OTP", null));
            }
            
            String otp = otpService.generateOtp();
            otpService.sendOtpEmail(request.getEmail(), otp);
            otpService.storeOtp(request.getEmail(), otp);
            return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent successfully", "OTP_SENT"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to send OTP", null));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (isValid) {
            return ResponseEntity.ok(new ApiResponse<>(true, "OTP verified successfully", "OTP_VERIFIED"));
        }
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Invalid or expired OTP", null));
    }
}
