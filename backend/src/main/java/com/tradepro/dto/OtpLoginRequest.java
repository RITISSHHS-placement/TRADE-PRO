package com.tradepro.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Passwordless OTP login: user enters only email + OTP.
 * If the user doesn't exist, a new account is auto-created.
 */
@Data
public class OtpLoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;

    // Optional device info
    private String deviceId;
    private String deviceName;
    private String ipAddress;
    private String userAgent;
}
