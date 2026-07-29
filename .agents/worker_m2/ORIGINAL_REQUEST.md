## 2026-07-28T22:50:00Z
You are a Worker agent on Haftora.
Your working directory is `C:\Users\anonn\Desktop\haftora\.agents\worker_m2`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Objective: Create the QA & Security Audit deliverable at `C:\Users\anonn\Desktop\haftora\docs\QA_DEFECT_REPORT.md` and fix critical application bugs in code.

Audit & Report Requirements (`docs/QA_DEFECT_REPORT.md`):
1. **Financial Edge Cases**:
   - Weekend market closures (stale quote banners, last close price retention, market status indicators)
   - Zero-volume assets & illiquid symbols (handling missing volume fields, zero division protection, UI representation)
   - Missing historical data bars (gap filling algorithms, interpolation, fallback data provider chaining)
2. **Security & Input Validation Audit**:
   - SQL Injection audit (document DEF-QA-01 found in `src/services/sqliteSearch.ts:184` raw string interpolation in ORDER BY clause, and verify fix)
   - Search input XSS audit (sanitization of search input, React JSX auto-escaping evaluation, innerHTML checks)
   - Client API key exposure check (bundle scan of Vite client bundle, environment variable scoping `VITE_` vs backend secrets, network header leaks)
3. **Resiliency & Performance**:
   - Socket & request timeouts (audit `server/fetcher.ts` node https requests without timeout bounds)
   - Express router architecture (audit DEF-QA-02 `server/routes/tickers.ts` misnested route handlers inside `/stats` callback body causing 404s and handler leaks)
   - Memory leaks & cache eviction (audit `MarketDataClient.ts` quoteCache and `tickerApi.ts` tickerApiCache unbounded JavaScript Maps)
   - Financial calculation bugs (audit DEF-QA-03 `CalculatorsView.tsx` `dcaPortfolioValue` vs `dcaBalance` property mismatch; DEF-QA-04 `PortfolioBuilderView.tsx` and `financialMath.ts` zero return division by zero `$NaN` rendering)
4. **Comprehensive Defect Matrix**:
   - Table of all identified defects with: Defect ID, Title, Severity (`Critical` | `High` | `Medium` | `Low`), Affected File Path & Line Numbers, Reproduction Steps, Impact Assessment, Recommended Fix, Status.
   - Include detailed reproduction steps and exact recommended code fixes for every defect in the matrix.

Code Fixes to Implement:
- Fix `src/services/sqliteSearch.ts`: Parameterize or sanitize query string in `ORDER BY` clause to prevent SQL injection / syntax errors on single quote inputs like `O'REILLY`.
- Fix `server/routes/tickers.ts`: Unnest top-level routes `/quote/:symbol`, `/:symbol`, and `/sync` out of the `/stats` handler callback.
- Fix `src/components/views/CalculatorsView.tsx`: Correct `dcaPortfolioValue` to `dcaBalance`.
- Fix `src/components/views/PortfolioBuilderView.tsx` & `src/utils/financialMath.ts`: Add zero-division safeguards to prevent `NaN`.
- Fix unbounded memory maps in `MarketDataClient.ts` and `tickerApi.ts` with size limits / LRU eviction.
- Fix `server/fetcher.ts` to include socket timeouts.

Run build & test verification to confirm fixes.
Write `C:\Users\anonn\Desktop\haftora\docs\QA_DEFECT_REPORT.md` and report back to the orchestrator.
