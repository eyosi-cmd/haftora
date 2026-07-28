// scripts/build-db.ts
// Build-time script: downloads NASDAQ official directories and compiles public/tickers.db
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DB_OUT_PATH = path.join(PUBLIC_DIR, 'tickers.db');

const SOURCES = [
  'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt',
  'https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt',
];

const EXCHANGE_NAMES: Record<string, string> = {
  Q: 'NASDAQ',
  N: 'NYSE',
  P: 'NYSE Arca',
  Z: 'CBOE BZX',
  A: 'NYSE American',
  C: 'NASDAQ Capital Market',
  G: 'NASDAQ Global Select',
};

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

    client
      .get(url, { headers: { 'User-Agent': 'HaftoraBuild/1.0' }, agent }, (res) => {
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

interface TickerItem {
  symbol: string;
  name: string;
  exchange: string;
  exchangeName: string;
  isETF: number;
}

function parseNasdaqTraded(text: string): TickerItem[] {
  const lines = text.split('\n').filter(Boolean);
  const dataLines = lines.slice(1).filter((l) => !l.startsWith('File Creation Time') && l.trim().length > 0);

  return dataLines
    .map((line) => {
      const cols = line.split('|');
      if (cols.length < 6) return null;
      const nasdaqTraded = cols[0]?.trim();
      const symbol       = cols[1]?.trim();
      const name         = cols[2]?.trim();
      const exchange     = cols[3]?.trim();
      const isETF        = cols[5]?.trim() === 'Y' ? 1 : 0;
      const isTest       = cols[7]?.trim() === 'Y';

      if (!symbol || !name || nasdaqTraded !== 'Y' || isTest) return null;
      return {
        symbol,
        name,
        exchange,
        exchangeName: EXCHANGE_NAMES[exchange] || exchange || 'Other',
        isETF,
      };
    })
    .filter((r): r is TickerItem => r !== null);
}

function parseOtherListed(text: string): TickerItem[] {
  const lines = text.split('\n').filter(Boolean);
  const dataLines = lines.slice(1).filter((l) => !l.startsWith('File Creation Time') && l.trim().length > 0);

  return dataLines
    .map((line) => {
      const cols = line.split('|');
      if (cols.length < 5) return null;
      const symbol   = cols[0]?.trim();
      const name     = cols[1]?.trim();
      const exchange = cols[2]?.trim();
      const isETF    = cols[4]?.trim() === 'Y' ? 1 : 0;
      const isTest   = cols[6]?.trim() === 'Y';

      if (!symbol || !name || isTest) return null;
      return {
        symbol,
        name,
        exchange,
        exchangeName: EXCHANGE_NAMES[exchange] || exchange || 'NYSE',
        isETF,
      };
    })
    .filter((r): r is TickerItem => r !== null);
}

async function buildDatabase() {
  console.log('[build-db] Starting build-time NASDAQ ticker compilation...');

  let nasdaqText = '';
  let otherText  = '';

  try {
    const results = await Promise.all([fetchText(SOURCES[0]), fetchText(SOURCES[1])]);
    nasdaqText = results[0];
    otherText  = results[1];
  } catch (err) {
    console.warn('[build-db] Could not fetch live NASDAQ files during build (offline/network restriction).');
    console.warn('[build-db] Creating empty/fallback database schema.');
  }

  const nasdaqItems = nasdaqText ? parseNasdaqTraded(nasdaqText) : [];
  const otherItems  = otherText  ? parseOtherListed(otherText)   : [];

  // Deduplicate
  const map = new Map<string, TickerItem>();
  for (const item of otherItems)  map.set(item.symbol, item);
  for (const item of nasdaqItems) map.set(item.symbol, item);

  const allItems = [...map.values()];
  console.log(`[build-db] Compiled ${allItems.length} unique tickers`);

  // Create SQLite DB with sql.js
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE tickers (
      symbol        TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      exchange      TEXT,
      exchange_name TEXT,
      is_etf        INTEGER DEFAULT 0
    );
    CREATE INDEX idx_symbol ON tickers(symbol);
    CREATE INDEX idx_is_etf ON tickers(is_etf);
  `);

  if (allItems.length > 0) {
    const BATCH = 400;
    for (let i = 0; i < allItems.length; i += BATCH) {
      const chunk = allItems.slice(i, i + BATCH);
      const values = chunk
        .map((r) => {
          const sym  = r.symbol.replace(/'/g, "''");
          const name = r.name.replace(/'/g, "''");
          const exch = r.exchange.replace(/'/g, "''");
          const exchName = r.exchangeName.replace(/'/g, "''");
          return `('${sym}','${name}','${exch}','${exchName}',${r.isETF})`;
        })
        .join(',');

      db.run(`INSERT OR REPLACE INTO tickers (symbol, name, exchange, exchange_name, is_etf) VALUES ${values}`);
    }
  }

  // Export buffer
  const binary = db.export();
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(DB_OUT_PATH, Buffer.from(binary));

  const sizeKb = (binary.byteLength / 1024).toFixed(1);
  console.log(`[build-db] ✅ Successfully wrote ${DB_OUT_PATH} (${sizeKb} KB)`);
}

buildDatabase().catch((err) => {
  console.error('[build-db] Fatal error:', err);
  process.exit(1);
});
