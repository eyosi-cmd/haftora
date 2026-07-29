import React, { useState, useEffect, useRef } from 'react';
import { searchTickers, getTickerStats, TickerResult, TickerStats } from '../../services/tickerApi';
import { fetchLiveQuote, LiveMarketQuote } from '../../services/marketApi';
import { Search, Database, RefreshCw, X, ArrowUpRight, ArrowDownRight, Layers, DollarSign, Building2, TrendingUp, Check, ExternalLink, RotateCcw, Clock } from 'lucide-react';
import { formatPercent } from '../../utils/financialMath';

export const MarketSearchView: React.FC = () => {
  const [query, setQuery]                 = useState('');
  const [instrumentType, setInstrumentType] = useState<'All' | 'ETF' | 'Stock'>('All');
  const [results, setResults]             = useState<TickerResult[]>([]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [pageSize]                        = useState(12);
  const [loading, setLoading]             = useState(false);
  const [stats, setStats]                 = useState<TickerStats | null>(null);
  const [quotes, setQuotes]               = useState<Record<string, LiveMarketQuote>>({});
  const [fetchingQuotes, setFetchingQuotes] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TickerResult | null>(null);
  const [selectedQuote, setSelectedQuote]   = useState<LiveMarketQuote | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    return `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSyncAll = async () => {
    setFetchingQuotes(true);
    const updatedQuotes: Record<string, LiveMarketQuote> = { ...quotes };
    for (const item of results) {
      updatedQuotes[item.symbol] = await fetchLiveQuote(item.symbol);
    }
    setQuotes(updatedQuotes);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastUpdatedTime(`Today at ${timeStr}`);
    setFetchingQuotes(false);
  };

  // Fetch initial stats & default top market tickers on mount
  useEffect(() => {
    getTickerStats().then(s => setStats(s));
    executeSearch('', 'All', 1);
  }, []);

  const executeSearch = async (q: string, type: 'All' | 'ETF' | 'Stock', p: number) => {
    setLoading(true);
    const res = await searchTickers(q, { type, page: p, limit: pageSize });
    if (res) {
      setResults(res.results);
      setTotal(res.total);
      setLoading(false);

      // Fast non-blocking parallel live quote fetcher for all 12 search result cards
      Promise.all(
        res.results.map(async (item) => {
          const liveQ = await fetchLiveQuote(item.symbol);
          setQuotes(prev => ({ ...prev, [item.symbol]: liveQ }));
        })
      );
    } else {
      setResults([]);
      setTotal(0);
      setLoading(false);
    }
  };

  // Debounced search input handler
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(query, instrumentType, page);
    }, 250);
  }, [query, instrumentType, page]);

  const handleTypeChange = (type: 'All' | 'ETF' | 'Stock') => {
    setInstrumentType(type);
    setPage(1);
  };

  const handleOpenDetail = async (item: TickerResult) => {
    setSelectedResult(item);
    if (quotes[item.symbol]) {
      setSelectedQuote(quotes[item.symbol]);
    } else {
      const q = await fetchLiveQuote(item.symbol);
      setSelectedQuote(q);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Hero Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 id="market-search-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27' }}>
            Universal Market Search
          </h1>
          <p style={{ color: '#64748B', marginTop: 4 }}>
            Instantly search and explore over 13,000+ U.S. stocks, ETFs, and index funds.
          </p>
        </div>
      </div>

      {/* ── Search Bar & Filter Bar Card ───────────────────────────── */}
      <div className="card" style={{ border: '2px solid #BAE6FD', padding: '1.25rem', borderRadius: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          
          {/* Main Search Input */}
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              id="market-search-input"
              type="text"
              placeholder="Search by ticker or company name (e.g. AAPL, Vanguard, Tesla, Nvidia, BND)…"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              className="input-field"
              style={{ paddingLeft: 46, paddingRight: query ? 38 : 16, borderRadius: 999, fontSize: '0.95rem', height: 48 }}
            />
            {query && (
              <button
                id="btn-clear-market-search"
                onClick={() => { setQuery(''); setPage(1); }}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: '#CBD5E1', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={12} color="white" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="tab-group" style={{ padding: '0.25rem', borderRadius: 999, height: 48, display: 'flex', alignItems: 'center' }}>
            {(['All', 'ETF', 'Stock'] as const).map(t => (
              <button
                key={t}
                id={`market-filter-${t.toLowerCase()}`}
                className={`tab-item${instrumentType === t ? ' active' : ''}`}
                onClick={() => handleTypeChange(t)}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: 999, fontWeight: 700 }}
              >
                {t === 'All' ? 'All Instruments' : t === 'ETF' ? 'ETFs Only' : 'Stocks Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Ticker Shortcut Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginRight: 4 }}>Popular:</span>
          {['VOO', 'AAPL', 'NVDA', 'SCHD', 'MSFT', 'VTI', 'TSLA', 'QQQ', 'BND', 'AMZN'].map(ticker => (
            <button
              key={ticker}
              id={`popular-chip-${ticker.toLowerCase()}`}
              onClick={() => {
                setQuery(ticker);
                setInstrumentType('All');
                setPage(1);
              }}
              style={{
                background: query.toUpperCase() === ticker ? '#0EA5E9' : '#F1F5F9',
                color: query.toUpperCase() === ticker ? 'white' : '#475569',
                border: `1px solid ${query.toUpperCase() === ticker ? '#0EA5E9' : '#CBD5E1'}`,
                borderRadius: 999,
                padding: '0.22rem 0.65rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search Results Stats Header ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
          {loading ? (
            <span>Searching market database…</span>
          ) : (
            <span>Found <strong style={{ color: '#0C1A27' }}>{total.toLocaleString()}</strong> instruments {query ? `for "${query}"` : ''}</span>
          )}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500, background: '#F8FBFF', border: '1px solid #BAE6FD', borderRadius: 999, padding: '0.25rem 0.75rem' }}>
            <Clock size={12} color="#64748B" />
            <span>Data updated: {lastUpdatedTime}</span>
            <button
              id="btn-sync-market-search"
              className="btn btn-ghost btn-sm"
              onClick={handleSyncAll}
              disabled={fetchingQuotes}
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', borderRadius: 999, color: '#0EA5E9', gap: 4, height: 'auto', minHeight: 0 }}
              title="Manually sync live market quotes"
            >
              <RotateCcw size={12} style={{ animation: fetchingQuotes ? 'spin 1s linear infinite' : 'none' }} />
              {fetchingQuotes ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dynamic Card Grid ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="card" style={{ padding: '1.1rem 1.2rem', height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.75 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 70, height: 22, borderRadius: 6, background: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: 45, height: 18, borderRadius: 999, background: '#F1F5F9' }} />
                </div>
                <div style={{ width: '85%', height: 16, borderRadius: 4, background: '#F1F5F9', marginBottom: 8 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ width: 80, height: 20, borderRadius: 4, background: '#E2E8F0', marginBottom: 6 }} />
                  <div style={{ width: 50, height: 14, borderRadius: 4, background: '#F1F5F9' }} />
                </div>
                <div style={{ width: 65, height: 26, borderRadius: 999, background: '#E2E8F0' }} />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
          <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.35, color: '#0EA5E9' }} />
          <div style={{ fontWeight: 800, color: '#0C1A27', fontSize: '1.15rem' }}>No instruments found</div>
          <div style={{ fontSize: '0.85rem', marginTop: 4, color: '#64748B' }}>Try searching for popular tickers or company names below:</div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: '1.2rem' }}>
            {['VOO', 'AAPL', 'NVDA', 'SCHD', 'TSLA', 'SPY', 'QQQ'].map(sym => (
              <button
                key={sym}
                onClick={() => { setQuery(sym); setInstrumentType('All'); setPage(1); }}
                style={{
                  background: '#F0F9FF',
                  color: '#0284C7',
                  border: '1px solid #BAE6FD',
                  borderRadius: 999,
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                + {sym}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {results.map(item => {
            const quote = quotes[item.symbol];
            const price = quote?.price;
            const changePct = quote?.changePercent;
            const isPos = changePct !== undefined ? changePct >= 0 : true;
            const isETF = item.isETF;

            return (
              <div
                key={item.symbol}
                id={`market-card-${item.symbol}`}
                onClick={() => handleOpenDetail(item)}
                className="card card-interactive"
                style={{
                  padding: '1.1rem 1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: '0.85rem',
                  border: '1.5px solid #BAE6FD',
                  borderRadius: 18,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: 'white'
                }}
              >
                {/* Top Row: Ticker & Badges */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.25rem', color: '#0284C7', letterSpacing: '-0.02em' }}>
                      {item.symbol}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{
                        background: isETF ? '#E0F2FE' : '#F3E8FF',
                        color: isETF ? '#0369A1' : '#6B21A8',
                        border: `1px solid ${isETF ? '#7DD3FC' : '#D8B4FE'}`,
                        borderRadius: 999,
                        padding: '0.15rem 0.55rem',
                        fontSize: '0.67rem',
                        fontWeight: 800
                      }}>
                        {isETF ? 'ETF' : 'Stock'}
                      </span>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: 999,
                        padding: '0.15rem 0.55rem',
                        fontSize: '0.67rem',
                        fontWeight: 600
                      }}>
                        {item.exchangeName || item.exchange}
                      </span>
                    </div>
                  </div>

                  {/* Company / Fund Name */}
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#0C1A27', lineHeight: 1.3, height: '2.6em', overflow: 'hidden' }}>
                    {item.name}
                  </h3>
                </div>

                {/* Bottom Row: Live Quote & Action */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #F0F9FF' }}>
                  <div>
                    {price !== undefined ? (
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.15rem', color: '#0C1A27', lineHeight: 1.1 }}>
                          ${price.toFixed(2)}
                        </div>
                        {changePct !== undefined && (
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 700, color: isPos ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            <span>{formatPercent(changePct)}</span>
                            {quote?.change !== undefined && (
                              <span style={{ opacity: 0.85, fontSize: '0.68rem' }}>
                                ({quote.change >= 0 ? `+$${quote.change.toFixed(2)}` : `-$${Math.abs(quote.change).toFixed(2)}`})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Fetching quote…</span>
                    )}
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ borderRadius: 999, padding: '0.3rem 0.75rem', fontSize: '0.72rem', color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', fontWeight: 700 }}
                  >
                    Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Controls ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '0.5rem' }}>
          <button
            id="btn-market-page-prev"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.82rem' }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
            Page {page} of {totalPages}
          </span>
          <button
            id="btn-market-page-next"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 999, padding: '0.4rem 1rem', fontSize: '0.82rem' }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Selected Instrument Detail Modal ───────────────────────── */}
      {selectedResult && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(12, 26, 39, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 520, borderRadius: 24, padding: '1.75rem', background: 'white', position: 'relative', border: '2px solid #BAE6FD', boxShadow: '0 20px 50px rgba(14,165,233,0.2)' }}>
            <button
              onClick={() => setSelectedResult(null)}
              style={{ position: 'absolute', right: 18, top: 18, background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} color="#64748B" />
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.6rem', color: '#0284C7' }}>
                {selectedResult.symbol}
              </span>
              <span style={{ background: selectedResult.isETF ? '#E0F2FE' : '#F3E8FF', color: selectedResult.isETF ? '#0369A1' : '#6B21A8', border: '1px solid #7DD3FC', borderRadius: 999, padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 800 }}>
                {selectedResult.isETF ? 'Exchange Traded Fund (ETF)' : 'Public Equity Stock'}
              </span>
            </div>

            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#0C1A27', marginBottom: 14 }}>
              {selectedResult.name}
            </h2>

            {/* Price & Quote Box */}
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '1rem 1.25rem', border: '1px solid #E2E8F0', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Current Price</span>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.75rem', color: '#0C1A27' }}>
                  {selectedQuote ? `$${selectedQuote.price.toFixed(2)}` : 'Fetching…'}
                </div>
              </div>

              {selectedQuote && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Daily Change</span>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: selectedQuote.changePercent >= 0 ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                    {selectedQuote.changePercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {formatPercent(selectedQuote.changePercent)}
                  </div>
                </div>
              )}
            </div>

            {/* Instrument Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Primary Exchange</span>
                <strong style={{ fontSize: '0.88rem', color: '#0369A1' }}>{selectedResult.exchangeName || selectedResult.exchange}</strong>
              </div>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Data Source</span>
                <strong style={{ fontSize: '0.88rem', color: '#0369A1' }}>NASDAQ / NYSE Direct</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
              {selectedResult.isETF 
                ? `${selectedResult.name} (${selectedResult.symbol}) is an Exchange Traded Fund providing pooled exposure to multiple underlying assets. Check expense ratio and sector allocations before investing.`
                : `${selectedResult.name} (${selectedResult.symbol}) is a publicly traded corporate security listed on ${selectedResult.exchangeName || selectedResult.exchange}.`}
            </p>

            <button
              onClick={() => setSelectedResult(null)}
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: 999, padding: '0.75rem' }}
            >
              Done Reading
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
