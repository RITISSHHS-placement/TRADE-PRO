package com.tradepro.dto;

public class TotpSetupRequest {
    private Long userId;
    
    public TotpSetupRequest() {}
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}