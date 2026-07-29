export type MarketDataProviderId = 'yahoo-finance2' | 'finnhub' | 'twelvedata' | 'polygon' | 'fallback-cache';

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose: number;
  timestamp: string;
  sourceProvider: MarketDataProviderId;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalOptions {
  fromDate?: string;
  toDate?: string;
  interval?: '1d' | '1wk' | '1mo';
}

export interface IMarketDataProvider {
  id: MarketDataProviderId;
  name: string;
  isAvailable(): boolean;
  getQuote(symbol: string): Promise<Quote>;
  getHistorical(symbol: string, options?: HistoricalOptions): Promise<HistoricalDataPoint[]>;
}

export interface MarketDataConfig {
  finnhubApiKey?: string;
  twelvedataApiKey?: string;
  polygonApiKey?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
}
