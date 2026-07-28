// server/fetcher.ts
// Downloads official NASDAQ Trader pipe-delimited listing files
import https from 'https';
import http from 'http';

const SOURCES = [
  {
    name: 'nasdaqtraded',
    url: 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt',
  },
  {
    name: 'otherlisted',
    url: 'https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt',
  },
];

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': 'HaftoraApp/1.0' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

export interface RawTickerRow {
  symbol: string;
  name: string;
  exchange: string;
  isETF: boolean;
  isTest: boolean;
  source: string;
}

/**
 * Parse nasdaqtraded.txt:
 * Nasdaq Traded|Symbol|Security Name|Listing Exchange|Market Category|ETF|Round Lot Size|Test Issue|...
 */
function parseNasdaqTraded(text: string): RawTickerRow[] {
  const lines = text.split('\n').filter(Boolean);
  // Skip header (first line) and footer (last line — starts with "File Creation Time")
  const dataLines = lines.slice(1).filter(
    (l) => !l.startsWith('File Creation Time') && l.trim().length > 0
  );

  return dataLines
    .map((line) => {
      const cols = line.split('|');
      if (cols.length < 6) return null;
      const nasdaqTraded = cols[0]?.trim();
      const symbol       = cols[1]?.trim();
      const name         = cols[2]?.trim();
      const exchange     = cols[3]?.trim();
      const isETF        = cols[5]?.trim() === 'Y';
      const isTest       = cols[7]?.trim() === 'Y';

      if (!symbol || !name || nasdaqTraded !== 'Y') return null;
      if (isTest) return null; // skip test issues
      return { symbol, name, exchange, isETF, isTest: false, source: 'nasdaq' };
    })
    .filter((r): r is RawTickerRow => r !== null);
}

/**
 * Parse otherlisted.txt:
 * ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol
 */
function parseOtherListed(text: string): RawTickerRow[] {
  const lines = text.split('\n').filter(Boolean);
  const dataLines = lines.slice(1).filter(
    (l) => !l.startsWith('File Creation Time') && l.trim().length > 0
  );

  return dataLines
    .map((line) => {
      const cols = line.split('|');
      if (cols.length < 5) return null;
      const symbol   = cols[0]?.trim();
      const name     = cols[1]?.trim();
      const exchange = cols[2]?.trim();
      const isETF    = cols[4]?.trim() === 'Y';
      const isTest   = cols[6]?.trim() === 'Y';

      if (!symbol || !name) return null;
      if (isTest) return null;
      return { symbol, name, exchange, isETF, isTest: false, source: 'other' };
    })
    .filter((r): r is RawTickerRow => r !== null);
}

export async function fetchAllTickers(): Promise<RawTickerRow[]> {
  console.log('[fetcher] Downloading NASDAQ listing files...');

  const [nasdaqText, otherText] = await Promise.all([
    fetchText(SOURCES[0].url),
    fetchText(SOURCES[1].url),
  ]);

  const nasdaqRows = parseNasdaqTraded(nasdaqText);
  const otherRows  = parseOtherListed(otherText);

  // Merge — nasdaq rows take priority; deduplicate by symbol
  const map = new Map<string, RawTickerRow>();
  for (const row of otherRows)  map.set(row.symbol, row);
  for (const row of nasdaqRows) map.set(row.symbol, row); // overwrites dupes

  const total = [...map.values()];
  console.log(`[fetcher] Parsed ${total.length} unique tickers (${nasdaqRows.length} NASDAQ + ${otherRows.length} other, deduped)`);
  return total;
}
