# Haftora QA & Quality Defect Audit Analysis (R2)

**Audit Target**: Haftora Codebase (`C:\Users\anonn\Desktop\haftora`)  
**Auditor**: Explorer Agent (`explorer_2_qa`)  
**Date**: 2026-07-28  

---

## 1. Architectural & Data Flow Overview

Haftora operates a **Hybrid SPA & Express Architecture** designed to support both static web deployment (e.g. Netlify $0/mo hosting) and Node.js backend API server deployment:

```
                          ┌────────────────────────────────────────────────────────┐
                          │                User Interface (React 19)               │
                          └───────────┬────────────────────────────────┬───────────┘
                                      │                                │
                                      ▼                                ▼
                  ┌───────────────────────────────┐        ┌───────────────────────────────┐
                  │    Market Data Service        │        │   Ticker Search Service       │
                  │   (MarketDataClient.ts)       │        │    (tickerApi / sqlite)       │
                  └───────────────┬───────────────┘        └───────────────┬───────────────┘
                                  │                                        │
           ┌──────────────────────┼──────────────────────┐                 ├──► Express Server (/api/tickers)
           ▼                      ▼                      ▼                 │
  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐        └──► Wasm SQLite (/tickers.db)
  │  Yahoo Finance  │   │  Finnhub / 12Data│   │     Polygon      │             Client Fallback
  └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘
           │ (CORS Block)        │ (Key Check)          │ (Key Check)
           └─────────────────────┴──────────────────────┴────────► Fallback Quote Cache
```

### Data Flow Components:
1. **Search Engine Data Flow**:
   - **Frontend Search**: `src/services/tickerApi.ts` attempts Express backend query (`/api/tickers?...`). If backend is offline or un-routable (SPA deployment), it seamlessly falls back to `searchClientTickers()` in `src/services/sqliteSearch.ts`.
   - **Wasm SQLite Engine**: Downloads `/tickers.db` and `/sql-wasm.wasm`, initializing `sql.js` in browser memory. Indexes all symbols into an $O(1)$ memory lookup map (`symbolIndexMap`) and caches queries in an LRU map (`searchCache`).
2. **Real-Time Market Data Flow**:
   - `src/services/marketData/MarketDataClient.ts` executes a **Chain of Responsibility Pattern**: `YahooFinanceAdapter` $\rightarrow$ `FinnhubAdapter` $\rightarrow$ `TwelveDataAdapter` $\rightarrow$ `PolygonAdapter` $\rightarrow$ `fallback-cache`.
   - Baseline quotes fallback to pre-defined ticker mappings or dynamic price ratio calculation (`previousClose = price * 0.993`).

---

## 2. Financial Edge Case Handling

| Edge Case Scenario | Location | Current Handling Logic | Audit Finding & Defect Severity |
|---|---|---|---|
| **Weekend & Holiday Closures** | `src/services/marketData/adapters/YahooFinanceAdapter.ts:32` | Uses `meta.chartPreviousClose \|\| meta.previousClose \|\| meta.regularMarketPreviousClose` | **LOW / PASS**: Preserves non-zero price ratios over weekends. However, direct browser fetch throws CORS error on frontend, forcing fallback to static cache. |
| **Zero Volume / Illiquid Assets** | `src/services/marketData/adapters/FinnhubAdapter.ts:32` | Throws `MarketDataError` if `data.c === 0` | **MEDIUM DEFECT**: Rejects zero-trade illiquid assets as "invalid payload" instead of returning zero volume with last valid price. |
| **Division by Zero in DRIP Calculation** | `src/utils/financialMath.ts:179` | `yieldOnCost = (annualDiv / totalInvested) * 100` | **HIGH DEFECT**: If `initialInvestment = 0` and `monthlyContribution = 0`, `totalInvested = 0`, producing `NaN`. Calling `.toFixed(2)` on `NaN` produces `"NaN"` strings in React UI views. |
| **Property Mismatch in DCA Calculator** | `src/components/views/CalculatorsView.tsx:47` | `val = dcaFinal.dcaPortfolioValue` | **HIGH DEFECT**: `calculateDCA()` in `financialMath.ts` returns property `dcaBalance`, NOT `dcaPortfolioValue`. `dcaFinal.dcaPortfolioValue` evaluates to `undefined`, populating saved scenario values with `undefined`. |
| **NaN Generation in 3-Fund Studio** | `src/components/views/PortfolioBuilderView.tsx:176` | `monthlyDeposit * 12 * ((Math.pow(1 + r, n) - 1) / r)` | **HIGH DEFECT**: If blended return `r === 0` (e.g., all allocation sliders set to 0), `((1)^30 - 1)/0` calculates `0/0 = NaN`. Displays `$NaN` in output cards. |
| **Missing Historical Data Arrays** | `src/services/marketData/MarketDataClient.ts:92` | Returns empty array `[]` when historical bar data fails | **MEDIUM DEFECT**: Recharts area/line components lack empty state handling when `[]` is returned, leading to blank chart views without user notification. |

