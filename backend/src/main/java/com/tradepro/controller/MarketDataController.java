package com.tradepro.controller;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 * Market data proxy — fetches from Yahoo Finance server-side (bypasses browser CORS).
 * Caches results for 6 seconds so rapid frontend polls don't hammer Yahoo Finance.
 */
@RestController
@RequestMapping("/api/market")
public class MarketDataController {

    // Rotate between two Yahoo Finance hosts to reduce 429 rate limiting
    private static final String[] YF_HOSTS = {
        "https://query1.finance.yahoo.com",
        "https://query2.finance.yahoo.com"
    };

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory cache: key → {data, timestamp}
    private final ConcurrentHashMap<String, CachedEntry> cache = new ConcurrentHashMap<>();
    private int hostIndex = 0;

    private static class CachedEntry {
        final String data;
        final long timestamp;
        CachedEntry(String data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isStale(long maxAgeMs) {
            return System.currentTimeMillis() - timestamp > maxAgeMs;
        }
    }

    /**
     * GET /api/market/quotes?symbols=RELIANCE.NS,^NSEI,TCS.NS
     * Returns Yahoo Finance quote data, cached for 6 seconds.
     */
    @GetMapping("/quotes")
    public ResponseEntity<String> getQuotes(@RequestParam String symbols) {
        String cacheKey = "quotes:" + symbols;
        CachedEntry entry = cache.get(cacheKey);

        // Serve from cache if fresh (< 6 seconds old)
        if (entry != null && !entry.isStale(6_000)) {
            return okJson(entry.data);
        }

        // Rotate hosts
        String host = YF_HOSTS[hostIndex % YF_HOSTS.length];
        hostIndex++;

        String url = host + "/v7/finance/quote?symbols=" +
            symbols.replace(" ", "") +
            "&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent," +
            "regularMarketOpen,regularMarketDayHigh,regularMarketDayLow," +
            "regularMarketVolume,regularMarketPreviousClose,shortName,marketState,currency";

        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(buildHeaders()), String.class
            );
            String body = resp.getBody();
            if (body != null && body.contains("quoteResponse")) {
                cache.put(cacheKey, new CachedEntry(body));
                return okJson(body);
            }
            // If Yahoo returned something but no quoteResponse, return cached or error
            if (entry != null) return okJson(entry.data);
            return ResponseEntity.status(503).body("{\"error\":\"No data from provider\"}");

        } catch (Exception e) {
            // Return stale cache rather than an error if available
            if (entry != null) return okJson(entry.data);
            return ResponseEntity.status(503)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    /**
     * GET /api/market/chart/{symbol}?interval=5m&range=1d
     * Returns intraday chart data, cached for 60 seconds.
     */
    @GetMapping("/chart/{symbol}")
    public ResponseEntity<String> getChart(
        @PathVariable String symbol,
        @RequestParam(defaultValue = "5m") String interval,
        @RequestParam(defaultValue = "1d") String range
    ) {
        String cacheKey = "chart:" + symbol + ":" + interval + ":" + range;
        CachedEntry entry = cache.get(cacheKey);

        if (entry != null && !entry.isStale(60_000)) {
            return okJson(entry.data);
        }

        String host = YF_HOSTS[hostIndex % YF_HOSTS.length];
        hostIndex++;

        String url = host + "/v8/finance/chart/" + symbol +
            "?interval=" + interval + "&range=" + range;

        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(buildHeaders()), String.class
            );
            String body = resp.getBody();
            if (body != null && body.contains("\"result\"")) {
                cache.put(cacheKey, new CachedEntry(body));
                return okJson(body);
            }
            if (entry != null) return okJson(entry.data);
            return ResponseEntity.status(503).body("{\"error\":\"No chart data\"}");

        } catch (Exception e) {
            if (entry != null) return okJson(entry.data);
            return ResponseEntity.status(503)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    // Evict cache entries older than 5 minutes every minute
    @Scheduled(fixedRate = 60_000)
    public void evictOldCache() {
        cache.entrySet().removeIf(e -> e.getValue().isStale(300_000));
    }

    private ResponseEntity<String> okJson(String body) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .header("Cache-Control", "no-cache")
            .body(body);
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        h.set("Accept", "application/json,text/plain,*/*");
        h.set("Accept-Language", "en-US,en;q=0.9");
        h.set("Accept-Encoding", "gzip, deflate, br");
        h.set("Referer", "https://finance.yahoo.com/");
        h.set("Origin", "https://finance.yahoo.com");
        h.set("sec-ch-ua", "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"");
        h.set("sec-ch-ua-mobile", "?0");
        h.set("sec-ch-ua-platform", "\"Windows\"");
        h.set("Sec-Fetch-Dest", "empty");
        h.set("Sec-Fetch-Mode", "cors");
        h.set("Sec-Fetch-Site", "same-site");
        return h;
    }

    private String escapeJson(String s) {
        if (s == null) return "unknown error";
        return s.replace("\"", "'").replace("\n", " ").replace("\r", "");
    }
}
