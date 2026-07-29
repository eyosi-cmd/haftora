# Comprehensive Codebase & Test Exploration Report

## Executive Summary
This report presents a full read-only investigation of the **Haftora** project structure, configuration files, test suite setup, build processes, and baseline test behavior.

---

## 1. Project Setup & Architecture

### Stack & Metadata
- **Project Name**: `haftora` (v1.0.0, private, ESM `"type": "module"`)
- **UI Framework**: React 19 (`react`, `react-dom`)
- **Build & Bundler**: Vite 6.1.0 (`@vitejs/plugin-react`)
- **TypeScript**: TS 5.7.3 (`tsconfig.json` configured for bundler mode, ES2020, strict mode enabled)
- **Backend API**: Express 5.2.1 (`server/index.ts`, `server/routes/`, `server/db.ts`)
- **Data Stores & Engine**: `sql.js` (SQLite compiled to WebAssembly for client-side search), custom ticker DB generator (`scripts/build-db.ts`), daily quote sync (`scripts/daily-quote-sync.ts`)
- **Testing Frameworks**: 
  - Playwright (`@playwright/test` v1.62.0) for E2E tests (`tests/haftora.spec.ts`)
  - Node/TS custom test script executed via `tsx` (`tests/fallback.test.ts`)

---

## 2. Directory Structure Breakdown

```
haftora/
├── package.json              # Dependencies, scripts, ESM configuration
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite dev server & proxy settings (/api -> localhost:4000)
├── playwright.config.ts      # Playwright E2E configuration & webServer definition
├── netlify.toml              # Netlify build & redirect rules
├── index.html                # Entry HTML point
├── README.md                 # Project documentation
├── scripts/                  # Data compilation & deployment utility scripts
│   ├── build-db.ts           # Compiles NASDAQ ticker dataset to public/tickers.db
│   ├── daily-quote-sync.ts   # Compiles 22 ETF quotes to public/daily-quotes.json
│   ├── deploy-dist.ts        # Netlify deployment script
│   ├── audit-pages.ts        # Page auditing utility
│   └── test-live-console.ts  # Console logger test helper
├── server/                   # Backend Express server (Port 4000)
│   ├── index.ts              # Main Express application entry
│   ├── db.ts                 # Database integration
│   ├── fetcher.ts            # External market data fetcher
│   ├── sync.ts / upsert.ts   # Database synchronization logic
│   └── routes/               # API route handlers
├── src/                      # Frontend Application Source
│   ├── App.tsx               # Main React entry & tab state orchestrator
│   ├── main.tsx              # DOM root mounting
│   ├── components/           # UI components
│   │   ├── Header.tsx        # Top navigation bar, logo, streak badge, mobile toggle
│   │   ├── Footer.tsx        # App footer & bottom tab navigation
│   │   ├── ChatWidget.tsx    # AI assistant / chat widget component
│   │   ├── AuthModal.tsx     # Netlify identity authentication modal
│   │   ├── DisclaimerBanner.tsx # Financial disclaimer banner
│   │   └── views/            # 9 Main Application Views
│   │       ├── DashboardView.tsx
│   │       ├── LearningCenterView.tsx
│   │       ├── ETFExplorerView.tsx
│   │       ├── MarketSearchView.tsx
│   │       ├── RetirementPlannerView.tsx
│   │       ├── PortfolioBuilderView.tsx
│   │       ├── CalculatorsView.tsx
│   │       ├── InvestingMistakesView.tsx
│   │       └── ProfileView.tsx
│   ├── services/             # Services layer
│   │   ├── marketData/       # Resilient Market Data Client & Adapters
│   │   │   ├── MarketDataClient.ts
│   │   │   ├── adapters/ (YahooFinanceAdapter, PolygonAdapter, FinnhubAdapter, TwelveDataAdapter)
│   │   │   ├── errors/
│   │   │   └── types.ts
│   │   ├── sqliteSearch.ts   # SQLite WASM search provider
│   │   ├── aiScreener.ts     # AI screening service
│   │   ├── tickerApi.ts      # Ticker search API wrapper
│   │   ├── marketApi.ts      # Market data API wrapper
│   │   └── rag/              # Retrieval-Augmented Generation module
│   ├── styles/               # CSS stylesheet files
│   ├── types/                # TypeScript interface and type definitions
│   └── utils/                # Utility & helper functions
├── public/                   # Public static assets & generated DBs (tickers.db, daily-quotes.json)
└── tests/                    # Test suite directory
    ├── fallback.test.ts      # MarketDataClient resilience & caching script (Ignored by Playwright)
    └── haftora.spec.ts       # Playwright UI E2E test suite
```

---

## 3. Configuration & Script Analysis

