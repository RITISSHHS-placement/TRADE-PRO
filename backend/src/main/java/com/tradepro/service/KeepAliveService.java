package com.tradepro.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Keep-Alive service — prevents Render free tier from sleeping.
 *
 * Render spins down free services after 15 minutes of inactivity.
 * This service pings our own health endpoint every 10 minutes,
 * ensuring the server stays warm for global users 24/7.
 *
 * In production on a paid plan this service is harmless (no-op effectively).
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${server.self-url:}")
    private String selfUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Ping self every 10 minutes to prevent cold starts */
    @Scheduled(fixedDelay = 10 * 60 * 1000, initialDelay = 5 * 60 * 1000)
    public void keepAlive() {
        if (selfUrl == null || selfUrl.isBlank()) return;
        try {
            String url = selfUrl + "/actuator/health";
            restTemplate.getForObject(url, String.class);
            log.debug("Keep-alive ping successful → {}", url);
        } catch (Exception e) {
            log.debug("Keep-alive ping failed (non-critical): {}", e.getMessage());
        }
    }
}
