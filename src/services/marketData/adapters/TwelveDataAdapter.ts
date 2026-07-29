import { IMarketDataProvider, MarketDataProviderId, Quote, HistoricalDataPoint, HistoricalOptions } from '../types';
import { MarketDataError } from '../errors/MarketDataError';

export class TwelveDataAdapter implements IMarketDataProvider {
  public id: MarketDataProviderId = 'twelvedata';
  public name = 'Twelve Data API';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.TWELVEDATA_API_KEY || '' : '');
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'TWELVEDATA_API_KEY is not configured');
    }

    try {
      const url = `https://api.twelvedata.com/quote?symbol=${cleanSymbol}&apikey=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      if (data.status === 'error' || !data.close) {
        throw new MarketDataError(this.id, cleanSymbol, data.message || 'TwelveData returned invalid quote payload');
      }

      const price = parseFloat(data.close);
      const prevClose = parseFloat(data.previous_close || data.close);
      const change = parseFloat(data.change || String(price - prevClose));
      const changePercent = parseFloat(data.percent_change || String(prevClose ? (change / prevClose) * 100 : 0));

      return {
        symbol: cleanSymbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: data.high ? Number(parseFloat(data.high).toFixed(2)) : undefined,
        low: data.low ? Number(parseFloat(data.low).toFixed(2)) : undefined,
        open: data.open ? Number(parseFloat(data.open).toFixed(2)) : undefined,
        previousClose: Number(prevClose.toFixed(2)),
        timestamp: new Date().toISOString(),
        sourceProvider: this.id,
      };
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'TwelveData fetch error');
    }
  }

  public async getHistorical(symbol: string, options: HistoricalOptions = {}): Promise<HistoricalDataPoint[]> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!this.isAvailable()) {
      throw new MarketDataError(this.id, cleanSymbol, 'TWELVEDATA_API_KEY is not configured');
    }

    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=1day&outputsize=30&apikey=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      if (data.status === 'error' || !Array.isArray(data.values)) {
        throw new MarketDataError(this.id, cleanSymbol, data.message || 'TwelveData historical payload error');
      }

      return data.values.map((v: any) => ({
        date: v.datetime,
        open: Number(parseFloat(v.open).toFixed(2)),
        high: Number(parseFloat(v.high).toFixed(2)),
        low: Number(parseFloat(v.low).toFixed(2)),
        close: Number(parseFloat(v.close).toFixed(2)),
        volume: parseInt(v.volume, 10) || 0,
      }));
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'TwelveData historical error');
    }
  }
}
