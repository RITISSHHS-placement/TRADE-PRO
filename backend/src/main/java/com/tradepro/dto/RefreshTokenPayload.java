package com.tradepro.dto;

import com.tradepro.entity.RefreshToken;

public class RefreshTokenPayload {
    private RefreshToken refreshToken;
    private String rawToken;

    public RefreshTokenPayload() {}

    public RefreshTokenPayload(RefreshToken refreshToken, String rawToken) {
        this.refreshToken = refreshToken;
        this.rawToken = rawToken;
    }

    public RefreshToken getRefreshToken() { return refreshToken; }
    public void setRefreshToken(RefreshToken refreshToken) { this.refreshToken = refreshToken; }
    public String getRawToken() { return rawToken; }
    public void setRawToken(String rawToken) { this.rawToken = rawToken; }
}
