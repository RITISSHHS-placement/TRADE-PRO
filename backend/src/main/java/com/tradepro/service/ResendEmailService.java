package com.tradepro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Sends email via Resend API (https://resend.com).
 *
 * Free tier: 100 emails/day, no credit card required.
 * Uses Java 11+ built-in HttpClient — zero new Maven dependencies.
 *
 * Set RESEND_API_KEY and RESEND_FROM_EMAIL env vars to activate.
 */
@Service
public class ResendEmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String API_URL = "https://api.resend.com/emails";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from-email:noreply@tradepro.in}")
    private String fromEmail;

    /** Returns true when a Resend API key is configured. */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Send a plain-text email via Resend.
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param body    plain-text body
     * @throws Exception on API failure
     */
    public void send(String to, String subject, String body) throws Exception {
        if (!isConfigured()) {
            log.warn("[Resend] API key not configured — skipping email to {}", to);
            return;
        }

        Map<String, Object> payload = Map.of(
                "from",    fromEmail,
                "to",      new String[]{ to },
                "subject", subject,
                "text",    body
        );

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("✅ Resend email delivered → {} (status {})", to, response.statusCode());
        } else {
            log.error("❌ Resend API error {} {}: {}", response.statusCode(), response.body(), to);
            throw new RuntimeException("Resend API returned " + response.statusCode() + ": " + response.body());
        }
    }
}
