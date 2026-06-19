package com.tradepro.dto;

import com.tradepro.entity.User;

public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String kycStatus;
    private Boolean faceVerified;
    private Boolean totpEnabled;
    private Boolean smsOtpEnabled;
    private Boolean tradingEnabled;
    private Boolean killSwitchActive;
    private String riskProfile;
    private Integer autoLogoutTime;
    private Boolean nudgesEnabled;
    
    public UserDto() {}
    
    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phone = user.getPhone();
        this.kycStatus = user.getKycStatus().toString();
        this.faceVerified = user.getFaceVerified();
        this.totpEnabled = user.getTotpEnabled();
        this.smsOtpEnabled = user.getSmsOtpEnabled();
        this.tradingEnabled = user.getTradingEnabled();
        this.killSwitchActive = user.getKillSwitchActive();
        this.riskProfile = user.getRiskProfile().toString();
        this.autoLogoutTime = user.getAutoLogoutTime();
        this.nudgesEnabled = user.getNudgesEnabled();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
    
    public Boolean getFaceVerified() { return faceVerified; }
    public void setFaceVerified(Boolean faceVerified) { this.faceVerified = faceVerified; }
    
    public Boolean getTotpEnabled() { return totpEnabled; }
    public void setTotpEnabled(Boolean totpEnabled) { this.totpEnabled = totpEnabled; }
    
    public Boolean getSmsOtpEnabled() { return smsOtpEnabled; }
    public void setSmsOtpEnabled(Boolean smsOtpEnabled) { this.smsOtpEnabled = smsOtpEnabled; }
    
    public Boolean getTradingEnabled() { return tradingEnabled; }
    public void setTradingEnabled(Boolean tradingEnabled) { this.tradingEnabled = tradingEnabled; }
    
    public Boolean getKillSwitchActive() { return killSwitchActive; }
    public void setKillSwitchActive(Boolean killSwitchActive) { this.killSwitchActive = killSwitchActive; }
    
    public String getRiskProfile() { return riskProfile; }
    public void setRiskProfile(String riskProfile) { this.riskProfile = riskProfile; }
    
    public Integer getAutoLogoutTime() { return autoLogoutTime; }
    public void setAutoLogoutTime(Integer autoLogoutTime) { this.autoLogoutTime = autoLogoutTime; }
    
    public Boolean getNudgesEnabled() { return nudgesEnabled; }
    public void setNudgesEnabled(Boolean nudgesEnabled) { this.nudgesEnabled = nudgesEnabled; }
}