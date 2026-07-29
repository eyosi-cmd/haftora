import { IMarketDataProvider, MarketDataProviderId, Quote, HistoricalDataPoint, HistoricalOptions } from '../types';
import { MarketDataError } from '../errors/MarketDataError';

export class PolygonAdapter implements IMarketDataProvider {
  public id: MarketDataProviderId = 'polygon';
  public name = 'Polygon.io API';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.POLYGON_API_KEY || '' : '');
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'POLYGON_API_KEY is not configured');
    }

    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${cleanSymbol}/prev?adjusted=true&apiKey=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      const result = data?.results?.[0];

      if (!result || typeof result.c !== 'number') {
        throw new MarketDataError(this.id, cleanSymbol, 'Polygon returned empty quote payload');
      }

      const price = result.c;
      const open = result.o || price;
      const change = price - open;
      const changePercent = open ? (change / open) * 100 : 0;

      return {
        symbol: cleanSymbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: result.h ? Number(result.h.toFixed(2)) : undefined,
        low: result.l ? Number(result.l.toFixed(2)) : undefined,
        open: Number(open.toFixed(2)),
        previousClose: Number(open.toFixed(2)),
        timestamp: new Date().toISOString(),
        sourceProvider: this.id,
      };
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Polygon fetch error');
    }
  }

  public async getHistorical(symbol: string, options: HistoricalOptions = {}): Promise<HistoricalDataPoint[]> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'POLYGON_API_KEY is not configured');
    }

    try {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const url = `https://api.polygon.io/v2/aggs/ticker/${cleanSymbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      if (!Array.isArray(data.results)) {
        throw new MarketDataError(this.id, cleanSymbol, 'Polygon historical payload error');
      }

      return data.results.map((r: any) => ({
        date: new Date(r.t).toISOString().split('T')[0],
        open: Number((r.o || 0).toFixed(2)),
        high: Number((r.h || 0).toFixed(2)),
        low: Number((r.l || 0).toFixed(2)),
        close: Number((r.c || 0).toFixed(2)),
        volume: r.v || 0,
      }));
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Polygon historical error');
    }
  }
}
