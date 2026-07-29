import { MarketDataProviderId } from '../types';

export class MarketDataError extends Error {
  public providerId: MarketDataProviderId;
  public symbol: string;
  public statusCode?: number;

  constructor(providerId: MarketDataProviderId, symbol: string, message: string, statusCode?: number) {
    super(`[${providerId}] Error for ${symbol}: ${message}`);
    this.name = 'MarketDataError';
    this.providerId = providerId;
    this.symbol = symbol;
    this.statusCode = statusCode;
  }
}
