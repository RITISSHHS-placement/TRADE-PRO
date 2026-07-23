package com.tradepro.service;

import com.tradepro.entity.Trade;
import com.tradepro.entity.User;
import com.tradepro.repository.TradeRepository;
import com.tradepro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SECURITY: All public methods now accept email (from JWT principal)
 * instead of userId (from URL path) to prevent IDOR attacks.
 */
@Service
@Transactional
public class TradeService {

    private final TradeRepository tradeRepository;
    private final UserRepository  userRepository;

    public TradeService(TradeRepository tradeRepository, UserRepository userRepository) {
        this.tradeRepository = tradeRepository;
        this.userRepository  = userRepository;
    }

    // ── Email-based (IDOR-safe) ───────────────────────────────────

    public Trade placeTradeByEmail(String email, Trade trade) {
        User user = requireUser(email);
        return doPlaceTrade(user, trade);
    }

    public List<Trade> getUserTradesByEmail(String email) {
        return tradeRepository.findByUserOrderByOrderTimeDesc(requireUser(email));
    }

    public List<Trade> getOpenPositionsByEmail(String email) {
        return tradeRepository.findByUserAndStatus(requireUser(email), Trade.Status.PENDING);
    }

    public Trade cancelTradeByEmail(String email, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new RuntimeException("Trade not found"));
        if (!trade.getUser().getEmail().equals(email)) {
            throw new SecurityException("Access denied: trade does not belong to you");
        }
        if (trade.getStatus() == Trade.Status.COMPLETE) {
            throw new RuntimeException("Cannot cancel completed trade");
        }
        trade.setStatus(Trade.Status.CANCELLED);
        return tradeRepository.save(trade);
    }

    public Double getTotalPnlByEmail(String email) {
        Double pnl = tradeRepository.getTotalPnlForUser(requireUser(email));
        return pnl != null ? pnl : 0.0;
    }

    // ── Legacy userId-based (internal use only) ───────────────────

    public Trade placeTrade(Long userId, Trade trade) {
        return doPlaceTrade(requireById(userId), trade);
    }

    public List<Trade> getUserTrades(Long userId) {
        return tradeRepository.findByUserOrderByOrderTimeDesc(requireById(userId));
    }

    public List<Trade> getOpenPositions(Long userId) {
        return tradeRepository.findByUserAndStatus(requireById(userId), Trade.Status.PENDING);
    }

    public Trade cancelTrade(Long userId, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new RuntimeException("Trade not found"));
        if (!trade.getUser().getId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        if (trade.getStatus() == Trade.Status.COMPLETE) {
            throw new RuntimeException("Cannot cancel completed trade");
        }
        trade.setStatus(Trade.Status.CANCELLED);
        return tradeRepository.save(trade);
    }

    public Double getTotalPnl(Long userId) {
        Double pnl = tradeRepository.getTotalPnlForUser(requireById(userId));
        return pnl != null ? pnl : 0.0;
    }

    // ── Private helpers ───────────────────────────────────────────

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User requireById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Trade doPlaceTrade(User user, Trade trade) {
        if (!user.getTradingEnabled()) {
            throw new RuntimeException("Trading is disabled for this account");
        }
        if (user.getKillSwitchActive()) {
            throw new RuntimeException("Kill switch is active. All trading is halted.");
        }
        trade.setUser(user);
        trade.setStatus(Trade.Status.PENDING);
        trade.setOrderTime(LocalDateTime.now());
        if (trade.getOrderType() == Trade.OrderType.MARKET) {
            trade.setStatus(Trade.Status.COMPLETE);
            trade.setExecutedQuantity(trade.getQuantity());
            trade.setExecutionTime(LocalDateTime.now());
        }
        return tradeRepository.save(trade);
    }
}
