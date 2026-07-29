import { IMarketDataProvider, MarketDataProviderId, Quote, HistoricalDataPoint, HistoricalOptions } from '../types';
import { MarketDataError } from '../errors/MarketDataError';

export class FinnhubAdapter implements IMarketDataProvider {
  public id: MarketDataProviderId = 'finnhub';
  public name = 'Finnhub API';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.FINNHUB_API_KEY || '' : '');
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'FINNHUB_API_KEY is not configured');
    }

    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      if (!data || typeof data.c !== 'number' || data.c === 0) {
        throw new MarketDataError(this.id, cleanSymbol, 'Finnhub returned empty or zero quote payload');
      }

      const price = data.c;
      const prevClose = data.pc || price;
      const change = data.d ?? (price - prevClose);
      const changePercent = data.dp ?? (prevClose ? (change / prevClose) * 100 : 0);

      return {
        symbol: cleanSymbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: data.h ? Number(data.h.toFixed(2)) : undefined,
        low: data.l ? Number(data.l.toFixed(2)) : undefined,
        open: data.o ? Number(data.o.toFixed(2)) : undefined,
        previousClose: Number(prevClose.toFixed(2)),
        timestamp: new Date().toISOString(),
        sourceProvider: this.id,
      };
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Finnhub fetch error');
    }
  }

  public async getHistorical(symbol: string, options: HistoricalOptions = {}): Promise<HistoricalDataPoint[]> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'FINNHUB_API_KEY is not configured');
    }

    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 60 * 60; // 30 days
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${cleanSymbol}&resolution=D&from=${from}&to=${to}&token=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      if (data.s !== 'ok' || !Array.isArray(data.t)) {
        throw new MarketDataError(this.id, cleanSymbol, 'Finnhub historical data unavailable');
      }

      return data.t.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: Number((data.o[i] || 0).toFixed(2)),
        high: Number((data.h[i] || 0).toFixed(2)),
        low: Number((data.l[i] || 0).toFixed(2)),
        close: Number((data.c[i] || 0).toFixed(2)),
        volume: data.v[i] || 0,
      }));
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Finnhub historical error');
    }
  }
}
