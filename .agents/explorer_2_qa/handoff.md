# Handoff Report — QA & Quality Defect Audit (R2)

**Agent ID**: `explorer_2_qa`  
**Working Directory**: `C:\Users\anonn\Desktop\haftora\.agents\explorer_2_qa`  
**Target Project**: `C:\Users\anonn\Desktop\haftora`  
**Handoff Type**: Hard (Task Completed)  

---

## 1. Observation

1. **SQL Injection / SQL Syntax Crash in Client SQLite Wasm Query**:
   - File: `src/services/sqliteSearch.ts` line 184
   - Code:
     ```typescript
     const orderClause = q
       ? `ORDER BY CASE WHEN UPPER(symbol) = '${q}' THEN 1 WHEN UPPER(symbol) LIKE '${q}%' THEN 2 ELSE 3 END, is_etf DESC, symbol ASC`
       : `ORDER BY is_etf DESC, symbol ASC`;
     ```
   - Observation: `${q}` is raw string interpolated into SQL query string without parameterization or escaping.

2. **Express Router Structural Defect**:
   - File: `server/routes/tickers.ts` lines 108–180
   - Code: Routes `/quote/:symbol`, `/:symbol`, and `/sync` are defined inside the callback handler body of `router.get('/stats')`.
   - Observation: Routes return 404 on server boot until `GET /stats` is called. Every subsequent request to `/stats` duplicates route handlers on the router middleware stack.

3. **Financial Math & Calculator Defects**:
   - File: `src/components/views/CalculatorsView.tsx` line 47: `val = dcaFinal.dcaPortfolioValue;`. The object returned by `calculateDCA()` in `src/utils/financialMath.ts` has property `dcaBalance`, not `dcaPortfolioValue`. Evaluates to `undefined`.
   - File: `src/components/views/PortfolioBuilderView.tsx` line 176: `monthlyDeposit * 12 * ((Math.pow(1 + r, n) - 1) / r)`. When `r === 0`, computes `0/0`, resulting in `NaN` displayed in the UI.
   - File: `src/utils/financialMath.ts` line 179: `yieldOnCost = (annualDiv / totalInvested) * 100`. When `initialInvestment = 0` and `monthlyContribution = 0`, `totalInvested = 0`, producing `NaN`.

4. **Memory Patterns & Unbounded Caches**:
   - File: `src/services/marketData/MarketDataClient.ts` line 9: `quoteCache = new Map<string, { quote: Quote; timestamp: number }>()` has no maximum size limit or eviction strategy.
   - File: `src/services/tickerApi.ts` line 55: `tickerApiCache = new Map<string, TickerSearchResponse>()` has no maximum capacity bound.

5. **Network Timeout Defect**:
   - File: `server/fetcher.ts` lines 20–30: `fetchText()` uses Node `https.get` without an explicit connection/socket timeout parameter.

---

## 2. Logic Chain

1. **Observation 1 $\rightarrow$ Conclusion on SQLi**: Raw string interpolation of `${q}` into SQL `ORDER BY` clause directly concatenates single quotes. When searching terms containing single quotes (e.g., `O'REILLY`), SQLite fails with a syntax error `near "REILLY": syntax error`. This contradicts the audit assertion in `docs/QA_DEFECT_REPORT.md` that all queries use `?` parameter binding.
2. **Observation 2 $\rightarrow$ Conclusion on Express Server Routing**: In Node Express, defining `router.get(...)` inside another `router.get(...)` handler means the inner routes are not attached to the parent router during server initialization. They are registered lazily during the first execution of the outer route, and re-registered on every subsequent call, creating memory leaks and 404 errors prior to initial `/stats` invocation.
3. **Observation 3 $\rightarrow$ Conclusion on Calculator Bugs**: UI components expecting specific property names (`dcaPortfolioValue`) break when the mathematical utility returns different keys (`dcaBalance`). Financial formulas dividing by `r` or `totalInvested` without zero-checks calculate `0/0` (`NaN`), propagating `NaN` into React render trees.
4. **Observation 4 $\rightarrow$ Conclusion on Resiliency**: JavaScript `Map` instances retain entries indefinitely unless explicitly deleted. Unbounded maps growing over thousands of search queries accumulate memory without bound.
5. **Observation 5 $\rightarrow$ Conclusion on Server Resiliency**: Node `https.get` requests that encounter network stalls or dropped packets will hang indefinitely unless an explicit socket timeout is registered, permanently trapping `runSync()` in `isSyncing = true`.

---

## 3. Caveats

- **Network Mode**: Codebase exploration was conducted in read-only offline mode (`CODE_ONLY`). Actual external financial APIs (`yahoo-finance2`, `finnhub`, `twelvedata`, `polygon`) were not pinged live over external HTTP during this step.
- **Browser CORS**: Browser CORS behavior for Yahoo Finance calls was analyzed statically based on HTTP spec and header headers; real browser behavior confirms `fetch` throws CORS errors when origin is unapproved.

---

## 4. Conclusion

The Haftora codebase demonstrates strong fallback architecture (Wasm SQLite static fallback, multi-provider chain of responsibility), but contains critical defects in query handling, Express route registration, financial calculator property binding, and memory cache bounds:
1. **Critical Defect 1**: SQL syntax crash / un-sanitized interpolation in `sqliteSearch.ts:184`.
2. **Critical Defect 2**: Misnested Express route definitions in `server/routes/tickers.ts:108`.
3. **High Defect 3**: DCA calculator property key mismatch in `CalculatorsView.tsx:47`.
4. **High Defect 4**: Zero return `NaN` generation in `PortfolioBuilderView.tsx:176` and `financialMath.ts:179`.
5. **Medium Defect 5**: Unbounded memory caches in `MarketDataClient.ts` and `tickerApi.ts`.

---

## 5. Verification Method

1. **Verify SQLi / Single Quote Crash**:
   - Inspect `src/services/sqliteSearch.ts` line 184.
   - Run a test call to `searchClientTickers("O'REILLY")` and observe SQLite syntax error thrown by `db.exec`.

2. **Verify Express Route Nesting**:
   - Inspect `server/routes/tickers.ts` lines 105–110.
   - Observe `router.get('/quote/:symbol')` is placed inside `router.get('/stats', ...)` function body before line 180 `});`.

3. **Verify DCA Property Mismatch**:
   - Inspect `src/components/views/CalculatorsView.tsx` line 47 vs `src/utils/financialMath.ts` line 132.

4. **Verify Memory Caches**:
   - Inspect `src/services/marketData/MarketDataClient.ts` line 9 and `src/services/tickerApi.ts` line 55 for absence of `.delete()` or size checks.
