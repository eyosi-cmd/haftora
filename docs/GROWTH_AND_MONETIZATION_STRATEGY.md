# Strategic Growth, SEO & Monetization Engine

## 1. Overview & Vision
This document defines the strategic commercial roadmap and search engine expansion model for **Haftora** — a mobile-first financial education platform and visual goal simulator.

---

## 2. Monetization Tier Architecture

| Feature | Free Tier ($0/mo) | Pro Tier ($9.99/mo) | Enterprise / Developer ($49/mo) |
|---|---|---|---|
| **Market Data Access** | 15-min delayed intraday quotes | Real-time WebSocket streaming | Unlimited REST API & WebSockets |
| **Asset Search** | 13,000+ U.S. Stocks & ETFs | 13,000+ U.S. + Global Markets + Crypto | Complete Global Coverage |
| **Data Export** | PDF Summary View | Unlimited CSV / JSON Raw Export | Programmatic Data Dumps |
| **Portfolio Alerts** | 1 Active Price Alert | Unlimited SMS & Email Price/Volatility Alerts | Webhook & Zapier Integrations |
| **Expense Drag Calculator** | Basic Comparison | Multi-ETF Drag Simulation & Tax Drag | Advisor White-Label Reports |

---

## 3. Low-Friction Revenue Paths

1. **Brokerage Affiliate Placements**:
   - Contextual "Trade Now with $0 Commission" CTA buttons embedded in ETF detail panels (linking to Robinhood, Schwab, Fidelity, Webull).
   - High conversion potential when users complete an ETF comparison or retirement simulation.

2. **Sponsored Ticker & Spotlight Positions**:
   - Non-intrusive native banner placements for new or promoted ETFs (e.g. "Featured High-Yield Dividend Fund of the Week").

3. **Premium Data Export & White-Label Reports**:
   - Monetize downloadable PDF portfolio audits for financial planners and retail investors.

---

## 4. Programmatic SEO Engine

### 4.1 URL Route Architecture
- **Single Ticker Performance**: `/etf/[ticker]-performance` (e.g. `/etf/voo-performance`)
- **Side-by-Side Comparison**: `/compare/[ticker1]-vs-[ticker2]` (e.g. `/compare/voo-vs-spy`)
- **Category Index**: `/category/[category_slug]` (e.g. `/category/sp-500`)

### 4.2 Dynamic Meta Templates

```typescript
export function generatePageMeta(ticker: string, name: string, price: number, changePercent: number) {
  const isPos = changePercent >= 0;
  return {
    title: `${ticker} Quote & Performance — ${name} ($${price.toFixed(2)}) | Haftora`,
    description: `Track ${name} (${ticker}) live quote at $${price.toFixed(2)} (${isPos ? '+' : ''}${changePercent}%). Compare expense ratios, dividend yield, and historical returns on Haftora.`,
    canonical: `https://haftora.netlify.app/etf/${ticker.toLowerCase()}-performance`
  };
}
```

### 4.3 Structured Schema (`JSON-LD`) Template

```json
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "iShares Core S&P 500 ETF",
  "tickerSymbol": "IVV",
  "category": "S&P 500 ETF",
  "offers": {
    "@type": "Offer",
    "price": "744.22",
    "priceCurrency": "USD"
  }
}
```

---

## 5. Developer Knowledge Hub & Content Roadmap

### 5.1 Content Strategy Pillars
1. **Financial Engineering & Math**:
   - *"How Advisor Fees Compound to Steal 30% of Your Retirement"* (Fee Drag Math)
   - *"The Rule of 72 Demystified: Compound Interest Calculations in TypeScript"*
2. **WebAssembly & Frontend Architecture**:
   - *"Indexing 13,000 Stock Tickers in Browser Memory with SQLite & Wasm"*
   - *"Building a 0ms Latency Market Search Engine on Netlify Static Hosting"*
