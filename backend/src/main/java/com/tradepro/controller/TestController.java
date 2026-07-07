package com.tradepro.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {
    
    @GetMapping("/test")
    public String test() {
        return "🚀 TradePro Backend is running successfully!";
    }
    
    @GetMapping("/health")
    public String health() {
        return "✅ Backend v3 — NSE MarketDataController active!";
    }
}