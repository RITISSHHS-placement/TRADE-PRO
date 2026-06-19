package com.tradepro.service;

import com.tradepro.entity.Trade;
import com.tradepro.entity.User;
import com.tradepro.repository.TradeRepository;
import com.tradepro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TradeService {

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private UserRepository userRepository;

    public Trade placeTrade(Long userId, Trade trade) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getTradingEnabled()) {
            throw new RuntimeException("Trading is disabled for this account");
        }
        if (user.getKillSwitchActive()) {
            throw new RuntimeException("Kill switch is active. All trading is halted.");
        }

        trade.setUser(user);
        trade.setStatus(Trade.Status.PENDING);
        trade.setOrderTime(LocalDateTime.now());

        // TODO: Integrate with actual broker API (Zerodha/Upstox/etc.)
        // For now, simulate instant execution for MARKET orders
        if (trade.getOrderType() == Trade.OrderType.MARKET) {
            trade.setStatus(Trade.Status.COMPLETE);
            trade.setExecutedQuantity(trade.getQuantity());
            trade.setExecutionTime(LocalDateTime.now());
        }

        return tradeRepository.save(trade);
    }

    public List<Trade> getUserTrades(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return tradeRepository.findByUserOrderByOrderTimeDesc(user);
    }

    public List<Trade> getOpenPositions(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return tradeRepository.findByUserAndStatus(user, Trade.Status.PENDING);
    }

    public Trade cancelTrade(Long userId, Long tradeId) {
        Trade trade = tradeRepository.findById(tradeId)
            .orElseThrow(() -> new RuntimeException("Trade not found"));

        if (!trade.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (trade.getStatus() == Trade.Status.COMPLETE) {
            throw new RuntimeException("Cannot cancel completed trade");
        }

        trade.setStatus(Trade.Status.CANCELLED);
        return tradeRepository.save(trade);
    }

    public Double getTotalPnl(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Double pnl = tradeRepository.getTotalPnlForUser(user);
        return pnl != null ? pnl : 0.0;
    }
}
