package com.tradepro.controller;

import com.tradepro.dto.ApiResponse;
import com.tradepro.entity.Trade;
import com.tradepro.service.TradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    @PostMapping("/place/{userId}")
    public ResponseEntity<ApiResponse<Trade>> placeTrade(
            @PathVariable Long userId,
            @RequestBody Trade trade) {
        try {
            Trade placed = tradeService.placeTrade(userId, trade);
            return ResponseEntity.ok(new ApiResponse<>(true, "Order placed successfully", placed));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Trade>>> getUserTrades(@PathVariable Long userId) {
        try {
            List<Trade> trades = tradeService.getUserTrades(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Trades fetched", trades));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/positions/{userId}")
    public ResponseEntity<ApiResponse<List<Trade>>> getPositions(@PathVariable Long userId) {
        try {
            List<Trade> positions = tradeService.getOpenPositions(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Positions fetched", positions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{tradeId}/cancel/{userId}")
    public ResponseEntity<ApiResponse<Trade>> cancelTrade(
            @PathVariable Long tradeId,
            @PathVariable Long userId) {
        try {
            Trade cancelled = tradeService.cancelTrade(userId, tradeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Order cancelled", cancelled));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/pnl/{userId}")
    public ResponseEntity<ApiResponse<Double>> getTotalPnl(@PathVariable Long userId) {
        try {
            Double pnl = tradeService.getTotalPnl(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "PnL calculated", pnl));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