### `package.json` Scripts
- `"dev"`: `vite` (Runs frontend on port 3000)
- `"dev:full"`: `concurrently -n "API,UI" -c "cyan,magenta" "npm run server:dev" "vite"` (Runs Express server on port 4000 + Vite on port 3000)
- `"server:dev"`: `tsx watch server/index.ts`
- `"server:start"`: `tsx server/index.ts`
- `"build:db"`: `tsx scripts/build-db.ts`
- `"build:quotes"`: `tsx scripts/daily-quote-sync.ts`
- `"build"`: `npm run build:db && npm run build:quotes && vite build`
- `"preview"`: `vite preview`
- `"test"`: `playwright test`
- `"test:ui"`: `playwright test --ui`
- `"test:report"`: `playwright show-report`

### Bundler & TS Config
- `vite.config.ts`: Configures React plugin, server port 3000, and proxies `/api` requests to `http://localhost:4000`.
- `tsconfig.json`: Targets `ES2020`, uses `moduleResolution: "bundler"`, `noEmit: true`, `strict: true`.

### Test Configuration (`playwright.config.ts`)
- Configured to search `testDir: './tests'`.
- Explicitly ignores `tests/fallback.test.ts` via `testIgnore: ['**/fallback.test.ts']`.
- WebServer option: `command: 'npx vite preview --port 3000 --host 127.0.0.1'`, port 3000.
- Configured projects: `chromium` (Desktop Chrome) and `mobile` (iPhone 13).

---

## 4. Test Suite Inspection & `tests/fallback.test.ts`

### `tests/fallback.test.ts` Analysis
- **Nature**: Standalone Node/TypeScript test runner script (using custom `runTests()` function with `console.log` reporting and `process.exit(1)` on failure).
- **Execution Command**: `npx tsx tests/fallback.test.ts`
- **Coverage**:
  1. **YahooFinanceAdapter Normalization**: Verifies `YahooFinanceAdapter.getQuote('IVV')` returns valid symbol, price, and source provider (`yahoo-finance2`).
  2. **MarketDataClient Fallback Chain**: Verifies `MarketDataClient.getQuote('VOO')` executes chain of responsibility without unhandled errors.
  3. **Memory Caching**: Verifies cached lookup time is lower/equal to uncached lookup time (`AAPL`).

### `tests/haftora.spec.ts` Analysis
- **Nature**: Playwright E2E test suite covering App shell rendering, navigation across 8 main views, dashboard stat cards/buttons, learning center, calculators, portfolio builder, and profile views.

---

## 5. Baseline Execution Findings

### 1. Build Execution (`npm run build`)
- **Result**: **SUCCESS** (Exit code 0)
- **Log Summary**:
  - `build:db` executed: Compiled 13,034 unique NASDAQ tickers into `public/tickers.db` (1316 KB).
  - `build:quotes` executed: Compiled quotes for 22 ETFs into `public/daily-quotes.json`.
  - `vite build` executed: Transformed 2,248 modules in 6.33 seconds, emitting `dist/index.html`, `dist/assets/sql-wasm-*.wasm`, `dist/assets/index-*.css`, `dist/assets/index-*.js`.

### 2. Standalone Fallback Test Execution (`npx tsx tests/fallback.test.ts`)
- **Result**: **SUCCESS** (Exit code 0)
- **Output**:
  ```
  🧪 Starting MarketDataClient Fallback & Resiliency Tests...
  ✅ Test 1 Passed: YahooFinanceAdapter quote normalization valid (IVV = $744.22)
  ✅ Test 2 Passed: MarketDataClient unified fallback chain executed cleanly (VOO = $680.1)
  ✅ Test 3 Passed: Memory caching operational (192ms initial -> 0ms cached)

  📊 Test Results: 3 Passed, 0 Failed
  ```

### 3. Playwright E2E Test Suite Execution (`npm test` / `npx playwright test`)
- **Result**: **FAILED** (Exit code 1; 43 Passed, 55 Failed out of 98 tests in 3.4m)
- **Detailed Root Cause Analysis**:
  1. **Missing Webkit Browser Executable**:
     `Error: browserType.launch: Executable doesn't exist at C:\Users\anonn\AppData\Local\ms-playwright\webkit-2336\Playwright.exe`
     Playwright requires running `npx playwright install` to install missing Webkit browser binaries required for mobile webkit emulation.
  2. **Unstarted Backend Express Server**:
     `[WebServer] http proxy error: /api/tickers/stats ECONNREFUSED`
     `playwright.config.ts` webServer only executes `npx vite preview --port 3000 --host 127.0.0.1`. It does NOT start `server/index.ts` (Express API on port 4000). Consequently, any test component fetching `/api/*` (such as ETF Explorer live quote search and stats) fails due to connection refusal.
  3. **Mobile Viewport Navigation Selector Mismatch**:
     `clickNav` helper looks for desktop buttons `#nav-${tabId}`. In mobile viewports, `.desktop-nav` is hidden by responsive CSS (`display: none`), causing 49 mobile viewport tests to fail when trying to click hidden elements without opening `#mobile-menu-toggle`.
  4. **Chromium Test Results**:
     43 desktop Chromium tests passed (App Shell, view navigation, static calculator layout, learning modules). 6 Chromium tests failed due to backend API dependency (ETF Explorer search/details/live quotes, scenario persistence).
