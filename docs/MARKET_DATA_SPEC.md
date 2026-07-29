# Financial Market Data Service Specification

## 1. Overview
The **Financial Market Data Service** is a provider-agnostic, resilient TypeScript module designed to fetch real-time stock/ETF market quotes and daily historical OHLCV data. It implements an automated **Chain-of-Responsibility / Fallback Strategy** across multiple underlying financial APIs:

1. **Primary Provider**: `yahoo-finance2` (Zero-config, no API key required)
2. **Fallback Provider 1**: `finnhub` (Official SDK, requires `FINNHUB_API_KEY`)
3. **Fallback Provider 2**: `twelvedata` (Official SDK, requires `TWELVEDATA_API_KEY`)
4. **Fallback Provider 3**: `@polygon.io/rest-client` (Official SDK, requires `POLYGON_API_KEY`)

---

## 2. Normalized Data Models (Types & Interfaces)

```typescript
/**
 * Supported market data provider identifiers.
 */
export type MarketDataProviderId = 'yahoo-finance2' | 'finnhub' | 'twelvedata' | 'polygon' | 'fallback-cache';

/**
 * Standardized real-time / current market quote object.
 */
export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose: number;
  timestamp: string; // ISO 8601 string
  sourceProvider: MarketDataProviderId;
}

/**
 * Standardized historical OHLCV bar data point.
 */
export interface HistoricalDataPoint {
  date: string; // YYYY-MM-DD or ISO 8601 string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Options for querying historical market data.
 */
export interface HistoricalOptions {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  interval?: '1d' | '1wk' | '1mo'; // Bar interval
}
```

---

## 3. Unified Client Interface

```typescript
/**
 * Unified Market Data Service Interface.
 */
export interface IMarketDataService {
  /**
   * Fetches the latest market quote for a given ticker symbol.
   */
  getQuote(symbol: string): Promise<Quote>;

  /**
   * Fetches historical OHLCV price series for a given ticker symbol.
   */
  getHistorical(symbol: string, options?: HistoricalOptions): Promise<HistoricalDataPoint[]>;
}
```

---

## 4. Fallback Architecture & Resiliency Specification

### 4.1 Design Pattern
The architecture utilizes the **Chain of Responsibility & Strategy Pattern**:
- An abstract `MarketDataProviderAdapter` base interface represents each individual provider.
- `MarketDataClient` maintains an ordered priority list of active provider adapters.
- If a provider fails (e.g. rate limit, missing key, network error), `MarketDataClient` automatically catches the exception, logs a telemetry warning, and attempts execution on the next provider in line.

```
       [ Client Request: getQuote("AAPL") ]
                      │
                      ▼
        ┌───────────────────────────┐
        │    MarketDataClient       │
        └─────────────┬─────────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
┌──────────────────┐    (Failure / 429)    ┌──────────────────┐
│  yahoo-finance2  ├─────────────────────► │     finnhub      │
└──────────┬───────┘                       └──────────┬───────┘
           │ (Success)                                │ (Failure / Missing Key)
           ▼                                          ▼
     [ Return Quote ]                      ┌──────────────────┐
                                           │    twelvedata    │
                                           └──────────┬───────┘
                                                      │ (Failure / 429)
                                                      ▼
                                           ┌──────────────────┐
                                           │    polygon.io    │
                                           └──────────────────┘
```

### 4.2 Failure Conditions Triggering Fallback
A fallback to the next provider is automatically triggered upon any of the following:
1. **HTTP 429 Rate Limit / Quota Exceeded**.
2. **HTTP 401/403 Authentication Error** (e.g. invalid API key).
3. **Network Timeout / Connection Refused / DNS Failure** (Configurable request timeout: default 3000ms).
4. **Provider Exception / API Error Response**.
5. **Empty / Malformed Data Payload** (e.g. missing price field or NaN).

### 4.3 Telemetry & Structured Logging
Every provider attempt, success, or fallback event is logged using a structured telemetry logger:
- **`INFO`**: Provider execution success with timing metadata (e.g. `[MarketData] Quote for AAPL fetched via yahoo-finance2 in 142ms`).
- **`WARN`**: Provider failure triggering fallback (e.g. `[MarketData] finnhub failed for AAPL (HTTP 429 Rate Limit Exceeded). Falling back to twelvedata...`).
- **`ERROR`**: Exhaustion of all available providers (returns deterministic fallback quote with `sourceProvider: 'fallback-cache'`).

---

## 5. Environment Variables & Configuration Schema

If an API key is missing for an optional provider, that provider is automatically excluded from the active fallback chain during client initialization.

```typescript
export interface MarketDataConfig {
  finnhubApiKey?: string;      // process.env.FINNHUB_API_KEY
  twelvedataApiKey?: string;   // process.env.TWELVEDATA_API_KEY
  polygonApiKey?: string;      // process.env.POLYGON_API_KEY
  timeoutMs?: number;          // Default: 3000ms per provider
  cacheTtlMs?: number;         // Default: 300000ms (5 minutes)
}
```

---

## 6. Test Plan & Verification Criteria

1. **Unit Tests (`tests/normalization.test.ts`)**:
   - Verify that raw responses from Yahoo, Finnhub, TwelveData, and Polygon normalize to the exact `Quote` and `HistoricalDataPoint` schema.

2. **Fallback Integration Tests (`tests/fallback.test.ts`)**:
   - **Scenario 1**: Primary provider (`yahoo-finance2`) throws rate-limit error -> verify seamless failover to `finnhub`.
   - **Scenario 2**: Missing API keys -> verify providers without keys are skipped without throwing runtime errors.
   - **Scenario 3**: All providers fail -> verify graceful fallback return value.
