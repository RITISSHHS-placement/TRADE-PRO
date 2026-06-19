package com.tradepro.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "trades")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Basic Trade Info
    @Column(nullable = false)
    private String symbol;
    
    @Column(nullable = false)
    private String exchange;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Segment segment;
    
    // Order Details
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderType orderType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Side side;
    
    @Column(nullable = false)
    private Integer quantity;
    
    private Double price;
    private Double triggerPrice;
    
    // GTT (Good Till Triggered)
    private Boolean isGTT = false;
    private LocalDateTime gttExpiryDate;
    
    @OneToMany(mappedBy = "trade", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<GttCondition> gttConditions;
    
    // Execution Details
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;
    
    private Integer executedQuantity = 0;
    private Double executedPrice;
    
    // Timestamps
    @Column(nullable = false)
    private LocalDateTime orderTime = LocalDateTime.now();
    
    private LocalDateTime executionTime;
    
    // Risk Flags
    private Boolean isRiskyStock = false;
    private Boolean riskWarningShown = false;
    
    // P&L Tracking
    private Double pnl = 0.0;
    private Double brokerage = 0.0;
    private Double stt = 0.0;
    private Double exchangeCharges = 0.0;
    private Double gst = 0.0;
    private Double totalCharges = 0.0;
    
    public enum Segment {
        EQUITY, FUTURES, OPTIONS, CURRENCY, COMMODITY
    }
    
    public enum OrderType {
        MARKET, LIMIT, STOP_LOSS, STOP_LOSS_MARKET
    }
    
    public enum Side {
        BUY, SELL
    }
    
    public enum Status {
        PENDING, PARTIAL, COMPLETE, CANCELLED, REJECTED
    }
}