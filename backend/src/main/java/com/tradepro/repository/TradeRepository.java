package com.tradepro.repository;

import com.tradepro.entity.Trade;
import com.tradepro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByUser(User user);
    List<Trade> findByUserAndStatus(User user, Trade.Status status);
    List<Trade> findByUserOrderByOrderTimeDesc(User user);

    @Query("SELECT t FROM Trade t WHERE t.user = :user AND t.orderTime >= :from")
    List<Trade> findByUserSince(User user, LocalDateTime from);

    @Query("SELECT SUM(t.pnl) FROM Trade t WHERE t.user = :user AND t.status = 'COMPLETE'")
    Double getTotalPnlForUser(User user);
}
