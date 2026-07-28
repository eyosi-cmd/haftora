import React from 'react';
import { TrendingUp, Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer
    id="app-footer"
    style={{
      background: 'white',
      borderTop: '1.5px solid #BAE6FD',
      padding: '2.5rem 1.5rem',
      marginTop: 'auto',
    }}
  >
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color="white" />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#0C1A27' }}>Haftora</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Investing Made Simple</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {['Learning Center', 'ETF Explorer', 'Retirement Planner', 'Calculators'].map((l) => (
            <span key={l} style={{ fontSize: '0.85rem', color: '#64748B', cursor: 'pointer', fontWeight: 500 }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{
        background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14,
        padding: '1rem 1.25rem', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0284C7', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={15} />
          <span>Educational Disclaimer & Compliance Notice</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
          Haftora is strictly an educational investing platform and financial goal simulator. Content, historical returns, and projections shown are for instructional purposes only and do not constitute an offer or recommendation to buy or sell any security. Past investment performance does not guarantee future results. Always consult a certified financial planner (CFP) or registered investment advisor (RIA) for personalized guidance.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>© {new Date().getFullYear()} Haftora Education. All rights reserved.</span>
        <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
          Built with <Heart size={12} color="#EF4444" fill="#EF4444" /> for beginner investors
        </span>
      </div>
    </div>
  </footer>
);
