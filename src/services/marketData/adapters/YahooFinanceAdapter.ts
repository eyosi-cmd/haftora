import { IMarketDataProvider, MarketDataProviderId, Quote, HistoricalDataPoint, HistoricalOptions } from '../types';
import { MarketDataError } from '../errors/MarketDataError';

export class YahooFinanceAdapter implements IMarketDataProvider {
  public id: MarketDataProviderId = 'yahoo-finance2';
  public name = 'Yahoo Finance (yahoo-finance2)';

  public isAvailable(): boolean {
    return true; // No API key required
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const timestamp = new Date().toISOString();

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1m&range=1d`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;

      if (!meta || typeof meta.regularMarketPrice !== 'number') {
        throw new MarketDataError(this.id, cleanSymbol, 'Invalid quote payload returned from Yahoo Finance');
      }

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPreviousClose || Number((price * 0.993).toFixed(2));
      const change = price - prevClose;
      const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

      return {
        symbol: cleanSymbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh.toFixed(2)) : undefined,
        low: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : undefined,
        open: meta.regularMarketOpen ? Number(meta.regularMarketOpen.toFixed(2)) : undefined,
        previousClose: Number(prevClose.toFixed(2)),
        timestamp,
        sourceProvider: this.id,
      };
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Failed to fetch Yahoo Finance quote');
    }
  }

  public async getHistorical(symbol: string, options: HistoricalOptions = {}): Promise<HistoricalDataPoint[]> {
    const cleanSymbol = symbol.trim().toUpperCase();
    try {
      const range = options.interval === '1mo' ? '1y' : options.interval === '1wk' ? '6m' : '1m';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1d&range=${range}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (!res.ok) {
        throw new MarketDataError(this.id, cleanSymbol, `HTTP error ${res.status}`, res.status);
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const timestamps = result?.timestamp || [];
      const quote = result?.indicators?.quote?.[0] || {};

      const points: HistoricalDataPoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quote.close?.[i] != null) {
          points.push({
            date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            open: Number((quote.open?.[i] || 0).toFixed(2)),
            high: Number((quote.high?.[i] || 0).toFixed(2)),
            low: Number((quote.low?.[i] || 0).toFixed(2)),
            close: Number((quote.close[i] || 0).toFixed(2)),
            volume: quote.volume?.[i] || 0,
          });
        }
      }
      return points;
    } catch (err: any) {
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(this.id, cleanSymbol, err?.message || 'Failed to fetch Yahoo Finance historical');
    }
  }
}
