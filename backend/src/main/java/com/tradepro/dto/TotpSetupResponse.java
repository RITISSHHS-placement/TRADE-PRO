package com.tradepro.dto;

public class TotpSetupResponse {
    private String secret;
    private String qrCode;
    private String manualEntryKey;
    
    public TotpSetupResponse() {}
    
    public TotpSetupResponse(String secret, String qrCode, String manualEntryKey) {
        this.secret = secret;
        this.qrCode = qrCode;
        this.manualEntryKey = manualEntryKey;
    }
    
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    
    public String getManualEntryKey() { return manualEntryKey; }
    public void setManualEntryKey(String manualEntryKey) { this.manualEntryKey = manualEntryKey; }
}