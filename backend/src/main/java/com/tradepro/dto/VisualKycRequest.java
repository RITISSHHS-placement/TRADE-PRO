package com.tradepro.dto;

public class VisualKycRequest {
    private Long userId;
    private String faceImage; // Base64 encoded image
    
    public VisualKycRequest() {}
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getFaceImage() { return faceImage; }
    public void setFaceImage(String faceImage) { this.faceImage = faceImage; }
}