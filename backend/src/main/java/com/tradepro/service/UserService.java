package com.tradepro.service;

import com.tradepro.dto.UserDto;
import com.tradepro.entity.User;
import com.tradepro.repository.UserRepository;
import com.tradepro.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserDto(user);
    }

    public UserDto toggleKillSwitch(Long userId, boolean activate) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setKillSwitchActive(activate);
        if (activate) {
            user.setTradingEnabled(false);
            // Deactivate all sessions
            userSessionRepository.deactivateAllUserSessions(user);
        } else {
            user.setTradingEnabled(true);
        }

        user = userRepository.save(user);
        return new UserDto(user);
    }

    public UserDto updateRiskProfile(Long userId, User.RiskProfile profile) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRiskProfile(profile);
        return new UserDto(userRepository.save(user));
    }

    public UserDto updateAutoLogout(Long userId, Integer minutes) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAutoLogoutTime(minutes);
        return new UserDto(userRepository.save(user));
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
        user.setNudgesEnabled(enabled);
        return new UserDto(userRepository.save(user));
    }
}
