import React, { useState } from 'react';
import { SavedScenario } from '../../types';
import {
  calculateCompoundInterest, calculateDCA,
  calculateDividendGrowth, formatCurrency
} from '../../utils/financialMath';
import { Calculator, Save, Check } from 'lucide-react';

interface CalculatorsViewProps {
  onSaveScenario?: (s: SavedScenario) => void;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({ onSaveScenario }) => {
  const [tab, setTab] = useState<'compound'|'dca'|'drip'|'inflation'>('compound');
  const [saved, setSaved] = useState(false);

  const handleSaveCalculation = () => {
    if (!onSaveScenario) return;
    let title = 'Compound Interest Calculation';
    let val = ciFinal.nominalBalance;

    if (tab === 'dca') {
      title = 'DCA Simulation';
      val = dcaFinal.dcaPortfolioValue;
    } else if (tab === 'drip') {
      title = 'Dividend DRIP Calculation';
      val = dripFinal.portfolioValue;
    } else if (tab === 'inflation') {
      title = 'Inflation Impact Calculation';
      val = infFuture;
    }

    onSaveScenario({
      id: 'calc-' + Date.now(),
      title,
      type: 'compound',
      createdAt: new Date().toLocaleDateString(),
      inputs: { tab, ciInit, ciMo, ciRate, ciYrs },
      projectedValue: val,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Compound Interest
  const [ciInit, setCiInit]       = useState(1000);
  const [ciMo,   setCiMo]         = useState(250);
  const [ciRate, setCiRate]       = useState(8);
  const [ciYrs,  setCiYrs]        = useState(20);
  const ciRes   = calculateCompoundInterest(ciInit, ciMo, ciRate, ciYrs);
  const ciFinal = ciRes[ciRes.length - 1];

  // DCA
  const [dcaAmt, setDcaAmt]       = useState(12000);
  const [dcaMo,  setDcaMo]        = useState(12);
  const dcaRes   = calculateDCA(dcaAmt, dcaAmt / dcaMo, dcaMo);
  const dcaFinal = dcaRes[dcaRes.length - 1];

  // DRIP
  const [dripInit,  setDripInit]  = useState(5000);
  const [dripMo,    setDripMo]    = useState(300);
  const [dripYield, setDripYield] = useState(3.5);
  const [dripYrs,   setDripYrs]   = useState(20);
  const dripRes   = calculateDividendGrowth(dripInit, dripMo, dripYield, 6, 5, dripYrs);
  const dripFinal = dripRes[dripRes.length - 1];

  // Inflation
  const [infVal,  setInfVal]      = useState(10000);
  const [infRate, setInfRate]     = useState(3);
  const [infYrs,  setInfYrs]      = useState(15);
  const infFuture = infVal / Math.pow(1 + infRate / 100, infYrs);

  const tabs = [
    { id: 'compound', label: 'Compound Interest' },
    { id: 'dca',      label: 'DCA vs Lump Sum' },
    { id: 'drip',     label: 'Dividend DRIP' },
    { id: 'inflation',label: 'Inflation Impact' },
  ] as const;

  const SliderRow = ({ id, label, val, set, min, max, step, prefix='', suffix='' }: any) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</label>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.82rem', color: '#0284C7' }}>{prefix}{val}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} />
    </div>
  );

  const ResultCard = ({ id, label, val, color }: { id:string; label:string; val:string; color:string }) => (
    <div id={id} className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.1rem', color }}>{val}</div>
    </div>
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 id="calculators-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={26} color="#0EA5E9" /> Financial Calculator Suite
          </h1>
          <p style={{ color: '#64748B', marginTop: 4 }}>Interactive tools for compound interest, DCA, dividends, and inflation.</p>
        </div>
        {onSaveScenario && (
          <button id="btn-save-calc" onClick={handleSaveCalculation} className="btn btn-primary btn-sm" style={{ borderRadius: 999 }}>
            {saved ? <><Check size={14} /> Calculation Saved!</> : <><Save size={14} /> Save Calculation</>}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div id="calculator-tabs" className="tab-group" style={{ overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} id={`calc-tab-${t.id}`} className={`tab-item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── COMPOUND INTEREST ── */}
      {tab === 'compound' && (
        <div id="calc-compound" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Inputs</h2>
            <SliderRow id="ci-initial"  label="Initial Deposit"   val={ciInit} set={setCiInit} min={0}    max={25000} step={500} prefix="$" />
            <SliderRow id="ci-monthly"  label="Monthly Amount"    val={ciMo}   set={setCiMo}   min={25}   max={3000}  step={25}  prefix="$" />
            <SliderRow id="ci-rate"     label="Annual Return"     val={ciRate} set={setCiRate} min={2}    max={15}    step={0.5} suffix="%" />
            <SliderRow id="ci-years"    label="Years"             val={ciYrs}  set={setCiYrs}  min={1}    max={40}    step={1}   suffix=" yrs" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ResultCard id="ci-result-balance"  label="Final Portfolio Value"    val={formatCurrency(ciFinal.nominalBalance)}    color="#0EA5E9" />
            <ResultCard id="ci-result-invested" label="Total Out-of-Pocket"      val={formatCurrency(ciFinal.totalContributions)} color="#334155" />
            <ResultCard id="ci-result-interest" label="Compound Interest Earned" val={'+' + formatCurrency(ciFinal.interestEarned)} color="#10B981" />
            <div className="card" style={{ background: '#E0F2FE', border: '1.5px solid #7DD3FC' }}>
              <p style={{ fontSize: '0.82rem', color: '#0369A1', fontStyle: 'italic' }}>
                Interest earned ({formatCurrency(ciFinal.interestEarned)}) exceeds your contributions — that's the magic of compounding!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DCA ── */}
      {tab === 'dca' && (
        <div id="calc-dca" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Inputs</h2>
            <SliderRow id="dca-amount"  label="Total Cash Available"      val={dcaAmt} set={setDcaAmt} min={1000}  max={100000} step={1000} prefix="$" />
            <SliderRow id="dca-months"  label="Spread Over (Months)"      val={dcaMo}  set={setDcaMo}  min={3}     max={36}     step={1}    suffix=" mo" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ResultCard id="dca-result-lump"  label={`Lump Sum Result (${dcaMo} mo)`} val={formatCurrency(dcaFinal.lumpSumBalance)} color="#0EA5E9" />
            <ResultCard id="dca-result-dca"   label={`DCA Result (${dcaMo} mo)`}       val={formatCurrency(dcaFinal.dcaBalance)}     color="#6366F1" />
            <div className="card" style={{ background: '#EEF2FF', border: '1.5px solid #A5B4FC' }}>
              <p style={{ fontSize: '0.82rem', color: '#4338CA' }}>
                Historically, lump-sum investing beats DCA ~66% of the time since markets trend upward long-term. But DCA reduces timing anxiety.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DRIP ── */}
      {tab === 'drip' && (
        <div id="calc-drip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Inputs</h2>
            <SliderRow id="drip-initial" label="Starting Portfolio"  val={dripInit}  set={setDripInit}  min={1000} max={50000} step={1000} prefix="$" />
            <SliderRow id="drip-monthly" label="Monthly Deposit"     val={dripMo}    set={setDripMo}    min={50}   max={2000}  step={50}   prefix="$" />
            <SliderRow id="drip-yield"   label="Initial Yield"       val={dripYield} set={setDripYield} min={1}    max={8}     step={0.25} suffix="%" />
            <SliderRow id="drip-years"   label="Years"               val={dripYrs}   set={setDripYrs}   min={5}    max={40}    step={1}    suffix=" yrs" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ResultCard id="drip-result-portfolio" label={`Portfolio Value (${dripYrs} yrs)`}    val={formatCurrency(dripFinal.portfolioValue)}       color="#0EA5E9" />
            <ResultCard id="drip-result-income"    label="Annual Dividend Income"                 val={formatCurrency(dripFinal.annualDividendIncome) + '/yr'} color="#10B981" />
            <ResultCard id="drip-result-yoc"       label="Yield on Cost"                          val={dripFinal.yieldOnCostPercent + '%'}             color="#F59E0B" />
          </div>
        </div>
      )}

      {/* ── INFLATION ── */}
      {tab === 'inflation' && (
        <div id="calc-inflation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Inputs</h2>
            <SliderRow id="inf-value" label="Cash Amount"       val={infVal}  set={setInfVal}  min={1000} max={100000} step={1000} prefix="$" />
            <SliderRow id="inf-rate"  label="Inflation Rate"    val={infRate} set={setInfRate} min={1}    max={8}      step={0.5}  suffix="%" />
            <SliderRow id="inf-years" label="Years"             val={infYrs}  set={setInfYrs}  min={1}    max={30}     step={1}    suffix=" yrs" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ResultCard id="inf-result-original" label="Today's Value"                     val={formatCurrency(infVal)}                    color="#0EA5E9" />
            <ResultCard id="inf-result-future"   label={`Real Value in ${infYrs} Years`}   val={formatCurrency(infFuture)}                color="#F59E0B" />
            <ResultCard id="inf-result-lost"     label="Purchasing Power Lost"              val={'-' + formatCurrency(infVal - infFuture)} color="#EF4444" />
            <div className="card" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
              <p style={{ fontSize: '0.82rem', color: '#92400E' }}>
                At {infRate}% inflation, ${infVal.toLocaleString()} today will only buy what {formatCurrency(infFuture)} buys now — that's why investing beats saving!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