---

## 3. Input Validation, Query Handling & Security Audit

### 3.1 Critical Finding: SQL Injection & Syntax Crash in Wasm SQLite Engine
- **File Location**: `src/services/sqliteSearch.ts:184`
- **Code Snippet**:
  ```typescript
  const orderClause = q
    ? `ORDER BY CASE WHEN UPPER(symbol) = '${q}' THEN 1 WHEN UPPER(symbol) LIKE '${q}%' THEN 2 ELSE 3 END, is_etf DESC, symbol ASC`
    : `ORDER BY is_etf DESC, symbol ASC`;
  ```
- **Vulnerability / Defect Explanation**:
  `q` is derived from `query.trim().toUpperCase()`. When the user enters a search term containing a single quote `'` (e.g. searching for `O'REILLY` or `' OR '1'='1`), `q` is directly concatenated into the SQL statement string.
- **Impact**:
  1. **Application Crash**: Searching for names containing apostrophes triggers a SQLite syntax error `near "REILLY": syntax error` and breaks the search UI.
  2. **Security Defect**: Contradicts the claim in `docs/QA_DEFECT_REPORT.md` (which stated SQLi was 100% PASS via parameterized queries).
- **Remediation**: Use parameterized bindings for the `ORDER BY` case expressions or sanitize single quote inputs.

---

### 3.2 Critical Finding: Express Router Nested Handlers Defect
- **File Location**: `server/routes/tickers.ts:108-180`
- **Code Snippet**:
  ```typescript
  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      // ... stats logic ...
      res.json({...});
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
    // DEFECT: Route definitions below are nested INSIDE the /stats handler body!
    router.get('/quote/:symbol', async (req, res) => { ... });
    router.get('/:symbol', async (req, res) => { ... });
    router.post('/sync', async (_req, res) => { ... });
  });
  ```
- **Vulnerability / Defect Explanation**:
  Routes `/quote/:symbol`, `/:symbol`, and `/sync` are defined inside the request handler callback of `/stats`.
- **Impact**:
  1. On server startup, `/api/tickers/quote/:symbol`, `/api/tickers/:symbol`, and `/api/tickers/sync` return 404 until GET `/api/tickers/stats` is invoked.
  2. Every time GET `/api/tickers/stats` is called, duplicated route handlers are appended to Express's internal middleware stack, leading to route handler memory leaks and duplicate execution.

---

### 3.3 Input Validation Edge Cases
1. **Uncaught Null/Undefined `symbol` Error in Market Data Client**:
   - `src/services/marketData/MarketDataClient.ts:32`: `symbol.trim().toUpperCase()` throws an uncaught `TypeError: Cannot read properties of undefined (reading 'trim')` if `symbol` is null/undefined.
2. **Client Configuration Key Management Audit**:
   - Keys (`FINNHUB_API_KEY`, `TWELVEDATA_API_KEY`, `POLYGON_API_KEY`) are accessed safely via `process.env`. Frontend bundles do not leak private keys. Optional key absence is gracefully handled by excluding inactive adapters.

---

## 4. Application Resiliency & Performance

