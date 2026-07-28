# Haftora — Investing Made Simple

A beginner-friendly investing education platform built with React, Vite, and a Node.js + SQLite backend powered by live NASDAQ market data.

## Features

- 📚 **Learning Center** — structured visual lessons on ETFs, compounding, Roth IRAs
- 🔍 **ETF Explorer** — live prices, sector breakdowns, fee analysis, and universal market search across 10,000+ real tickers
- 🎯 **Retirement Planner** — simulate compound growth vs inflation-adjusted purchasing power
- 📊 **Portfolio Builder** — compare Conservative / Moderate / Aggressive allocations
- 🧮 **Calculator Suite** — compound interest, DCA vs lump sum, DRIP dividend, inflation impact
- ⚠️ **Mistakes Guide** — learn about panic selling, market timing, and fee erosion
- 📈 **Universal Market Search** — backed by live NASDAQ Trader directory (~10,000+ tickers), updated daily at 2 AM EST

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Vanilla CSS (Cash App light blue design system) |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | sql.js (SQLite, pure JS) |
| Scheduler | node-cron (2 AM EST daily sync) |
| Data Source | [NASDAQ Trader Official Directory](https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt) |
| Tests | Playwright |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
git clone https://github.com/eyosi-cmd/haftora.git
cd haftora
npm install
```

### Run (Frontend only)
```bash
npm run dev
```
Vite dev server starts at `http://localhost:3000`

### Run (Full stack — Frontend + Backend API)
```bash
npm run dev:full
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`

The backend will automatically download the full NASDAQ ticker directory on first run.

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/tickers?search=AAPL&type=ETF` | Search tickers with pagination |
| `GET /api/tickers/stats` | DB stats (total tickers, last sync) |
| `GET /api/tickers/:symbol` | Single ticker lookup |
| `POST /api/tickers/sync` | Manually trigger data sync |
| `GET /health` | Server health check |

## Data Sources

- **NASDAQ Traded**: `https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt`
- **Other Listed**: `https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt`

Both files are official NASDAQ daily-updated pipe-delimited directories covering NASDAQ, NYSE, NYSE Arca, CBOE, and more.

## Disclaimer

Haftora is strictly an **educational platform**. It does not provide personalized financial advice. All projections and market data are for instructional purposes only.
