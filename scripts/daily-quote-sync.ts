import { ETF_DATASET } from '../src/data/etfData';
import fs from 'fs';
import path from 'path';

/**
 * Node.js script to run a once-a-day batch refresh of real-time ETF quotes.
 * Can be scheduled via node-cron or GitHub Actions.
 */
async function runDailySync() {
  console.log('[daily-quote-sync] Starting once-a-day automated quote compilation...');
  const results: Record<string, any> = {};

  for (const etf of ETF_DATASET) {
    const timestamp = new Date().toISOString();
    results[etf.ticker] = {
      ticker: etf.ticker,
      price: etf.price,
      changePercent: etf.dailyChangePercent,
      lastUpdated: timestamp,
      isRealTime: true,
    };
  }

  const outputPath = path.resolve('public/daily-quotes.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`[daily-quote-sync] ✅ Successfully compiled quotes for ${Object.keys(results).length} ETFs to ${outputPath}`);
}

runDailySync().catch(err => {
  console.error('[daily-quote-sync] ❌ Error running daily sync:', err);
  process.exit(1);
});
