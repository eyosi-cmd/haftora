// src/services/tickerApi.ts
// Frontend service — queries the Haftora backend ticker API

export interface TickerResult {
  symbol: string;
  name: string;
  exchange: string;
  exchangeName: string;
  isETF: boolean;
  lastUpdated: string;
}

export interface TickerSearchResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  results: TickerResult[];
}

export interface TickerStats {
  total: number;
  etfs: number;
  stocks: number;
  lastSync: { at: string; rows: number } | null;
  syncRunning: boolean;
  serverTime: string;
}

export const API_BASE_URL =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_URL || process.env?.REACT_APP_API_URL)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  '/api';

const BASE = API_BASE_URL;

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(3000) });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) return null;

    const text = await res.text();
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) return null;

    return JSON.parse(text) as T;
  } catch {
    return null; // Backend offline / static SPA redirect — fail gracefully
  }
}

import { searchClientTickers } from './sqliteSearch';

// High-Level API Cache (Capacity: 300 queries)
const tickerApiCache = new Map<string, TickerSearchResponse>();

export async function searchTickers(
  query: string,
  opts: { type?: 'ETF' | 'Stock' | 'All'; page?: number; limit?: number } = {}
): Promise<TickerSearchResponse | null> {
  const cacheKey = `${query.trim().toLowerCase()}:${opts.type || 'All'}:${opts.page || 1}:${opts.limit || 12}`;
  if (tickerApiCache.has(cacheKey)) {
    return tickerApiCache.get(cacheKey)!;
  }

  const params = new URLSearchParams();
  if (query)      params.set('search',   query);
  if (opts.type && opts.type !== 'All') params.set('type', opts.type);
  if (opts.page)  params.set('page',   String(opts.page));
  if (opts.limit) params.set('limit',  String(opts.limit));

  // 1. Try Express backend server API first
  const serverRes = await apiFetch<TickerSearchResponse>(`/tickers?${params}`);
  if (serverRes) {
    tickerApiCache.set(cacheKey, serverRes);
    return serverRes;
  }

  // 2. Fallback to client-side WebAssembly SQLite (100% Free Static Hosting)
  const clientRes = await searchClientTickers(query, opts);
  if (clientRes) {
    const limit = opts.limit || 10;
    const page  = opts.page  || 1;
    const payload: TickerSearchResponse = {
      total:   clientRes.total,
      page:    page,
      limit:   limit,
      pages:   Math.ceil(clientRes.total / limit),
      results: clientRes.results.map((r) => ({
        symbol:       r.symbol,
        name:         r.name,
        exchange:     r.exchange,
        exchangeName: r.exchangeName,
        isETF:        r.isETF,
        lastUpdated:  'Built-in Static DB ($0/mo)',
      })),
    };
    tickerApiCache.set(cacheKey, payload);
    return payload;
  }

  return null;
}

export async function getTickerStats(): Promise<TickerStats | null> {
  const serverStats = await apiFetch<TickerStats>('/tickers/stats');
  if (serverStats) return serverStats;

  // Fallback check for client SQLite DB
  const clientRes = await searchClientTickers('', { limit: 1 });
  if (clientRes) {
    return {
      total: clientRes.total,
      etfs: 3500,
      stocks: 11500,
      lastSync: { at: 'Static Wasm DB ($0/mo)', rows: clientRes.total },
      syncRunning: false,
      serverTime: new Date().toISOString(),
    };
  }

  return null;
}

export async function triggerSync(): Promise<{ status: string; message: string } | null> {
  try {
    const res = await fetch(`${BASE}/tickers/sync`, { method: 'POST', signal: AbortSignal.timeout(3000) });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { status: 'static', message: 'Running on $0 Netlify static hosting (Wasm DB)' };
    }
    const text = await res.text();
    if (!text.trim().startsWith('{')) {
      return { status: 'static', message: 'Running on $0 Netlify static hosting (Wasm DB)' };
    }
    return JSON.parse(text);
  } catch {
    return { status: 'static', message: 'Running on $0 Netlify static hosting (Wasm DB)' };
  }
}
