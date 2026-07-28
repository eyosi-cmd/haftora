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

const BASE = '/api';

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null; // Backend offline — fail gracefully
  }
}

export async function searchTickers(
  query: string,
  opts: { type?: 'ETF' | 'Stock' | 'All'; page?: number; limit?: number } = {}
): Promise<TickerSearchResponse | null> {
  const params = new URLSearchParams();
  if (query)      params.set('search',   query);
  if (opts.type && opts.type !== 'All') params.set('type', opts.type);
  if (opts.page)  params.set('page',   String(opts.page));
  if (opts.limit) params.set('limit',  String(opts.limit));
  return apiFetch<TickerSearchResponse>(`/tickers?${params}`);
}

export async function getTickerStats(): Promise<TickerStats | null> {
  return apiFetch<TickerStats>('/tickers/stats');
}

export async function triggerSync(): Promise<{ status: string; message: string } | null> {
  try {
    const res = await fetch(`${BASE}/tickers/sync`, { method: 'POST' });
    return res.json();
  } catch {
    return null;
  }
}
