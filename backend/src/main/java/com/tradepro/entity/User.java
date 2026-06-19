package com.tradepro.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String phone;
    
    // KYC and Verification
    @Enumerated(EnumType.STRING)
    private KycStatus kycStatus = KycStatus.PENDING;
    
    private Boolean faceVerified = false;
    
    // Security Features
    private String totpSecret;
    private Boolean totpEnabled = false;
    private Boolean smsOtpEnabled = true;
    
    // Trading Controls
    private Boolean tradingEnabled = true;
    private Boolean killSwitchActive = false;
    private LocalDateTime killSwitchDate;
    
    // Risk Management
    @Enumerated(EnumType.STRING)
    private RiskProfile riskProfile = RiskProfile.MODERATE;
    
    private Double dailyLimit = 100000.0;
    private Double perTradeLimit = 50000.0;
    
    // Preferences
    private Integer autoLogoutTime = 30; // minutes
    private Boolean nudgesEnabled = true;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Device Binding
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<BoundDevice> boundDevices = new HashSet<>();
    
    // Active Sessions
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserSession> activeSessions = new HashSet<>();
    
    // Default constructor
    public User() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    @Override
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public KycStatus getKycStatus() { return kycStatus; }
    public void setKycStatus(KycStatus kycStatus) { this.kycStatus = kycStatus; }
    
    public Boolean getFaceVerified() { return faceVerified; }
    public void setFaceVerified(Boolean faceVerified) { this.faceVerified = faceVerified; }
    
    public String getTotpSecret() { return totpSecret; }
    public void setTotpSecret(String totpSecret) { this.totpSecret = totpSecret; }
    
    public Boolean getTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(Boolean totpEnabled) { this.totpEnabled = totpEnabled; }
    
    public Boolean getSmsOtpEnabled() { return smsOtpEnabled; }
    public void setSmsOtpEnabled(Boolean smsOtpEnabled) { this.smsOtpEnabled = smsOtpEnabled; }
    
    public Boolean getTradingEnabled() { return tradingEnabled; }
    public void setTradingEnabled(Boolean tradingEnabled) { this.tradingEnabled = tradingEnabled; }
    
    public Boolean getKillSwitchActive() { return killSwitchActive; }
    public void setKillSwitchActive(Boolean killSwitchActive) { this.killSwitchActive = killSwitchActive; }
    
    public LocalDateTime getKillSwitchDate() { return killSwitchDate; }
    public void setKillSwitchDate(LocalDateTime killSwitchDate) { this.killSwitchDate = killSwitchDate; }
    
    public RiskProfile getRiskProfile() { return riskProfile; }
    public void setRiskProfile(RiskProfile riskProfile) { this.riskProfile = riskProfile; }
    
    public Double getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(Double dailyLimit) { this.dailyLimit = dailyLimit; }
    
    public Double getPerTradeLimit() { return perTradeLimit; }
    public void setPerTradeLimit(Double perTradeLimit) { this.perTradeLimit = perTradeLimit; }
    
    public Integer getAutoLogoutTime() { return autoLogoutTime; }
    public void setAutoLogoutTime(Integer autoLogoutTime) { this.autoLogoutTime = autoLogoutTime; }
    
    public Boolean getNudgesEnabled() { return nudgesEnabled; }
    public void setNudgesEnabled(Boolean nudgesEnabled) { this.nudgesEnabled = nudgesEnabled; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Set<BoundDevice> getBoundDevices() { return boundDevices; }
    public void setBoundDevices(Set<BoundDevice> boundDevices) { this.boundDevices = boundDevices; }
    
    public Set<UserSession> getActiveSessions() { return activeSessions; }
    public void setActiveSessions(Set<UserSession> activeSessions) { this.activeSessions = activeSessions; }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return !killSwitchActive;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return kycStatus == KycStatus.VERIFIED || kycStatus == KycStatus.PENDING;
    }
    
    public enum KycStatus {
        PENDING, VERIFIED, REJECTED
    }
    
    public enum RiskProfile {
        CONSERVATIVE, MODERATE, AGGRESSIVE
    }
}