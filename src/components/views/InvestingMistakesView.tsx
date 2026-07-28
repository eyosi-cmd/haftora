import React, { useState } from 'react';
import { TrendingDown, Clock, DollarSign, CheckCircle2, XCircle } from 'lucide-react';

export const InvestingMistakesView: React.FC = () => {
  const [active, setActive] = useState<'panic'|'timing'|'fees'>('panic');

  const scenarios = [
    { id: 'panic',  label: '1. Panic Selling',     color: '#EF4444', icon: <TrendingDown size={18}/> },
    { id: 'timing', label: '2. Timing the Market', color: '#F59E0B', icon: <Clock size={18}/> },
    { id: 'fees',   label: '3. High Fee Erosion',  color: '#6366F1', icon: <DollarSign size={18}/> },
  ] as const;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 id="mistakes-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27' }}>Costly Investing Mistakes</h1>
        <p style={{ color: '#64748B', marginTop: 4 }}>Master the 90% emotional discipline component of successful long-term investing.</p>
      </div>

      {/* Scenario picker */}
      <div id="mistake-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
        {scenarios.map(s => (
          <button
            key={s.id}
            id={`mistake-${s.id}`}
            onClick={() => setActive(s.id)}
            className="card card-interactive"
            style={{
              border: `2px solid ${active === s.id ? s.color : '#BAE6FD'}`,
              background: active === s.id ? `${s.color}12` : 'white',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10, padding: '1rem',
            }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: active === s.id ? s.color : '#334155' }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Panic Selling */}
      {active === 'panic' && (
        <div id="mistake-panel-panic" className="card" style={{ borderLeft: '4px solid #EF4444' }}>
          <span className="badge badge-red" style={{ marginBottom: 12 }}>Mistake #1</span>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0C1A27', marginBottom: 8 }}>Panic Selling During Market Drops</h2>
          <p style={{ color: '#475569', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            When markets drop 20%+ due to news headlines, inexperienced investors panic and sell — turning temporary paper fluctuations into permanent locked-in losses.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem' }}>
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 14, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#991B1B', marginBottom: 8 }}>
                <XCircle size={18}/> Panic Seller (Alex)
              </div>
              <p style={{ fontSize: '0.85rem', color: '#7F1D1D', lineHeight: 1.6 }}>Invested $10,000 in 2007. Sold during 2008 crash for $7,000. Stayed in cash for 10 years.</p>
              <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#EF4444' }}>Final: $7,000 (–30%)</div>
            </div>
            <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 14, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#065F46', marginBottom: 8 }}>
                <CheckCircle2 size={18}/> Disciplined Investor (Maya)
              </div>
              <p style={{ fontSize: '0.85rem', color: '#064E3B', lineHeight: 1.6 }}>Invested $10,000 in 2007. Held through the crash and continued $200/month contributions.</p>
              <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#10B981' }}>Final: $48,500 (+385%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Timing */}
      {active === 'timing' && (
        <div id="mistake-panel-timing" className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <span className="badge badge-amber" style={{ marginBottom: 12 }}>Mistake #2</span>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0C1A27', marginBottom: 8 }}>Missing the Market's Best Days</h2>
          <p style={{ color: '#475569', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            Trying to time the market bottom causes investors to sit in cash during the explosive recovery days that generate most long-term wealth.
          </p>
          <div className="card" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
            <h3 style={{ fontWeight: 800, color: '#92400E', marginBottom: 12 }}>J.P. Morgan 20-Year Study (2002–2022)</h3>
            {[
              { label: 'Fully Invested (20 Years)',   result: '$64,800 (+548%)',  color: '#10B981' },
              { label: 'Missed Top 10 Best Days',     result: '$29,700 (+197%)',  color: '#F59E0B' },
              { label: 'Missed Top 30 Best Days',     result: '$11,700 (+17%)',   color: '#EF4444' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '0.85rem', color: '#78350F' }}>{row.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: row.color }}>{row.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fees */}
      {active === 'fees' && (
        <div id="mistake-panel-fees" className="card" style={{ borderLeft: '4px solid #6366F1' }}>
          <span className="badge badge-indigo" style={{ marginBottom: 12 }}>Mistake #3</span>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0C1A27', marginBottom: 8 }}>The Silent 1% Expense Ratio Drain</h2>
          <p style={{ color: '#475569', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            A 1.0% annual management fee sounds small, but over 30 years it quietly steals 25%+ of your final wealth through compound erosion.
          </p>
          <div style={{ background: '#EEF2FF', border: '1.5px solid #A5B4FC', borderRadius: 14, padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, color: '#3730A3', marginBottom: 12 }}>30-Year Impact — $500/mo at 8% Return</h3>
            {[
              { label: 'Index ETF (VOO — 0.03% fee)',          result: '$724,000', color: '#10B981' },
              { label: 'Typical Mutual Fund (1.00% fee)',       result: '$568,000', color: '#EF4444' },
              { label: 'Wealth Lost to Fees',                   result: '$156,000', color: '#6366F1' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #C7D2FE' }}>
                <span style={{ fontSize: '0.85rem', color: '#312E81' }}>{row.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: row.color }}>{row.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
