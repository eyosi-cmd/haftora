import React, { useState } from 'react';
import { SavedScenario } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, TrendingDown, Clock, DollarSign, CheckCircle2, XCircle, Home, Target, TrendingUp, GraduationCap, Save, Check } from 'lucide-react';

interface PortfolioBuilderViewProps {
  onSaveScenario?: (s: SavedScenario) => void;
}

export const PortfolioBuilderView: React.FC<PortfolioBuilderViewProps> = ({ onSaveScenario }) => {
  const [goal, setGoal]   = useState('retirement');
  const [model, setModel] = useState<'conservative'|'moderate'|'aggressive'>('moderate');
  const [saved, setSaved] = useState(false);

  const goals = [
    { id: 'retirement', label: 'Retirement (20+ Yrs)', icon: <Target size={16}/> },
    { id: 'home',       label: 'Home Purchase (5 Yrs)', icon: <Home size={16}/> },
    { id: 'wealth',     label: 'Wealth Building (10+ Yrs)', icon: <TrendingUp size={16}/> },
    { id: 'education',  label: 'Education Savings', icon: <GraduationCap size={16}/> },
  ];

  const models = {
    conservative: { stocks: 30, bonds: 60, cash: 10, ret: '4.5%–6.0%', d08: '-12.5%', d20: '-7.2%',  risk: 'Low',      desc: 'Capital preservation and bond income. Suited for 1-5 year horizons.' },
    moderate:     { stocks: 70, bonds: 25, cash: 5,  ret: '7.0%–9.0%', d08: '-28.4%', d20: '-16.8%', risk: 'Moderate', desc: 'Balanced equity growth with fixed income stability. Classic long-term portfolio.' },
    aggressive:   { stocks: 90, bonds: 10, cash: 0,  ret: '9.0%–11.5%',d08: '-44.2%', d20: '-28.5%', risk: 'High',     desc: 'Maximum compounding via global equities. For 15+ year horizons.' },
  };

  const handleSave = () => {
    if (!onSaveScenario) return;
    const selectedGoalObj = goals.find(g => g.id === goal);
    onSaveScenario({
      id: 'port-' + Date.now(),
      title: `Portfolio (${model.toUpperCase()} - ${selectedGoalObj?.label || goal})`,
      type: 'portfolio',
      createdAt: new Date().toLocaleDateString(),
      inputs: { goal, model, stocks: models[model].stocks, bonds: models[model].bonds, cash: models[model].cash },
      projectedValue: 100000,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const m = models[model];
  const COLORS = ['#0EA5E9','#6366F1','#F59E0B'];
  const pieData = [
    { name: 'Stocks', value: m.stocks },
    { name: 'Bonds',  value: m.bonds  },
    { name: 'Cash',   value: m.cash   },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 id="portfolio-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27' }}>Goal-Based Portfolio Simulator</h1>
          <p style={{ color: '#64748B', marginTop: 4 }}>Learn how asset allocation shapes risk, volatility, and long-term returns.</p>
        </div>
        {onSaveScenario && (
          <button id="btn-save-portfolio" onClick={handleSave} className="btn btn-primary btn-sm" style={{ borderRadius: 999 }}>
            {saved ? <><Check size={14} /> Allocation Saved!</> : <><Save size={14} /> Save Allocation</>}
          </button>
        )}
      </div>

      {/* Goal selector */}
      <div className="card">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>1. Select Your Goal</h2>
        <div id="goal-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
          {goals.map(g => (
            <button key={g.id} id={`goal-${g.id}`} onClick={() => setGoal(g.id)}
              className="btn btn-sm"
              style={{
                borderRadius: 12, justifyContent: 'flex-start', gap: 8,
                background: goal === g.id ? '#E0F2FE' : 'white',
                border: `1.5px solid ${goal === g.id ? '#0EA5E9' : '#BAE6FD'}`,
                color: goal === g.id ? '#0284C7' : '#475569',
                fontWeight: goal === g.id ? 700 : 600,
              }}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model tabs */}
      <div id="model-tabs" className="tab-group">
        {(['conservative','moderate','aggressive'] as const).map(k => (
          <button key={k} id={`model-tab-${k}`} className={`tab-item${model === k ? ' active' : ''}`}
            onClick={() => setModel(k)} style={{ textTransform: 'capitalize' }}>{k}</button>
        ))}
      </div>

      {/* Detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>

        {/* Info card */}
        <div id={`model-info-${model}`} className="card" style={{ borderLeft: '4px solid #0EA5E9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span className={`badge ${model==='aggressive'?'badge-red':model==='moderate'?'badge-indigo':'badge-green'}`}>{m.risk} Volatility</span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.2rem', color: '#0C1A27', marginTop: 8, textTransform: 'capitalize' }}>{model} Growth Allocation</h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 4 }}>{m.desc}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Expected Return', val: m.ret,  color: '#0EA5E9' },
              { label: 'Risk Level',      val: m.risk, color: '#6366F1' },
              { label: '2008 Drawdown',   val: m.d08,  color: '#EF4444' },
              { label: '2020 Drawdown',   val: m.d20,  color: '#F59E0B' },
            ].map(k => (
              <div key={k.label} style={{ background: '#F8FBFF', borderRadius: 10, padding: '0.7rem', border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: k.color, fontSize: '0.95rem' }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#92400E' }}>
              <strong>Note:</strong> Historical drawdowns are shown as a teaching tool. Diversified investors who held through 2008 and 2020 recovered fully and exceeded prior highs.
            </p>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Asset Allocation Mix</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'white', border:'1.5px solid #BAE6FD', borderRadius:10 }} formatter={(v:number) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#F8FBFF', borderRadius: 10, border: '1px solid #E0F2FE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                  <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS[i] }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── BOGLEHEADS 3-FUND PORTFOLIO STUDIO ────────────────────────────── */}
      <Bogleheads3FundStudio />
    </div>
  );
};

// ── BOGLEHEADS 3-FUND STUDIO COMPONENT ──────────────────────────────────────
const Bogleheads3FundStudio: React.FC = () => {
  const [vtiPct, setVtiPct] = useState(60);
  const [vxusPct, setVxusPct] = useState(20);
  const [bndPct, setBndPct] = useState(20);
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(500);

  const totalPct = vtiPct + vxusPct + bndPct;

  // Blended calculations
  const blendedExpenseRatio = Number(((vtiPct * 0.03 + vxusPct * 0.08 + bndPct * 0.03) / 100).toFixed(3));
  const blendedYield = Number(((vtiPct * 1.35 + vxusPct * 3.10 + bndPct * 3.85) / 100).toFixed(2));
  const blendedReturn = Number(((vtiPct * 10.0 + vxusPct * 7.5 + bndPct * 4.2) / 100).toFixed(2));

  // 30 year projection
  const r = blendedReturn / 100;
  const n = 30;
  const futureValue = Math.round(
    initialAmount * Math.pow(1 + r, n) +
    monthlyDeposit * 12 * ((Math.pow(1 + r, n) - 1) / r)
  );

  const annualDividendIncome = Math.round(futureValue * (blendedYield / 100));

  const applyPreset = (vti: number, vxus: number, bnd: number) => {
    setVtiPct(vti);
    setVxusPct(vxus);
    setBndPct(bnd);
  };

  return (
    <div id="bogleheads-studio" className="card" style={{ border: '2px solid #7DD3FC', background: '#F0F9FF', padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: 4 }}>Bogleheads Strategy Lab</span>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: '#0C1A27', fontSize: '1.25rem' }}>
            Interactive 3-Fund Portfolio Studio
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>
            Build the world-famous 3-Fund Index Portfolio (VTI + VXUS + BND) for maximum diversification & minimal fees.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => applyPreset(60, 20, 20)} className="btn btn-ghost btn-sm" style={{ borderRadius: 999, background: 'white', border: '1px solid #BAE6FD', fontSize: '0.72rem' }}>
            Classic 60/20/20
          </button>
          <button onClick={() => applyPreset(70, 30, 0)} className="btn btn-ghost btn-sm" style={{ borderRadius: 999, background: 'white', border: '1px solid #BAE6FD', fontSize: '0.72rem' }}>
            100% Equity Growth
          </button>
          <button onClick={() => applyPreset(40, 20, 40)} className="btn btn-ghost btn-sm" style={{ borderRadius: 999, background: 'white', border: '1px solid #BAE6FD', fontSize: '0.72rem' }}>
            Balanced 40/20/40
          </button>
        </div>
      </div>

      {/* Allocation Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 16, border: '1px solid #BAE6FD' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#0284C7', fontSize: '0.9rem' }}>VTI — US Total Stock</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#0C1A27' }}>{vtiPct}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={vtiPct} onChange={e => setVtiPct(+e.target.value)} />
          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4, display: 'block' }}>Vanguard Total Stock Market (0.03% ER)</span>
        </div>

        <div style={{ background: 'white', padding: '1rem', borderRadius: 16, border: '1px solid #BAE6FD' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#6366F1', fontSize: '0.9rem' }}>VXUS — Intl Stock</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#0C1A27' }}>{vxusPct}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={vxusPct} onChange={e => setVxusPct(+e.target.value)} />
          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4, display: 'block' }}>Total International Stock (0.08% ER)</span>
        </div>

        <div style={{ background: 'white', padding: '1rem', borderRadius: 16, border: '1px solid #BAE6FD' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.9rem' }}>BND — Total Bond</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#0C1A27' }}>{bndPct}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={bndPct} onChange={e => setBndPct(+e.target.value)} />
          <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4, display: 'block' }}>Total Bond Market (0.03% ER)</span>
        </div>
      </div>

      {totalPct !== 100 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#B45309', padding: '0.5rem 0.85rem', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} /> Total allocation is {totalPct}% (adjust sliders to equal 100%).
        </div>
      )}

      {/* Live Calculated Output Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <div style={{ background: 'white', padding: '0.9rem', borderRadius: 14, border: '1px solid #BAE6FD', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Blended Expense Ratio</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#10B981', marginTop: 2 }}>
            {blendedExpenseRatio}% / yr
          </div>
        </div>

        <div style={{ background: 'white', padding: '0.9rem', borderRadius: 14, border: '1px solid #BAE6FD', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Blended Div Yield</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#0284C7', marginTop: 2 }}>
            {blendedYield}%
          </div>
        </div>

        <div style={{ background: 'white', padding: '0.9rem', borderRadius: 14, border: '1px solid #BAE6FD', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>30-Yr Projected Value</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#0EA5E9', marginTop: 2 }}>
            ${futureValue.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'white', padding: '0.9rem', borderRadius: 14, border: '1px solid #BAE6FD', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Est. Annual Dividends</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color: '#059669', marginTop: 2 }}>
            ${annualDividendIncome.toLocaleString()} / yr
          </div>
        </div>
      </div>
    </div>
  );
};
