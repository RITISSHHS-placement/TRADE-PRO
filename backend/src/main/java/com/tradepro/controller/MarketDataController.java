package com.tradepro.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Proxy for Yahoo Finance market data.
 * The frontend cannot call Yahoo Finance directly due to CORS.
 * This controller fetches from Yahoo Finance server-side and returns the data.
 */
@RestController
@RequestMapping("/api/market")
public class MarketDataController {

    private static final String YF_QUOTE_URL =
        "https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,shortName,longName,marketState,currency";

    private static final String YF_CHART_URL =
        "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=5m&range=1d";

    private final RestTemplate restTemplate;

    public MarketDataController() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * GET /api/market/quotes?symbols=RELIANCE.NS,^NSEI,TCS.NS
     * Proxies Yahoo Finance quote endpoint.
     */
    @GetMapping("/quotes")
    public ResponseEntity<String> getQuotes(@RequestParam String symbols) {
        try {
            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                YF_QUOTE_URL,
                HttpMethod.GET,
                entity,
                String.class,
                symbols
            );

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_JSON);
            responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

            return ResponseEntity.ok()
                .headers(responseHeaders)
                .body(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    /**
     * GET /api/market/chart/{symbol}?interval=5m&range=1d
     * Proxies Yahoo Finance chart endpoint.
     */
    @GetMapping("/chart/{symbol}")
    public ResponseEntity<String> getChart(
        @PathVariable String symbol,
        @RequestParam(defaultValue = "5m") String interval,
        @RequestParam(defaultValue = "1d") String range
    ) {
        try {
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
                symbol + "?interval=" + interval + "&range=" + range;

            HttpHeaders headers = buildHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_JSON);
            responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

            return ResponseEntity.ok()
                .headers(responseHeaders)
                .body(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        headers.set("Accept-Language", "en-US,en;q=0.9");
        headers.set("Referer", "https://finance.yahoo.com/");
        headers.set("Origin", "https://finance.yahoo.com");
        return headers;
    }
}
