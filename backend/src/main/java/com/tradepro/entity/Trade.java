package com.tradepro.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JsonIgnoreProperties({"password", "totpSecret", "boundDevices", "activeSessions", "authorities", "username", "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled"})
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
    @JsonIgnoreProperties("trade")
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
    
    // Explicit getters/setters — Lombok @Data broken on Java 26
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public String getExchange() { return exchange; }
    public void setExchange(String exchange) { this.exchange = exchange; }
    public Segment getSegment() { return segment; }
    public void setSegment(Segment segment) { this.segment = segment; }
    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }
    public Side getSide() { return side; }
    public void setSide(Side side) { this.side = side; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Double getTriggerPrice() { return triggerPrice; }
    public void setTriggerPrice(Double triggerPrice) { this.triggerPrice = triggerPrice; }
    public Boolean getIsGTT() { return isGTT; }
    public void setIsGTT(Boolean isGTT) { this.isGTT = isGTT; }
    public LocalDateTime getGttExpiryDate() { return gttExpiryDate; }
    public void setGttExpiryDate(LocalDateTime gttExpiryDate) { this.gttExpiryDate = gttExpiryDate; }
    public Set<GttCondition> getGttConditions() { return gttConditions; }
    public void setGttConditions(Set<GttCondition> gttConditions) { this.gttConditions = gttConditions; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Integer getExecutedQuantity() { return executedQuantity; }
    public void setExecutedQuantity(Integer executedQuantity) { this.executedQuantity = executedQuantity; }
    public Double getExecutedPrice() { return executedPrice; }
    public void setExecutedPrice(Double executedPrice) { this.executedPrice = executedPrice; }
    public LocalDateTime getOrderTime() { return orderTime; }
    public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }
    public LocalDateTime getExecutionTime() { return executionTime; }
    public void setExecutionTime(LocalDateTime executionTime) { this.executionTime = executionTime; }
    public Boolean getIsRiskyStock() { return isRiskyStock; }
    public void setIsRiskyStock(Boolean isRiskyStock) { this.isRiskyStock = isRiskyStock; }
    public Boolean getRiskWarningShown() { return riskWarningShown; }
    public void setRiskWarningShown(Boolean riskWarningShown) { this.riskWarningShown = riskWarningShown; }
    public Double getPnl() { return pnl; }
    public void setPnl(Double pnl) { this.pnl = pnl; }
    public Double getBrokerage() { return brokerage; }
    public void setBrokerage(Double brokerage) { this.brokerage = brokerage; }
    public Double getStt() { return stt; }
    public void setStt(Double stt) { this.stt = stt; }
    public Double getExchangeCharges() { return exchangeCharges; }
    public void setExchangeCharges(Double exchangeCharges) { this.exchangeCharges = exchangeCharges; }
    public Double getGst() { return gst; }
    public void setGst(Double gst) { this.gst = gst; }
    public Double getTotalCharges() { return totalCharges; }
    public void setTotalCharges(Double totalCharges) { this.totalCharges = totalCharges; }
}