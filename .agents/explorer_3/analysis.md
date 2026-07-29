# R3: Automated Tests Analysis Report — Haftora Codebase

## Executive Summary

This report provides a comprehensive technical investigation of **R3: Automated Tests** within the Haftora codebase (`C:\Users\anonn\Desktop\haftora`). The codebase incorporates an E2E Playwright UI suite (`tests/haftora.spec.ts`), a standalone fallback resilient client script (`tests/fallback.test.ts`), live console inspection scripts (`scripts/test-live-console.ts`), and local preview audit utilities (`scripts/audit-pages.ts`).

Our investigation identified **critical architectural flaws** in test placement and environment configuration that cause `npm test` (`npx playwright test`) to fail immediately:
1. **Playwright File Collision & Process Termination**: `tests/fallback.test.ts` resides in `./tests` and matches Playwright's default test file pattern (`*.test.ts`). However, `fallback.test.ts` is written as a standalone script executing top-level code. When unmocked live internet requests fail, `fallback.test.ts` invokes `process.exit(1)`, killing the Playwright worker runner before E2E tests run.
2. **Unmocked External Network Dependencies**: `fallback.test.ts` (Test 1) and `scripts/test-live-console.ts` depend on live HTTP fetch requests (`query1.finance.yahoo.com` and `haftora.netlify.app`), causing failures in offline or restricted-network environments (such as CI/CD sandboxes or `CODE_ONLY` mode).
3. **Mobile Viewport Selector Mismatches**: In `tests/haftora.spec.ts`, the mobile project (`iPhone 13` viewport) fails because desktop header navigation elements (`#nav-home`, `#nav-learn`, etc.) are hidden via CSS (`display: none !important`) on screens `< 1024px`.
4. **Build Prerequisite Requirement**: Playwright's `webServer` launches `npx vite preview --port 3000 --host 127.0.0.1`, which serves static production assets from `./dist`. If `npm run build` is not executed beforehand, tests fail to load.

---

## 1. Test Suite Architecture & File Inventory

The repository contains test and audit files distributed across `tests/` and `scripts/`:

```
C:\Users\anonn\Desktop\haftora\
├── package.json               # Defines test & build scripts, devDependencies
├── playwright.config.ts       # Playwright E2E configuration (webServer, projects, timeouts)
├── vite.config.ts             # Vite bundler & backend /api proxy settings
├── tests/
│   ├── fallback.test.ts       # Standalone MarketDataClient fallback & caching script
│   └── haftora.spec.ts        # Playwright E2E UI test suite (49 tests x 2 projects = 98 runs)
└── scripts/
    ├── test-live-console.ts   # Live production site console & DOM inspection script
    ├── audit-pages.ts         # Local 9-view preview navigation audit script
    ├── build-db.ts            # Build-time NASDAQ SQLite database compiler
    ├── daily-quote-sync.ts    # Daily ETF quote JSON generator
    └── deploy-dist.ts         # Netlify deployment script
```

---

## 2. In-Depth Analysis of Requested Target Files

### A. `tests/fallback.test.ts`
- **Role**: Tests `MarketDataClient` provider chain fallback, `YahooFinanceAdapter` normalization, and memory caching (`Map` TTL cache).
- **Structure**: Uses custom `async function runTests()` executed at top-level upon module import:
  - **Test 1 (YahooFinanceAdapter Normalization)**: Instantiates `YahooFinanceAdapter` and calls `getQuote('IVV')`. Expects live HTTP response with `sourceProvider === 'yahoo-finance2'`.
  - **Test 2 (MarketDataClient Fallback)**: Calls `MarketDataClient.getQuote('VOO')`. Verifies that if network APIs fail, `MarketDataClient` falls back to internal static quote data (`VOO = $680.1`).
  - **Test 3 (Memory Caching)**: Calls `MarketDataClient.getQuote('AAPL')` twice, confirming second request latency (`0ms`) is less than or equal to initial request (`64ms`).
- **Failure Cause**:
  - `fallback.test.ts` makes an unmocked live network call to `https://query1.finance.yahoo.com/v8/finance/chart/IVV?interval=1m&range=1d`.
  - In restricted network environments, `fetch` fails (`TypeError: fetch failed`).
  - `fallback.test.ts` logs `❌ Test 1 Exception: [yahoo-finance2] Error for IVV: fetch failed`, increments `failed`, and executes `process.exit(1)`.
- **Playwright Collision**: Because the file resides in `./tests/fallback.test.ts`, Playwright imports it during test discovery when `npm test` runs. Top-level `process.exit(1)` terminates Playwright's process immediately.

### B. `scripts/test-live-console.ts`
- **Role**: Diagnostic script that launches headless Chromium via Playwright API to load `https://haftora.netlify.app/learn`.
- **Structure**:
  - Launches `chromium.launch({ headless: true })`.
  - Attaches listeners to `page.on('console')` and `page.on('pageerror')`.
  - Asserts that `#root` inner HTML is populated (`length ~36,114 chars`).
- **Status & Requirement**: Executed cleanly when external network access to Netlify is available. Cannot run in completely offline environments.

