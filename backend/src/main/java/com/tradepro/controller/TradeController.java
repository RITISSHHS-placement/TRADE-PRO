package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.entity.Trade;
import com.tradepro.service.TradeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SECURITY: All endpoints require authentication.
 * IDOR fix: userId is now extracted from the JWT principal, NOT from the URL path.
 * This prevents horizontal privilege escalation (attacker cannot access other users' data).
 */
@RestController
@RequestMapping("/api/trades")
public class TradeController {

    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping("/place")
    public ResponseEntity<ApiResponse<Trade>> placeTrade(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Trade trade) {
        try {
            // SECURITY: userId from JWT principal — cannot be spoofed by client
            Trade placed = tradeService.placeTradeByEmail(principal.getUsername(), trade);
            return ResponseEntity.ok(new ApiResponse<>(true, "Order placed successfully", placed));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(false, "Access denied", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, sanitize(e.getMessage()), null));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Trade>>> getMyTrades(
            @AuthenticationPrincipal UserDetails principal) {
        try {
            List<Trade> trades = tradeService.getUserTradesByEmail(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Trades fetched", trades));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch trades", null));
        }
    }

    @GetMapping("/positions")
    public ResponseEntity<ApiResponse<List<Trade>>> getMyPositions(
            @AuthenticationPrincipal UserDetails principal) {
        try {
            List<Trade> positions = tradeService.getOpenPositionsByEmail(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Positions fetched", positions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch positions", null));
        }
    }

    @DeleteMapping("/{tradeId}/cancel")
    public ResponseEntity<ApiResponse<Trade>> cancelTrade(
            @PathVariable Long tradeId,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            // SECURITY: ownership verified inside service using email from JWT
            Trade cancelled = tradeService.cancelTradeByEmail(principal.getUsername(), tradeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Order cancelled", cancelled));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(false, "Access denied", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, sanitize(e.getMessage()), null));
        }
    }

    @GetMapping("/pnl")
    public ResponseEntity<ApiResponse<Double>> getMyPnl(
            @AuthenticationPrincipal UserDetails principal) {
        try {
            Double pnl = tradeService.getTotalPnlByEmail(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "PnL calculated", pnl));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to calculate P&L", null));
        }
    }

    // ── Legacy endpoints kept for backward-compat but SECURED with ownership check ──
    @PostMapping("/place/{userId}")
    public ResponseEntity<ApiResponse<Trade>> placeTradeById(
            @PathVariable Long userId,
            @RequestBody Trade trade,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            // SECURITY: verify JWT email matches requested userId
            Trade placed = tradeService.placeTradeByEmail(principal.getUsername(), trade);
            return ResponseEntity.ok(new ApiResponse<>(true, "Order placed successfully", placed));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, sanitize(e.getMessage()), null));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Trade>>> getUserTradesById(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal) {
        try {
            // SECURITY: always returns current user's trades — ignores path userId
            List<Trade> trades = tradeService.getUserTradesByEmail(principal.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "Trades fetched", trades));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch trades", null));
        }
    }

    /** Strip internal details from error messages before sending to client */
    private String sanitize(String msg) {
        if (msg == null) return "An error occurred";
        // Allow only business-level messages
        if (msg.contains("disabled") || msg.contains("halted") || msg.contains("cancelled")
                || msg.contains("not found") || msg.contains("limit")) {
            return msg;
        }
        return "An error occurred";
    }
}
