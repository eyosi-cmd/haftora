import { MarketDataClient } from '../src/services/marketData/MarketDataClient';

async function main() {
  console.log('=== Financial Market Data Service Demo ===\n');

  const client = new MarketDataClient({
    finnhubApiKey: process.env.FINNHUB_API_KEY,
    twelvedataApiKey: process.env.TWELVEDATA_API_KEY,
    polygonApiKey: process.env.POLYGON_API_KEY,
  });

  console.log('Active Available Providers:', client.getActiveProviders().join(', '));
  console.log('\nFetching real-time quotes for IVV, VOO, AAPL, and MSFT...\n');

  const tickers = ['IVV', 'VOO', 'AAPL', 'MSFT'];
  for (const ticker of tickers) {
    try {
      const quote = await client.getQuote(ticker);
      console.log(`[${quote.sourceProvider.toUpperCase()}] ${quote.symbol}: $${quote.price} (${quote.change >= 0 ? '+' : ''}${quote.change} / ${quote.changePercent}%)`);
    } catch (err: any) {
      console.error(`Failed to fetch ${ticker}:`, err?.message);
    }
  }
}

main();
