package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.dto.UserDto;
import com.tradepro.entity.User;
import com.tradepro.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * SECURITY: All user-mutating endpoints now derive identity from the JWT principal.
 * IDOR fix: {userId} path params removed or cross-checked against JWT email.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(
            @AuthenticationPrincipal UserDetails principal) {
        try {
            UserDto user = userService.getProfile(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile fetched", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch profile", null));
        }
    }

    /** Kill switch — only the owner can activate/deactivate their own switch */
    @PostMapping("/kill-switch")
    public ResponseEntity<ApiResponse<UserDto>> toggleKillSwitch(
            @RequestParam boolean activate,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            UserDto user = userService.toggleKillSwitchByEmail(principal.getUsername(), activate);
            String msg = activate ? "Kill switch ACTIVATED — all trading halted" : "Kill switch deactivated";
            return ResponseEntity.ok(new ApiResponse<>(true, msg, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Operation failed", null));
        }
    }

    @PutMapping("/risk-profile")
    public ResponseEntity<ApiResponse<UserDto>> updateRiskProfile(
            @RequestParam User.RiskProfile profile,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            UserDto user = userService.updateRiskProfileByEmail(principal.getUsername(), profile);
            return ResponseEntity.ok(new ApiResponse<>(true, "Risk profile updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to update risk profile", null));
        }
    }

    @PutMapping("/auto-logout")
    public ResponseEntity<ApiResponse<UserDto>> updateAutoLogout(
            @RequestParam Integer minutes,
            @AuthenticationPrincipal UserDetails principal) {
        // Validate range — prevent abuse
        if (minutes == null || minutes < 5 || minutes > 480) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Auto-logout must be between 5 and 480 minutes", null));
        }
        try {
            UserDto user = userService.updateAutoLogoutByEmail(principal.getUsername(), minutes);
            return ResponseEntity.ok(new ApiResponse<>(true, "Auto-logout updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to update auto-logout", null));
        }
    }

    @PutMapping("/nudges")
    public ResponseEntity<ApiResponse<UserDto>> toggleNudges(
            @RequestParam boolean enabled,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            UserDto user = userService.toggleNudgesByEmail(principal.getUsername(), enabled);
            return ResponseEntity.ok(new ApiResponse<>(true, "Nudges setting updated", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to update nudges", null));
        }
    }

    // ── Legacy {userId} endpoints — kept for backward-compat, ownership enforced ──
    @PostMapping("/{userId}/kill-switch")
    public ResponseEntity<ApiResponse<UserDto>> toggleKillSwitchLegacy(
            @PathVariable Long userId,
            @RequestParam boolean activate,
            @AuthenticationPrincipal UserDetails principal) {
        // SECURITY: ignore {userId}; use JWT identity
        return toggleKillSwitch(activate, principal);
    }

    @PutMapping("/{userId}/risk-profile")
    public ResponseEntity<ApiResponse<UserDto>> updateRiskProfileLegacy(
            @PathVariable Long userId,
            @RequestParam User.RiskProfile profile,
            @AuthenticationPrincipal UserDetails principal) {
        return updateRiskProfile(profile, principal);
    }

    @PutMapping("/{userId}/auto-logout")
    public ResponseEntity<ApiResponse<UserDto>> updateAutoLogoutLegacy(
            @PathVariable Long userId,
            @RequestParam Integer minutes,
            @AuthenticationPrincipal UserDetails principal) {
        return updateAutoLogout(minutes, principal);
    }

    @PutMapping("/{userId}/nudges")
    public ResponseEntity<ApiResponse<UserDto>> toggleNudgesLegacy(
            @PathVariable Long userId,
            @RequestParam boolean enabled,
            @AuthenticationPrincipal UserDetails principal) {
        return toggleNudges(enabled, principal);
    }
}
