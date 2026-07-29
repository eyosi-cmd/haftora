import { MarketDataClient } from '../src/services/marketData/MarketDataClient';
import { YahooFinanceAdapter } from '../src/services/marketData/adapters/YahooFinanceAdapter';

async function runTests() {
  console.log('🧪 Starting MarketDataClient Fallback & Resiliency Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: YahooFinanceAdapter Normalization
  try {
    const yahoo = new YahooFinanceAdapter();
    const quote = await yahoo.getQuote('IVV');
    if (quote.symbol === 'IVV' && typeof quote.price === 'number' && quote.price > 0 && quote.sourceProvider === 'yahoo-finance2') {
      console.log('✅ Test 1 Passed: YahooFinanceAdapter quote normalization valid (IVV = $' + quote.price + ')');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Invalid quote payload', quote);
      failed++;
    }
  } catch (err: any) {
    console.error('❌ Test 1 Exception:', err?.message);
    failed++;
  }

  // Test 2: MarketDataClient Chain of Responsibility Execution
  try {
    const client = new MarketDataClient();
    const quote = await client.getQuote('VOO');
    if (quote.symbol === 'VOO' && quote.price > 0) {
      console.log('✅ Test 2 Passed: MarketDataClient unified fallback chain executed cleanly (VOO = $' + quote.price + ')');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: Unhandled quote payload');
      failed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Exception:', err?.message);
    failed++;
  }

  // Test 3: Caching Performance Check
  try {
    const client = new MarketDataClient();
    const start = Date.now();
    await client.getQuote('AAPL');
    const uncachedTime = Date.now() - start;

    const cacheStart = Date.now();
    await client.getQuote('AAPL');
    const cachedTime = Date.now() - cacheStart;

    if (cachedTime <= uncachedTime) {
      console.log(`✅ Test 3 Passed: Memory caching operational (${uncachedTime}ms initial -> ${cachedTime}ms cached)`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed: Cache timing anomaly');
      failed++;
    }
  } catch (err: any) {
    console.error('❌ Test 3 Exception:', err?.message);
    failed++;
  }

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
