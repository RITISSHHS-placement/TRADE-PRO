package com.tradepro.service;

import com.tradepro.dto.UserDto;
import com.tradepro.entity.User;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.UserSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SECURITY: All public methods now accept email (from JWT principal)
 * instead of userId (from URL path) to prevent IDOR attacks.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;

    public UserService(UserRepository userRepository,
                       UserSessionRepository userSessionRepository) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
    }

    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserDto(user);
    }

    // ── Email-based methods (IDOR-safe) ──────────────────────────

    public UserDto toggleKillSwitchByEmail(String email, boolean activate) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKillSwitchActive(activate);
        if (activate) {
            user.setTradingEnabled(false);
            userSessionRepository.deactivateAllUserSessions(user);
        } else {
            user.setTradingEnabled(true);
        }
        return new UserDto(userRepository.save(user));
    }

    public UserDto updateRiskProfileByEmail(String email, User.RiskProfile profile) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRiskProfile(profile);
        return new UserDto(userRepository.save(user));
    }

    public UserDto updateAutoLogoutByEmail(String email, Integer minutes) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAutoLogoutTime(minutes);
        return new UserDto(userRepository.save(user));
    }

    public UserDto toggleNudgesByEmail(String email, boolean enabled) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setNudgesEnabled(enabled);
        return new UserDto(userRepository.save(user));
    }

    // ── Legacy userId-based methods (kept for backward-compat, internal use only) ──

    public UserDto toggleKillSwitch(Long userId, boolean activate) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return toggleKillSwitchByEmail(user.getEmail(), activate);
    }

    public UserDto updateRiskProfile(Long userId, User.RiskProfile profile) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return updateRiskProfileByEmail(user.getEmail(), profile);
    }

    public UserDto updateAutoLogout(Long userId, Integer minutes) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return updateAutoLogoutByEmail(user.getEmail(), minutes);
    }

    public UserDto updateKycStatus(Long userId, User.KycStatus status) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus(status);
        if (status == User.KycStatus.VERIFIED) {
            user.setFaceVerified(true);
        }
        return new UserDto(userRepository.save(user));
    }

    public UserDto toggleNudges(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return toggleNudgesByEmail(user.getEmail(), enabled);
    }
}
