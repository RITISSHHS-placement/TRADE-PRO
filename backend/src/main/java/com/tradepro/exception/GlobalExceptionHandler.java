package com.tradepro.exception;

import com.tradepro.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * SECURITY: Production errors NEVER expose stack traces, file paths,
 * SQL queries, or internal messages. All internal details are logged
 * server-side only; clients receive generic messages.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Allow-list of business messages safe to return to the client */
    private static final String[] SAFE_MESSAGES = {
        "User with this email already exists",
        "User with this phone number already exists",
        "Invalid email or password",
        "Trading is disabled",
        "Kill switch is active",
        "Cannot cancel completed trade",
        "TOTP not set up",
        "Invalid TOTP code",
        "Invalid refresh token",
        "Session not found",
        "User not found",
        "Trade not found"
    };

    private String safeMessage(String raw) {
        if (raw == null) return "An error occurred";
        for (String safe : SAFE_MESSAGES) {
            if (raw.contains(safe)) return safe;
        }
        // Default — never leak internal details
        return "An error occurred";
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
        // Log full message server-side for debugging
        log.warn("RuntimeException: {}", ex.getMessage());
        return ResponseEntity.badRequest()
            .body(new ApiResponse<>(false, safeMessage(ex.getMessage()), null));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        // Don't log credentials — security best practice
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiResponse<>(false, "Invalid credentials", null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(false, "Access denied", null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });
        return ResponseEntity.badRequest()
            .body(new ApiResponse<>(false, "Validation failed", errors));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurityException(SecurityException ex) {
        log.warn("Security violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(false, "Access denied", null));
    }

    /**
     * Catch-all — NEVER expose internal exception details to clients.
     * Log full detail server-side.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        // Log with full stack trace server-side only
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiResponse<>(false, "Internal server error", null));
    }
}
