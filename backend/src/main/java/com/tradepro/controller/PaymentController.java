package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.dto.PaymentVerificationRequest;
import com.tradepro.entity.Trade;
import com.tradepro.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Payment verification endpoint ensuring orders are verified against authenticated user identity.
 * This controller is intentionally minimal to support server-side order/payment validation
 * without exposing user-owned IDs in the client payload.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyPayment(
            @RequestBody PaymentVerificationRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            boolean verified = paymentService.verifyPaymentForUser(
                    principal.getUsername(), request.getTradeId(), request.getPaymentReference());
            if (!verified) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Payment verification failed", null));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment verified successfully", "VERIFIED"));
        } catch (SecurityException se) {
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, "Access denied", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Payment verification error", null));
        }
    }
}
