package com.tradepro.controller;

import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.*;

/**
 * Market data proxy — fetches from NSE India public API (no key needed).
 * NSE endpoints work from server-side; browsers get blocked by NSE's Cloudflare.
 * Results are cached so rapid frontend polls don't hammer NSE.
 *
 * Endpoints:
 *   GET /api/market/indices        → all NSE indices (NIFTY 50, BANK NIFTY, etc.)
 *   GET /api/market/nifty50        → all 50 stocks in NIFTY 50 with live prices
 *   GET /api/market/gainers        → top gainers
 *   GET /api/market/losers         → top losers
 *   GET /api/market/stock/{symbol} → single stock quote
 */
@RestController
@RequestMapping("/api/market")
public class MarketDataController {

    private static final String NSE_BASE = "https://www.nseindia.com/api";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ConcurrentHashMap<String, CachedEntry> cache = new ConcurrentHashMap<>();

    private static class CachedEntry {
        final String data;
        final long   ts;
        CachedEntry(String data) { this.data = data; this.ts = System.currentTimeMillis(); }
        boolean isStale(long ms) { return System.currentTimeMillis() - ts > ms; }
    }

    /** All NSE indices — cached 6 s */
    @GetMapping("/indices")
    public ResponseEntity<String> indices() {
        return proxy("indices", NSE_BASE + "/allIndices", 6_000);
    }

    /** NIFTY 50 constituent stocks — cached 6 s */
    @GetMapping("/nifty50")
    public ResponseEntity<String> nifty50() {
        return proxy("nifty50",
            NSE_BASE + "/equity-stockIndices?index=NIFTY%2050", 6_000);
    }

    /** NIFTY BANK constituent stocks — cached 6 s */
    @GetMapping("/niftybank")
    public ResponseEntity<String> niftyBank() {
        return proxy("niftybank",
            NSE_BASE + "/equity-stockIndices?index=NIFTY%20BANK", 6_000);
    }

    /** Top gainers (NIFTY 500 scope) — cached 10 s */
    @GetMapping("/gainers")
    public ResponseEntity<String> gainers() {
        return proxy("gainers",
            NSE_BASE + "/live-analysis-variations?index=gainers", 10_000);
    }

    /** Top losers — cached 10 s */
    @GetMapping("/losers")
    public ResponseEntity<String> losers() {
        return proxy("losers",
            NSE_BASE + "/live-analysis-variations?index=loosers", 10_000);
    }

    /** Single stock quote (NSE) — cached 6 s */
    @GetMapping("/stock/{symbol}")
    public ResponseEntity<String> stock(@PathVariable String symbol) {
        String sym = symbol.toUpperCase().replace("-", "%2526");
        return proxy("stock:" + sym,
            NSE_BASE + "/quote-equity?symbol=" + sym, 6_000);
    }

    /** NSE most active by value — cached 10 s */
    @GetMapping("/mostactive")
    public ResponseEntity<String> mostActive() {
        return proxy("mostactive",
            NSE_BASE + "/live-analysis-variations?index=mostactivesecurities", 10_000);
    }

    // ── core proxy with cache ────────────────────────────────────
    private ResponseEntity<String> proxy(String key, String url, long maxAgeMs) {
        CachedEntry entry = cache.get(key);
        if (entry != null && !entry.isStale(maxAgeMs)) {
            return ok(entry.data);
        }
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(nseHeaders()), String.class
            );
            String body = resp.getBody();
            if (body != null && body.startsWith("{")) {
                cache.put(key, new CachedEntry(body));
                return ok(body);
            }
            if (entry != null) return ok(entry.data);
            return ResponseEntity.status(503).body("{\"error\":\"No data\"}");
        } catch (Exception e) {
            if (entry != null) return ok(entry.data);
            return ResponseEntity.status(503).contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    private ResponseEntity<String> ok(String body) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .header("Cache-Control", "no-cache")
            .body(body);
    }

    private HttpHeaders nseHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        h.set("Accept",          "application/json, text/plain, */*");
        h.set("Accept-Language", "en-US,en;q=0.9");
        h.set("Referer",         "https://www.nseindia.com/");
        h.set("Origin",          "https://www.nseindia.com");
        h.set("Connection",      "keep-alive");
        return h;
    }

    @Scheduled(fixedRate = 60_000)
    public void evictCache() {
        cache.entrySet().removeIf(e -> e.getValue().isStale(300_000));
    }
}
