package com.tradepro.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {
    
    @GetMapping("/test")
    public String test() {
        return "🚀 TradePro Backend is running successfully!";
    }
    
    @GetMapping("/health")
    public String health() {
        return "✅ Backend is healthy and ready to serve requests!";
    }
}