### 4.1 Memory Leak Hazards
1. **Unbounded `MarketDataClient` Quote Cache**:
   - `src/services/marketData/MarketDataClient.ts:9`: `quoteCache = new Map<string, { quote: Quote; timestamp: number }>()`.
   - Lacks eviction or size bounding. Over long user sessions searching many tickers, memory grows continuously.
2. **Unbounded `tickerApiCache`**:
   - `src/services/tickerApi.ts:55`: `tickerApiCache = new Map<string, TickerSearchResponse>()`.
   - Lacks max capacity checks. Contrast with `src/services/sqliteSearch.ts:16` which correctly bounds `SEARCH_CACHE_MAX_SIZE = 300`.

---

### 4.2 Network & Async Execution Resiliency
1. **Server NASDAQ Sync Hanging Risk**:
   - `server/fetcher.ts:20-30`: `http.get` / `https.get` calls lack explicit `timeout` settings. If `nasdaqtrader.com` stalls, `fetchAllTickers()` and `runSync()` hang indefinitely in `isSyncing = true` state.
2. **Unhandled Promise Rejections in LocalStorage Sync**:
   - `src/services/marketApi.ts:96`: `localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(updated))` is not guarded by `try...catch`. In private browsing mode or storage-full scenarios, it throws uncaught promise rejections during daily quote sync.
3. **Rapid Component Re-renders & Async Race Conditions**:
   - `src/components/views/MarketSearchView.tsx:53-58`: Fires 12 un-batched `setQuotes` calls as individual live quotes resolve, triggering 12 re-renders per search response. Rapid typing causes late-resolving promises to mutate state for stale search results.
   - **Double Search Execution on Mount**: `MarketSearchView.tsx` executes `executeSearch` on mount in `useEffect` (line 41) AND in `debounceRef` `useEffect` (line 70), causing duplicate initial requests.

---

## 5. Summary of Identified Software Defects

| Defect ID | Category | Target File & Line | Severity | Short Description |
|---|---|---|---|---|
| **DEF-QA-01** | Security / SQLi | `src/services/sqliteSearch.ts:184` | **HIGH** | Single quote input causes un-sanitized SQL string interpolation crash in Wasm SQLite. |
| **DEF-QA-02** | Architecture | `server/routes/tickers.ts:108` | **HIGH** | Sub-routes nested inside `GET /stats` handler callback, causing 404s on startup and route memory leak. |
| **DEF-QA-03** | Financial Math | `src/components/views/CalculatorsView.tsx:47` | **HIGH** | Property mismatch `dcaFinal.dcaPortfolioValue` (should be `dcaBalance`) causes `undefined` saved scenario value. |
| **DEF-QA-04** | Financial Math | `src/components/views/PortfolioBuilderView.tsx:176` | **HIGH** | Zero blended return `r === 0` causes `0/0 = NaN` calculation in 3-Fund Studio. |
| **DEF-QA-05** | Financial Math | `src/utils/financialMath.ts:179` | **MEDIUM** | Zero investment causes `yieldOnCost` division by zero (`NaN`). |
| **DEF-QA-06** | Resiliency / Memory | `src/services/marketData/MarketDataClient.ts:9` | **MEDIUM** | Unbounded `quoteCache` Map leads to memory growth on long sessions. |
| **DEF-QA-07** | Resiliency / Memory | `src/services/tickerApi.ts:55` | **MEDIUM** | Unbounded `tickerApiCache` Map lacks LRU eviction. |
| **DEF-QA-08** | Network / Timeout | `server/fetcher.ts:20` | **MEDIUM** | `https.get` lacks socket timeout, risking permanent hang during sync. |
| **DEF-QA-09** | Resiliency / Storage | `src/services/marketApi.ts:96` | **LOW** | `localStorage.setItem` unguarded by `try...catch` during quote sync. |
| **DEF-QA-10** | Performance / UI | `src/components/views/MarketSearchView.tsx:53` | **LOW** | 12 un-batched `setQuotes` calls trigger rapid re-renders and potential race conditions. |

---