### C. `tests/haftora.spec.ts`
- **Role**: Main Playwright E2E UI test suite.
- **Coverage**:
  1. **App Shell**: Header, disclaimer banner, footer, streak badge, logo navigation.
  2. **Navigation**: Verifies navigation to all 8 primary views (`dashboard`, `learn`, `etf-explorer`, `retirement-planner`, `portfolio-builder`, `calculators`, `mistakes`, `profile`).
  3. **Dashboard View**: Stat cards, hero buttons, tool cards navigation.
  4. **Learning Center View**: Category filters, lesson viewer, back buttons, quiz submission logic, sliders.
  5. **ETF Explorer View**: Search filtering, category tabs, detail view, compare toggle, refresh quotes button.
  6. **Retirement Planner View**: 6 input sliders, KPI calculations, Recharts SVG chart, milestones table, save scenario feature.
  7. **Portfolio Builder View**: Goal selectors, risk model tabs, Recharts pie charts.
  8. **Calculators View**: 4 sub-calculators (Compound, DCA, DRIP, Inflation) and input dynamic calculations.
  9. **Investing Mistakes View**: 3 scenario panels (Panic Selling, Market Timing, Fee Drag).
  10. **Profile View**: Hero section, badges grid, scenario history, reset progress modal.
  11. **LocalStorage Persistence**: Verifies state retention across reloads.
- **Observed Test Results**:
  - **Chromium (Desktop)**: 49/49 tests **PASS** when run directly (`npx playwright test tests/haftora.spec.ts --project=chromium`).
  - **Mobile (iPhone 13)**: Tests **FAIL** due to responsive header layout hiding `#nav-` buttons on screens `< 1024px`.

### D. `scripts/audit-pages.ts`
- **Role**: Standalone local preview audit script.
- **Logic**: Spawns `npx vite preview --port 3000 --host 127.0.0.1`, opens Chromium, navigates through 9 view headings, tests universal search for `"AAPL"`, and cleanly shuts down preview server.

---

## 3. Test Script & Dependency Matrix (`package.json`)

### NPM Scripts
- `"test"`: `"playwright test"` — Default command run by CI and developers.
- `"test:ui"`: `"playwright test --ui"` — Playwright UI visual debugger.
- `"test:report"`: `"playwright show-report"` — Opens generated HTML test report.
- `"build"`: `"npm run build:db && npm run build:quotes && vite build"` — Build pipeline generating SQLite DB, daily quotes JSON, and production bundle.
- `"dev:full"`: `"concurrently -n \"API,UI\" -c \"cyan,magenta\" \"npm run server:dev\" \"vite\""` — Runs Express API server (port 4000) and Vite UI dev server (port 3000).

### Key Test Dependencies
| Package | Version | Usage |
| --- | --- | --- |
| `@playwright/test` | `^1.62.0` | E2E browser automation & test framework |
| `tsx` | `^4.23.1` | TypeScript executor for standalone scripts (`tests/fallback.test.ts`, `scripts/*.ts`) |
| `typescript` | `^5.7.3` | TypeScript compiler |
| `vite` | `^6.1.0` | Dev server & preview server |
| `concurrently` | `^10.0.4` | Parallel execution of backend API & frontend UI |

---

## 4. Comprehensive Failure Mode Matrix

| Test Suite / Script | Command | Target Environment | Failure Status | Root Cause |
| --- | --- | --- | --- | --- |
| **Full Suite (`npm test`)** | `npx playwright test` | Any | ❌ **FAIL** (Exit Code 1) | `playwright.config.ts` matches `tests/fallback.test.ts`. `fallback.test.ts` executes top-level code calling unmocked Yahoo Finance URL. On net error, calls `process.exit(1)`, crashing Playwright process. |
| **Fallback Script** | `npx tsx tests/fallback.test.ts` | Standalone Node | ❌ **PARTIAL** (1 Fail, 2 Pass) | Test 1 performs live unmocked HTTP fetch to Yahoo Finance. Fails when network is offline/restricted. Tests 2 & 3 pass via fallback client data & cache. |
| **Playwright Mobile** | `npx playwright test tests/haftora.spec.ts --project=mobile` | Playwright Mobile Viewport | ❌ **FAIL** | Desktop header buttons (`#nav-home`, etc.) are hidden (`display: none !important`) on `< 1024px` viewports in `Header.tsx`. Direct clicks fail. |
| **Playwright WebServer Proxy** | During `playwright test` | Localhost | ⚠️ **LOG WARNING** | `vite.config.ts` proxies `/api` to `localhost:4000`. Express server is not launched by `playwright.config.ts`, causing `[vite] http proxy error [ECONNREFUSED]`. |

---

## 5. Remediation Recommendations for Implementation Stage

1. **Move `tests/fallback.test.ts` out of `tests/` or rename it**:
   - Move to `scripts/test-fallback.ts` or rename to `tests/fallback.unit.ts` and exclude non-Playwright tests in `playwright.config.ts` (`testIgnore: ['**/fallback.test.ts']`).
   - Remove `process.exit(1)` from top-level imports and wrap unit tests in standard Playwright or Vitest/Jest `test()` blocks.
2. **Mock Live HTTP Network Calls in Fallback Tests**:
   - Use `msw`, `fetch-mock`, or Playwright `page.route()` to mock `query1.finance.yahoo.com` so fallback tests run deterministically without internet access.
3. **Fix Mobile Navigation Tests in `haftora.spec.ts`**:
   - Update tests to toggle `#mobile-menu-toggle` hamburger menu or use `#tab-` bottom tab bar selectors when running on mobile viewports.
4. **Configure `playwright.config.ts` webServer to build before preview**:
   - Update `webServer.command` to `npm run build && npx vite preview --port 3000 --host 127.0.0.1` or document `npm run build` as a required pre-test step.
