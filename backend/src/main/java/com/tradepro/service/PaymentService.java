package com.tradepro.service;

import com.tradepro.entity.Trade;
import com.tradepro.entity.User;
import com.tradepro.repository.TradeRepository;
import com.tradepro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentService {

    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;

    public PaymentService(TradeRepository tradeRepository, UserRepository userRepository) {
        this.tradeRepository = tradeRepository;
        this.userRepository = userRepository;
    }

    public boolean verifyPaymentForUser(String email, Long tradeId, String paymentReference) {
        if (tradeId == null || paymentReference == null || paymentReference.isBlank()) {
            throw new IllegalArgumentException("Trade ID and payment reference are required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new SecurityException("User not found"));

        Trade trade = tradeRepository.findById(tradeId)
                .orElseThrow(() -> new RuntimeException("Trade not found"));

        if (!trade.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Trade does not belong to authenticated user");
        }

        if (trade.getStatus() != Trade.Status.PENDING) {
            throw new IllegalStateException("Only pending trades can be verified");
        }

        // Placeholder for real payment gateway verification logic.
        // In production, swap this with a call to the payments provider,
        // validate signatures, and reconcile amounts.
        boolean paymentValid = paymentReference.matches("^[A-Z0-9_-]{8,64}$");
        if (!paymentValid) {
            return false;
        }

        trade.setStatus(Trade.Status.COMPLETE);
        tradeRepository.save(trade);
        return true;
    }
}
