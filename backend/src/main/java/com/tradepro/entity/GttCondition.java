package com.tradepro.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "gtt_conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GttCondition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trade_id", nullable = false)
    private Trade trade;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Condition condition;
    
    @Column(nullable = false)
    private Double price;
    
    @Column(nullable = false)
    private Integer quantity;
    
    public enum Condition {
        ABOVE, BELOW
    }
}