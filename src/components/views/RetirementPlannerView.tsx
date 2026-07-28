import React, { useState } from 'react';
import { SavedScenario } from '../../types';
import { calculateCompoundInterest, formatCurrency } from '../../utils/financialMath';
import { Target, Save, Check, Info } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

interface RetirementPlannerViewProps {
  onSaveScenario: (s: SavedScenario) => void;
}

export const RetirementPlannerView: React.FC<RetirementPlannerViewProps> = ({ onSaveScenario }) => {
  const [currentAge, setCurrentAge]               = useState(28);
  const [retirementAge, setRetirementAge]         = useState(65);
  const [initialInvestment, setInitialInvestment] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [expectedReturn, setExpectedReturn]       = useState(8.0);
  const [inflationRate, setInflationRate]         = useState(2.5);
  const [saved, setSaved]                         = useState(false);

  const years = Math.max(1, retirementAge - currentAge);
  const data  = calculateCompoundInterest(initialInvestment, monthlyContribution, expectedReturn, years, inflationRate, currentAge);
  const final = data[data.length - 1];

  const handleSave = () => {
    onSaveScenario({
      id: 'scen-' + Date.now(),
      title: `Retirement Plan (Age ${currentAge}→${retirementAge})`,
      type: 'retirement',
      createdAt: new Date().toLocaleDateString(),
      inputs: { currentAge, retirementAge, initialInvestment, monthlyContribution, expectedReturn, inflationRate },
      projectedValue: final.nominalBalance,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sliders = [
    { id: 'slider-current-age',     label: 'Current Age',              val: currentAge,           set: setCurrentAge,          min: 18,  max: 70,   step: 1,   suffix: ' yrs' },
    { id: 'slider-retirement-age',  label: 'Target Retirement Age',    val: retirementAge,        set: setRetirementAge,       min: currentAge+1, max: 85, step: 1, suffix: ' yrs' },
    { id: 'slider-initial',         label: 'Initial Savings',          val: initialInvestment,    set: setInitialInvestment,   min: 0,   max: 50000, step: 500, prefix: '$' },
    { id: 'slider-monthly',         label: 'Monthly Contribution',     val: monthlyContribution,  set: setMonthlyContribution, min: 50,  max: 5000,  step: 50,  prefix: '$', suffix: '/mo' },
    { id: 'slider-return',          label: 'Expected Annual Return',   val: expectedReturn,       set: setExpectedReturn,      min: 3,   max: 14,    step: 0.5, suffix: '%' },
    { id: 'slider-inflation',       label: 'Annual Inflation Rate',    val: inflationRate,        set: setInflationRate,       min: 1,   max: 6,     step: 0.5, suffix: '%' },
  ];

  const milestones = data.filter(p => p.year % 5 === 0 || p.year === years);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 id="planner-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27' }}>
            Retirement Projection Planner
          </h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: '0.9rem' }}>Simulate growth over {years} years and see real vs inflation-adjusted purchasing power.</p>
        </div>
        <button id="btn-save-scenario" className="btn btn-primary" onClick={handleSave}>
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Scenario</>}
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1rem', background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, fontSize: '0.8rem', color: '#92400E' }}>
        <Info size={15} />
        <span><strong>Educational Projection Only.</strong> Actual investment results will differ. This tool is for learning purposes only.</span>
      </div>

      {/* Main planner grid: stacked on mobile, side-by-side on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

        {/* Sliders panel */}
        <div id="planner-controls" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0C1A27', paddingBottom: 10, borderBottom: '1.5px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={17} color="#0EA5E9" /> Parameters
          </h2>
          {sliders.map(s => (
            <div key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{s.label}</label>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.82rem', color: '#0284C7' }}>
                  {s.prefix || ''}{s.val}{s.suffix || ''}
                </span>
              </div>
              <input id={s.id} type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                onChange={e => s.set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* KPI cards - stacked on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {[
              { id: 'kpi-nominal',      label: `Portfolio at Age ${retirementAge}`, val: formatCurrency(final.nominalBalance),      color: '#0EA5E9', border: '#0EA5E9' },
              { id: 'kpi-contributed',  label: 'Total Contributed',                 val: formatCurrency(final.totalContributions),  color: '#334155', border: '#BAE6FD' },
              { id: 'kpi-real',         label: 'Inflation-Adjusted Power',          val: formatCurrency(final.realBalance),         color: '#F59E0B', border: '#FCD34D' },
            ].map(k => (
              <div key={k.id} id={k.id} className="card" style={{ borderTop: `3px solid ${k.border}`, padding: '0.9rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', color: k.color, wordBreak: 'break-word' }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div id="retirement-chart" className="card">
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', marginBottom: '1rem' }}>
              Portfolio Growth Chart
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="nomG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="realG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" />
                  <XAxis dataKey="age" tickFormatter={v => `${v}`} stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1.5px solid #BAE6FD', borderRadius: 12, boxShadow: '0 4px 16px rgba(14,165,233,0.15)' }}
                    formatter={(v: number) => [formatCurrency(v), '']}
                    labelFormatter={l => `Age ${l}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="nominalBalance" name="Nominal Value" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#nomG)" />
                  <Area type="monotone" dataKey="realBalance" name="Inflation-Adjusted" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" fill="url(#realG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestones table */}
          <div id="milestones-table" className="card">
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Age Milestones</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F0F9FF' }}>
                    {['Age', 'Year', 'Total Invested', 'Portfolio Value', 'Real Power'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {milestones.map(pt => (
                    <tr key={pt.year} style={{ borderBottom: '1px solid #E0F2FE' }}>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: '#0C1A27' }}>Age {pt.age}</td>
                      <td style={{ padding: '0.55rem 0.75rem', color: '#64748B' }}>Yr {pt.year}</td>
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: '#334155' }}>{formatCurrency(pt.totalContributions)}</td>
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: '#0EA5E9', fontWeight: 700 }}>{formatCurrency(pt.nominalBalance)}</td>
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B' }}>{formatCurrency(pt.realBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
