package com.tradepro.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Market data controller — fetches from Yahoo Finance v8 API.
 *
 * NSE India blocks requests from non-Indian server IPs (Render, Railway, etc.)
 * Yahoo Finance v8 works from any server, no API key required.
 *
 * Symbol mapping:
 *   NSE stocks   → symbol.NS  (e.g. RELIANCE → RELIANCE.NS)
 *   NSE indices  → ^NSEI, ^NSEBANK, ^CNXIT, ^INDIAVIX, etc.
 *   US stocks    → plain symbol (AAPL, MSFT …)
 *
 * Cache TTLs: indices 10s, stocks 10s, gainers/losers 15s
 */
@RestController
@RequestMapping("/api/market")
public class MarketDataController {

    private static final Logger log = LoggerFactory.getLogger(MarketDataController.class);

    private static final String YF_CHART  = "https://query1.finance.yahoo.com/v8/finance/chart/";
    private static final String YF_SPARK  = "https://query1.finance.yahoo.com/v8/finance/spark";

    private final RestTemplate   restTemplate = new RestTemplate();
    private final ObjectMapper   mapper       = new ObjectMapper();
    private final ConcurrentHashMap<String, CachedEntry> cache = new ConcurrentHashMap<>();

    // ── NSE Index symbols → Yahoo Finance tickers ──────────────────────────
    private static final Map<String, String> INDEX_SYMBOLS = new LinkedHashMap<>();
    static {
        INDEX_SYMBOLS.put("NIFTY 50",               "^NSEI");
        INDEX_SYMBOLS.put("NIFTY BANK",              "^NSEBANK");
        INDEX_SYMBOLS.put("NIFTY IT",                "^CNXIT");
        INDEX_SYMBOLS.put("NIFTY PHARMA",            "^CNXPHARMA");
        INDEX_SYMBOLS.put("NIFTY AUTO",              "^CNXAUTO");
        INDEX_SYMBOLS.put("NIFTY FMCG",              "^CNXFMCG");
        INDEX_SYMBOLS.put("NIFTY METAL",             "^CNXMETAL");
        INDEX_SYMBOLS.put("NIFTY REALTY",            "^CNXREALTY");
        INDEX_SYMBOLS.put("NIFTY FINANCIAL SERVICES","^CNXFINANCE");
        INDEX_SYMBOLS.put("NIFTY MIDCAP 100",        "^CNXMIDCAP");
        INDEX_SYMBOLS.put("NIFTY SMALLCAP 100",      "^CNXSC");
        INDEX_SYMBOLS.put("INDIA VIX",               "^INDIAVIX");
        INDEX_SYMBOLS.put("NIFTY NEXT 50",           "^NSMIDCP50");
        INDEX_SYMBOLS.put("SENSEX",                  "^BSESN");
    }

    // ── Top NIFTY 50 stocks for gainers/losers/mostactive ──────────────────
    private static final String[] NIFTY50_SYMBOLS = {
        "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
        "SBIN.NS","BAJFINANCE.NS","BHARTIARTL.NS","KOTAKBANK.NS","WIPRO.NS",
        "HCLTECH.NS","AXISBANK.NS","LT.NS","ITC.NS","MARUTI.NS",
        "TITAN.NS","TATAMOTORS.NS","TATASTEEL.NS","ONGC.NS","NTPC.NS",
        "SUNPHARMA.NS","ULTRACEMCO.NS","NESTLEIND.NS","ASIANPAINT.NS","POWERGRID.NS",
        "COALINDIA.NS","ADANIENT.NS","ADANIPORTS.NS","BAJAJ-AUTO.NS","HEROMOTOCO.NS",
        "TATACONSUM.NS","INDIGO.NS","DRREDDY.NS","CIPLA.NS","APOLLOHOSP.NS",
        "EICHERMOT.NS","GRASIM.NS","DIVISLAB.NS","TECHM.NS","INDUSINDBK.NS",
        "POLYCAB.NS","HDFCLIFE.NS","SBILIFE.NS","TRENT.NS","VEDL.NS",
        "RECLTD.NS","PFC.NS","HINDALCO.NS","JSWSTEEL.NS","BAJAJFINSV.NS"
    };

