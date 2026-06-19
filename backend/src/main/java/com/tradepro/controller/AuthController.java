package com.tradepro.controller;

import com.tradepro.dto.*;
import com.tradepro.entity.User;
import com.tradepro.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @PostMapping("/setup-totp")
    public ResponseEntity<ApiResponse<TotpSetupResponse>> setupTotp(@RequestBody TotpSetupRequest request) {
        try {
            TotpSetupResponse response = authService.setupTotp(request.getUserId());
            return ResponseEntity.ok(new ApiResponse<>(true, "TOTP setup initiated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @PostMapping("/verify-totp")
    public ResponseEntity<ApiResponse<String>> verifyTotp(@RequestBody TotpVerifyRequest request) {
        try {
            boolean isValid = authService.verifyTotp(request.getUserId(), request.getToken());
            if (isValid) {
                return ResponseEntity.ok(new ApiResponse<>(true, "TOTP verified successfully", "TOTP_VERIFIED"));
            } else {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid TOTP code", null));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader("Authorization") String token) {
        try {
            authService.logout(token);
            return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully", "LOGGED_OUT"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}