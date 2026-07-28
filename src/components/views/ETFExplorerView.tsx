import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ETFData } from '../../types';
import { ETF_DATASET } from '../../data/etfData';
import { calculateFeeImpact, formatCurrency, formatPercent } from '../../utils/financialMath';
import { fetchLiveQuote, LiveMarketQuote } from '../../services/marketApi';
import { searchTickers, getTickerStats, triggerSync, TickerResult, TickerStats } from '../../services/tickerApi';
import {
  Search, PieChart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Layers, BarChart3, Check, RefreshCw, Radio, X, ChevronRight, Zap,
  Database, Activity, RotateCcw
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ── Fuzzy search: score a string against a query ──────────────────────────
function fuzzyScore(target: string, query: string): number {
  if (!query) return 1;
  const t = target.toLowerCase();
  const q = query.toLowerCase().trim();
  if (t === q) return 100;                       // exact
  if (t.startsWith(q)) return 90;               // prefix
  if (t.includes(q)) return 70;                 // substring
  // character-by-character sequential match
  let ti = 0, qi = 0, score = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) { score++; qi++; }
    ti++;
  }
  return qi === q.length ? (score / q.length) * 50 : 0;
}

function searchETFs(etfs: ETFData[], query: string, category: string): ETFData[] {
  const q = query.trim();
  let filtered = etfs.filter(e => category === 'All' || e.category === category);
  if (!q) return filtered;
  return filtered
    .map(e => ({
      etf: e,
      score: Math.max(
        fuzzyScore(e.ticker, q),
        fuzzyScore(e.name, q),
        fuzzyScore(e.category, q)
      ),
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.etf);
}

const SECTOR_COLORS = ['#0EA5E9', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];
const CATEGORIES = ['All', 'S&P 500', 'Total Market', 'Dividend Growth', 'Tech & Growth', 'International', 'Bonds'];

// ── Category badge color map ──────────────────────────────────────────────
const CAT_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  'S&P 500':        { bg: '#E0F2FE', color: '#0369A1', border: '#7DD3FC' },
  'Total Market':   { bg: '#EEF2FF', color: '#4338CA', border: '#A5B4FC' },
  'Dividend Growth':{ bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'Tech & Growth':  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  'International':  { bg: '#FDF4FF', color: '#7E22CE', border: '#D8B4FE' },
  'Bonds':          { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
};

export const ETFExplorerView: React.FC = () => {
  // ── Curated ETF state (existing 6-card detail panel) ──────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedETF, setSelectedETF]   = useState<ETFData>(ETF_DATASET[0]);
  const [compareList, setCompareList]   = useState<ETFData[]>([]);
  const [isComparing, setIsComparing]   = useState(false);
  const [liveQuotes, setLiveQuotes]     = useState<Record<string, LiveMarketQuote>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Universal Live Search (backend API) ───────────────────────────────────
  const [liveQuery, setLiveQuery]           = useState('');
  const [liveResults, setLiveResults]       = useState<TickerResult[]>([]);
  const [liveTotal, setLiveTotal]           = useState(0);
  const [liveLoading, setLiveLoading]       = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [backendOnline, setBackendOnline]   = useState<boolean | null>(null);
  const [tickerStats, setTickerStats]       = useState<TickerStats | null>(null);
  const [liveSearchType, setLiveSearchType] = useState<'All' | 'ETF' | 'Stock'>('All');
  const [livePage, setLivePage]             = useState(1);
  const [syncing, setSyncing]               = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if backend is online on mount
  useEffect(() => {
    getTickerStats().then(stats => {
      setBackendOnline(stats !== null);
      setTickerStats(stats);
    });
  }, []);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!liveQuery.trim()) {
      setLiveResults([]);
      setLiveTotal(0);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLiveLoading(true);
      const res = await searchTickers(liveQuery, { type: liveSearchType, limit: 10, page: livePage });
      if (res) {
        setLiveResults(res.results);
        setLiveTotal(res.total);
        setShowDropdown(true);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
        setShowDropdown(false);
      }
      setLiveLoading(false);
    }, 300);
  }, [liveQuery, liveSearchType, livePage]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await triggerSync();
    setTimeout(async () => {
      const stats = await getTickerStats();
      setTickerStats(stats);
      setSyncing(false);
    }, 3000);
  };

  const refreshMarketData = async () => {
    setIsRefreshing(true);
    const updated: Record<string, LiveMarketQuote> = {};
    for (const etf of ETF_DATASET) {
      updated[etf.ticker] = await fetchLiveQuote(etf.ticker);
    }
    setLiveQuotes(updated);
    setIsRefreshing(false);
  };

  useEffect(() => { refreshMarketData(); }, []);

  const filteredETFs = useMemo(
    () => searchETFs(ETF_DATASET, searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  const activeLiveQuote = liveQuotes[selectedETF.ticker];
  const currentPrice    = activeLiveQuote ? activeLiveQuote.price : selectedETF.price;
  const currentChange   = activeLiveQuote ? activeLiveQuote.changePercent : selectedETF.dailyChangePercent;
  const isPositive      = currentChange >= 0;

  const feeImpactPts = calculateFeeImpact(10000, 300, 8, 20, selectedETF.expenseRatio);
  const feeSaved20Yr = feeImpactPts[feeImpactPts.length - 1].lostToFees;

  const toggleCompare = (etf: ETFData) => {
    if (compareList.some(i => i.ticker === etf.ticker)) {
      setCompareList(compareList.filter(i => i.ticker !== etf.ticker));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, etf]);
    }
  };

  const catStyle = (cat: string) =>
    CAT_COLOR[cat] ?? { bg: '#F0F9FF', color: '#0284C7', border: '#7DD3FC' };

  // ── Detail panel content helpers ─────────────────────────────────────────
  const QuickMetric = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{ background: '#F8FBFF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color }}>{value}</div>
    </div>
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 id="etf-explorer-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27' }}>
              ETF Explorer
            </h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 999, padding: '0.28rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#065F46' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Real-Time Market Data
            </span>
          </div>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: '0.88rem' }}>
            Search, compare and analyze top ETFs — expense ratios, sector weights, live prices.
          </p>
        </div>
      </div>



      {/* ── Compare Matrix ──────────────────────────────────────── */}
      {isComparing && compareList.length > 0 && (
        <div id="compare-matrix" className="card" style={{ border: '2px solid #7DD3FC', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: '#0C1A27', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="#0EA5E9" /> Side-by-Side Comparison
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsComparing(false)} style={{ borderRadius: 999 }}>
              <X size={15} /> Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: '1rem', overflowX: 'auto' }}>
            {compareList.map(fund => {
              const lq = liveQuotes[fund.ticker];
              const p  = lq ? lq.price : fund.price;
              const ch = lq ? lq.changePercent : fund.dailyChangePercent;
              const cs = catStyle(fund.category);
              return (
                <div key={fund.ticker} style={{ background: '#F8FBFF', border: `1.5px solid ${cs.border}`, borderRadius: 14, padding: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#0C1A27' }}>{fund.ticker}</span>
                    <span style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, borderRadius: 999, padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontWeight: 700 }}>{fund.category}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 10, fontWeight: 600 }}>{fund.name}</p>
                  {[
                    { k: 'Price',          v: `$${p.toFixed(2)}`,          c: '#0C1A27' },
                    { k: "Today's Δ",       v: formatPercent(ch),            c: ch >= 0 ? '#10B981' : '#EF4444' },
                    { k: 'Expense Ratio',  v: `${fund.expenseRatio}%`,      c: '#0EA5E9' },
                    { k: 'Dividend Yield', v: `${fund.dividendYield}%`,     c: '#10B981' },
                    { k: '5-Yr Return',    v: `+${fund.historicalReturn5Yr}%`, c: '#6366F1' },
                    { k: 'Risk',           v: fund.riskLevel,               c: '#F59E0B' },
                  ].map(row => (
                    <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #E0F2FE', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>{row.k}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: row.c }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search & Filter Bar ──────────────────────────────────── */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input
            id="etf-search-input"
            type="text"
            placeholder="Search by ticker, name, or category (e.g. VOO, Vanguard, Bonds)…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 42, paddingRight: searchQuery ? 38 : 14, borderRadius: 999 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#CBD5E1', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={11} color="white" />
            </button>
          )}
        </div>

        {/* Category pill filters */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            const cs = catStyle(cat);
            return (
              <button
                key={cat}
                id={`etf-cat-${cat.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.38rem 0.9rem',
                  borderRadius: 999,
                  border: `1.5px solid ${isActive ? cs.border : '#BAE6FD'}`,
                  background: isActive ? cs.bg : 'white',
                  color: isActive ? cs.color : '#64748B',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.14s',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
          {filteredETFs.length === 0
            ? `No ETFs match "${searchQuery}"`
            : `${filteredETFs.length} ETF${filteredETFs.length > 1 ? 's' : ''} found${searchQuery ? ` for "${searchQuery}"` : ''}`}
        </div>
      </div>

      {/* ── Main 2-column layout ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT — ETF List ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredETFs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
              <Search size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: '#475569' }}>No ETFs found</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Try searching "{searchQuery.length > 3 ? searchQuery.slice(0,3) : 'VOO'}" or clear the filter</div>
            </div>
          ) : filteredETFs.map(etf => {
            const isSelected = selectedETF.ticker === etf.ticker;
            const isCompared = compareList.some(i => i.ticker === etf.ticker);
            const lq    = liveQuotes[etf.ticker];
            const price = lq ? lq.price : etf.price;
            const chng  = lq ? lq.changePercent : etf.dailyChangePercent;
            const pos   = chng >= 0;
            const cs    = catStyle(etf.category);

            return (
              <div
                key={etf.ticker}
                id={`etf-card-${etf.ticker}`}
                onClick={() => setSelectedETF(etf)}
                style={{
                  background: isSelected ? '#E0F2FE' : 'white',
                  border: `1.5px solid ${isSelected ? '#0EA5E9' : '#BAE6FD'}`,
                  borderRadius: 16,
                  padding: '0.9rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 4px 16px rgba(14,165,233,0.15)' : 'none',
                }}
                className={!isSelected ? 'card-interactive' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  {/* Left: Ticker + Name */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.05rem', color: isSelected ? '#0284C7' : '#0C1A27' }}>
                        {etf.ticker}
                      </span>
                      <span style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, borderRadius: 999, padding: '0.18rem 0.55rem', fontSize: '0.67rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {etf.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {etf.name}
                    </p>
                  </div>

                  {/* Right: Price + Compare */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.95rem', color: '#0C1A27' }}>
                      ${price.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 700, color: pos ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {formatPercent(chng)}
                    </span>
                    <button
                      id={`compare-btn-${etf.ticker}`}
                      onClick={e => { e.stopPropagation(); toggleCompare(etf); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '0.25rem 0.6rem',
                        borderRadius: 999,
                        border: `1.5px solid ${isCompared ? '#0EA5E9' : '#BAE6FD'}`,
                        background: isCompared ? '#E0F2FE' : 'white',
                        color: isCompared ? '#0284C7' : '#94A3B8',
                        fontSize: '0.67rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.12s',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {isCompared ? <><Check size={10} />Compared</> : <>+ Compare</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Detail Panel ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'sticky', top: 80 }}>

          {/* Price Hero */}
          <div className="card" style={{ borderLeft: '4px solid #0EA5E9' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: 14 }}>
              <div>
                <span style={{ ...catStyle(selectedETF.category), borderRadius: 999, padding: '0.22rem 0.7rem', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${catStyle(selectedETF.category).border}`, display: 'inline-block', marginBottom: 6 }}>
                  {selectedETF.category}
                </span>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', color: '#0C1A27', lineHeight: 1.2 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0EA5E9' }}>{selectedETF.ticker}</span>
                  {' — '}
                  {selectedETF.name}
                </h2>
                {activeLiveQuote && (
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    Updated {activeLiveQuote.lastUpdated} · {activeLiveQuote.isRealTime ? 'Live Feed' : 'Intraday Feed'}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0C1A27', lineHeight: 1 }}>
                  ${currentPrice.toFixed(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 4, color: isPositive ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}>
                  {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatPercent(currentChange)} Today
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7, marginBottom: 14 }}>
              {selectedETF.description}
            </p>

            {/* Quick Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
              <QuickMetric label="Expense Ratio" value={`${selectedETF.expenseRatio}% / yr`} color="#0EA5E9" />
              <QuickMetric label="Dividend Yield" value={`${selectedETF.dividendYield}%`} color="#10B981" />
              <QuickMetric label="5-Yr Avg Return" value={`+${selectedETF.historicalReturn5Yr}%`} color="#6366F1" />
              <QuickMetric label="Risk Rating" value={selectedETF.riskLevel} color="#F59E0B" />
            </div>
          </div>

          {/* Fee Savings Widget */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', border: '1.5px solid #7DD3FC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} color="white" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', fontSize: '0.95rem' }}>
                  Low-Fee Advantage ({selectedETF.expenseRatio}% Expense Ratio)
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  vs. typical 1.0% mutual fund — $300/mo for 20 years
                </p>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #BAE6FD', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Estimated Savings Over 20 Years</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.4rem', color: '#10B981' }}>
                ~{formatCurrency(feeSaved20Yr)} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>kept in your pocket</span>
              </span>
            </div>
          </div>

          {/* Sector + Holdings Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>

            {/* Sector Pie */}
            <div className="card">
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <PieChart size={16} color="#0EA5E9" /> Sector Allocation
              </h3>
              <div style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={selectedETF.sectorAllocation} dataKey="percentage" nameKey="sector" cx="50%" cy="50%" outerRadius={68} innerRadius={38}>
                      {selectedETF.sectorAllocation.map((_, i) => (
                        <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1.5px solid #BAE6FD', borderRadius: 10, boxShadow: '0 4px 16px rgba(14,165,233,0.1)' }}
                      formatter={(v: number) => [`${v}%`, 'Allocation']}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {selectedETF.sectorAllocation.slice(0, 5).map((sec, i) => (
                  <div key={sec.sector} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: SECTOR_COLORS[i], flexShrink: 0 }} />
                      <span style={{ color: '#475569' }}>{sec.sector}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: SECTOR_COLORS[i] }}>{sec.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Holdings */}
            <div className="card">
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Layers size={16} color="#6366F1" /> Top Holdings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {selectedETF.topHoldings.map((h, i) => (
                  <div key={h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#F8FBFF', border: '1px solid #E0F2FE', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#0284C7', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0EA5E9', fontSize: '0.82rem', flexShrink: 0 }}>{h.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .etf-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