    // ── Cache entry ─────────────────────────────────────────────────────────
    private static class CachedEntry {
        final String data;
        final long   ts;
        CachedEntry(String data) { this.data = data; this.ts = System.currentTimeMillis(); }
        boolean isStale(long ms) { return System.currentTimeMillis() - ts > ms; }
    }

    // ────────────────────────────────────────────────────────────────────────
    // PUBLIC ENDPOINTS
    // ────────────────────────────────────────────────────────────────────────

    /** All indices — NIFTY 50, BANK NIFTY, VIX, SENSEX etc. */
    @GetMapping("/indices")
    public ResponseEntity<String> indices() {
        final String KEY = "indices";
        CachedEntry e = cache.get(KEY);
        if (e != null && !e.isStale(10_000)) return ok(e.data);

        try {
            ArrayNode arr = mapper.createArrayNode();
            for (Map.Entry<String, String> kv : INDEX_SYMBOLS.entrySet()) {
                try {
                    ObjectNode node = fetchSingleQuote(kv.getValue(), kv.getKey());
                    if (node != null) arr.add(node);
                } catch (Exception ex) {
                    log.debug("Index {} failed: {}", kv.getKey(), ex.getMessage());
                }
            }
            ObjectNode result = mapper.createObjectNode();
            result.set("data", arr);
            String body = mapper.writeValueAsString(result);
            cache.put(KEY, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            log.warn("indices error: {}", ex.getMessage());
            if (e != null) return ok(e.data);
            return err("Failed to fetch indices");
        }
    }

    /** NIFTY 50 constituent stocks */
    @GetMapping("/nifty50")
    public ResponseEntity<String> nifty50() {
        return fetchBatchStocks("nifty50", NIFTY50_SYMBOLS, 10_000);
    }

    /** NIFTY BANK constituents */
    @GetMapping("/niftybank")
    public ResponseEntity<String> niftyBank() {
        String[] bankSyms = {
            "HDFCBANK.NS","ICICIBANK.NS","KOTAKBANK.NS","AXISBANK.NS","SBIN.NS",
            "INDUSINDBK.NS","BANDHANBNK.NS","FEDERALBNK.NS","IDFCFIRSTB.NS","AUBANK.NS",
            "CANBK.NS","PNB.NS","BANKBARODA.NS","UNIONBANK.NS","RBLBANK.NS"
        };
        return fetchBatchStocks("niftybank", bankSyms, 10_000);
    }

    /** Top gainers — NIFTY 50 sorted by % change descending */
    @GetMapping("/gainers")
    public ResponseEntity<String> gainers() {
        final String KEY = "gainers";
        CachedEntry e = cache.get(KEY);
        if (e != null && !e.isStale(15_000)) return ok(e.data);

        try {
            List<ObjectNode> stocks = fetchAllNifty50Quotes();
            stocks.sort((a, b) -> Double.compare(
                b.get("perChange").asDouble(0),
                a.get("perChange").asDouble(0)));

            String body = buildNiftyList("NIFTY", stocks.subList(0, Math.min(15, stocks.size())));
            cache.put(KEY, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            log.warn("gainers error: {}", ex.getMessage());
            if (e != null) return ok(e.data);
            return err("Failed to fetch gainers");
        }
    }

    /** Top losers — NIFTY 50 sorted by % change ascending */
    @GetMapping("/losers")
    public ResponseEntity<String> losers() {
        final String KEY = "losers";
        CachedEntry e = cache.get(KEY);
        if (e != null && !e.isStale(15_000)) return ok(e.data);

        try {
            List<ObjectNode> stocks = fetchAllNifty50Quotes();
            stocks.sort((a, b) -> Double.compare(
                a.get("perChange").asDouble(0),
                b.get("perChange").asDouble(0)));

            String body = buildNiftyList("NIFTY", stocks.subList(0, Math.min(15, stocks.size())));
            cache.put(KEY, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            log.warn("losers error: {}", ex.getMessage());
            if (e != null) return ok(e.data);
            return err("Failed to fetch losers");
        }
    }

    /** Most active — sorted by volume descending */
    @GetMapping("/mostactive")
    public ResponseEntity<String> mostActive() {
        final String KEY = "mostactive";
        CachedEntry e = cache.get(KEY);
        if (e != null && !e.isStale(15_000)) return ok(e.data);

        try {
            List<ObjectNode> stocks = fetchAllNifty50Quotes();
            stocks.sort((a, b) -> Long.compare(
                b.get("trade_quantity").asLong(0),
                a.get("trade_quantity").asLong(0)));

            String body = buildNiftyList("NIFTY", stocks.subList(0, Math.min(20, stocks.size())));
            cache.put(KEY, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            log.warn("mostactive error: {}", ex.getMessage());
            if (e != null) return ok(e.data);
            return err("Failed to fetch mostactive");
        }
    }

    /** Single stock quote */
    @GetMapping("/stock/{symbol}")
    public ResponseEntity<String> stock(@PathVariable String symbol) {
        String sym    = symbol.toUpperCase();
        String yfsym  = sym.endsWith(".NS") ? sym : sym + ".NS";
        String key    = "stock:" + sym;

        CachedEntry e = cache.get(key);
        if (e != null && !e.isStale(10_000)) return ok(e.data);

        try {
            ObjectNode node = fetchSingleQuote(yfsym, sym);
            if (node == null) return err("No data for " + sym);
            String body = mapper.writeValueAsString(node);
            cache.put(key, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            if (e != null) return ok(e.data);
            return err("Failed to fetch " + sym);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ────────────────────────────────────────────────────────────────────────

    /** Fetch a single ticker via Yahoo Finance v8 /chart — returns NSE-shaped ObjectNode */
    private ObjectNode fetchSingleQuote(String yfSymbol, String displayName) throws Exception {
        String url = YF_CHART + yfSymbol + "?interval=1d&range=1d";
        ResponseEntity<String> resp = restTemplate.exchange(
            url, HttpMethod.GET, new HttpEntity<>(yfHeaders()), String.class);

        JsonNode root = mapper.readTree(resp.getBody());
        JsonNode result = root.path("chart").path("result");
        if (!result.isArray() || result.isEmpty()) return null;

        JsonNode meta = result.get(0).path("meta");
        double price     = meta.path("regularMarketPrice").asDouble(0);
        double prevClose = meta.path("previousClose").asDouble(0);
        double change    = price - prevClose;
        double changePct = prevClose > 0 ? (change / prevClose) * 100.0 : 0;
        double open      = meta.path("regularMarketOpen").asDouble(price);
        double high      = meta.path("regularMarketDayHigh").asDouble(price);
        double low       = meta.path("regularMarketDayLow").asDouble(price);
        long   volume    = meta.path("regularMarketVolume").asLong(0);
        double yearHigh  = meta.path("fiftyTwoWeekHigh").asDouble(0);
        double yearLow   = meta.path("fiftyTwoWeekLow").asDouble(0);

        // Strip ".NS" / "^" from display
        String idx = displayName != null ? displayName
            : yfSymbol.replace(".NS","").replace("^","");

        ObjectNode n = mapper.createObjectNode();
        // NSE allIndices-compatible shape so frontend marketSlice works unchanged
        n.put("index",         idx);
        n.put("indexSymbol",   idx);
        n.put("last",          price);
        n.put("variation",     change);
        n.put("percentChange", changePct);
        n.put("open",          open);
        n.put("high",          high);
        n.put("low",           low);
        n.put("previousClose", prevClose);
        n.put("yearHigh",      yearHigh);
        n.put("yearLow",       yearLow);
        n.put("volume",        volume);
        // Also add stock-style fields for gainers/losers compatibility
        n.put("symbol",        idx);
        n.put("ltp",           price);
        n.put("net_price",     changePct);
        n.put("perChange",     changePct);
        n.put("open_price",    open);
        n.put("high_price",    high);
        n.put("low_price",     low);
        n.put("prev_price",    prevClose);
        n.put("trade_quantity", volume);
        return n;
    }

    /** Fetch all NIFTY50 stocks in parallel (ThreadPool), return list of ObjectNodes */
    private List<ObjectNode> fetchAllNifty50Quotes() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(10);
        List<Future<ObjectNode>> futures = new ArrayList<>();

        for (String sym : NIFTY50_SYMBOLS) {
            String display = sym.replace(".NS","");
            futures.add(pool.submit(() -> {
                try { return fetchSingleQuote(sym, display); }
                catch (Exception ex) { return null; }
            }));
        }
        pool.shutdown();
        pool.awaitTermination(8, TimeUnit.SECONDS);

        List<ObjectNode> result = new ArrayList<>();
        for (Future<ObjectNode> f : futures) {
            try {
                ObjectNode n = f.get(1, TimeUnit.SECONDS);
                if (n != null) result.add(n);
            } catch (Exception ignored) {}
        }
        return result;
    }

    /** Fetch a batch of stocks, return in NSE equity-stockIndices shape */
    private ResponseEntity<String> fetchBatchStocks(String key, String[] symbols, long ttl) {
        CachedEntry e = cache.get(key);
        if (e != null && !e.isStale(ttl)) return ok(e.data);

        try {
            ExecutorService pool = Executors.newFixedThreadPool(10);
            List<Future<ObjectNode>> futures = new ArrayList<>();
            for (String sym : symbols) {
                String display = sym.replace(".NS","");
                futures.add(pool.submit(() -> {
                    try { return fetchSingleQuote(sym, display); }
                    catch (Exception ex) { return null; }
                }));
            }
            pool.shutdown();
            pool.awaitTermination(8, TimeUnit.SECONDS);

            ArrayNode arr = mapper.createArrayNode();
            for (Future<ObjectNode> f : futures) {
                try {
                    ObjectNode n = f.get(1, TimeUnit.SECONDS);
                    if (n != null) arr.add(n);
                } catch (Exception ignored) {}
            }

            // Shape: { data: [ ... ] } — matches NSE equity-stockIndices response
            ObjectNode result = mapper.createObjectNode();
            result.set("data", arr);
            String body = mapper.writeValueAsString(result);
            cache.put(key, new CachedEntry(body));
            return ok(body);
        } catch (Exception ex) {
            log.warn("{} batch error: {}", key, ex.getMessage());
            if (e != null) return ok(e.data);
            return err("Failed to fetch " + key);
        }
    }

    /** Build NSE live-analysis-variations shape: { NIFTY: { data: [...] } } */
    private String buildNiftyList(String scope, List<ObjectNode> stocks) throws Exception {
        ArrayNode arr = mapper.createArrayNode();
        for (ObjectNode s : stocks) arr.add(s);
        ObjectNode inner = mapper.createObjectNode();
        inner.set("data", arr);
        ObjectNode outer = mapper.createObjectNode();
        outer.set(scope, inner);
        // Also provide flat data array for fallback
        outer.set("data", arr);
        return mapper.writeValueAsString(outer);
    }

    private HttpHeaders yfHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0.0.0 Safari/537.36");
        h.set("Accept",          "application/json,text/plain,*/*");
        h.set("Accept-Language", "en-US,en;q=0.9");
        h.set("Accept-Encoding", "gzip, deflate, br");
        h.set("Origin",          "https://finance.yahoo.com");
        h.set("Referer",         "https://finance.yahoo.com/");
        return h;
    }

    private ResponseEntity<String> ok(String body) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .header("Cache-Control", "no-cache")
            .body(body);
    }

    private ResponseEntity<String> err(String msg) {
        return ResponseEntity.status(503)
            .contentType(MediaType.APPLICATION_JSON)
            .body("{\"error\":\"" + msg + "\",\"data\":[]}");
    }

    /** Evict stale cache entries every 5 minutes */
    @Scheduled(fixedRate = 300_000)
    public void evictCache() {
        cache.entrySet().removeIf(e -> e.getValue().isStale(600_000));
        log.debug("Market cache evicted");
    }
}
