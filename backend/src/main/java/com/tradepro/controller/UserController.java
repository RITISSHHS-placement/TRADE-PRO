package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.dto.UserDto;
import com.tradepro.entity.User;
import com.tradepro.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UserDto user = userService.getProfile(userDetails.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile fetched", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/{userId}/kill-switch")
    public ResponseEntity<ApiResponse<UserDto>> toggleKillSwitch(
            @PathVariable Long userId,
            @RequestParam boolean activate) {
        try {
            UserDto user = userService.toggleKillSwitch(userId, activate);
            String msg = activate ? "Kill switch ACTIVATED — all trading halted" : "Kill switch deactivated";
            return ResponseEntity.ok(new ApiResponse<>(true, msg, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{userId}/risk-profile")
    public ResponseEntity<ApiResponse<UserDto>> updateRiskProfile(
            @PathVariable Long userId,
            @RequestParam User.RiskProfile profile) {
        try {
            UserDto user = userService.updateRiskProfile(userId, profile);
            return ResponseEntity.ok(new ApiResponse<>(true, "Risk profile updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{userId}/auto-logout")
    public ResponseEntity<ApiResponse<UserDto>> updateAutoLogout(
            @PathVariable Long userId,
            @RequestParam Integer minutes) {
        try {
            UserDto user = userService.updateAutoLogout(userId, minutes);
            return ResponseEntity.ok(new ApiResponse<>(true, "Auto-logout updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{userId}/nudges")
    public ResponseEntity<ApiResponse<UserDto>> toggleNudges(
            @PathVariable Long userId,
            @RequestParam boolean enabled) {
        try {
            UserDto user = userService.toggleNudges(userId, enabled);
            return ResponseEntity.ok(new ApiResponse<>(true, "Nudges setting updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
