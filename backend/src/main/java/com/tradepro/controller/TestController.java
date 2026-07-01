package com.tradepro.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestController {
    
    @GetMapping("/test")
    public String test() {
        return "🚀 TradePro Backend is running successfully!";
    }
    
    @GetMapping("/health")
    public String health() {
        return "✅ Backend v2 is healthy — MarketDataController active!";
    }
}