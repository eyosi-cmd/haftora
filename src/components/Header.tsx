import React, { useState } from 'react';
import { NavTab } from '../types';
import {
  TrendingUp,
  BookOpen,
  Search,
  Calculator,
  PieChart,
  Flame,
  User,
  AlertTriangle,
  Target,
  Menu,
  X,
  BarChart2
} from 'lucide-react';

import { AuthModal } from './AuthModal';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  streakDays: number;
}

const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',          label: 'Home',        icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'learn',              label: 'Learn',       icon: <BookOpen className="w-5 h-5" /> },
  { id: 'etf-explorer',       label: 'ETFs',        icon: <BarChart2 className="w-5 h-5" /> },
  { id: 'market-search',      label: 'Search',      icon: <Search className="w-5 h-5" /> },
  { id: 'retirement-planner', label: 'Planner',     icon: <Target className="w-5 h-5" /> },
  { id: 'portfolio-builder',  label: 'Portfolio',   icon: <PieChart className="w-5 h-5" /> },
  { id: 'calculators',        label: 'Calculate',   icon: <Calculator className="w-5 h-5" /> },
  { id: 'mistakes',           label: 'Mistakes',    icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'profile',            label: 'Profile',     icon: <User className="w-5 h-5" /> },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, streakDays }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(() => {
    return localStorage.getItem('haftora_pwa_banner_dismissed') !== 'true';
  });

  const dismissPwaBanner = () => {
    localStorage.setItem('haftora_pwa_banner_dismissed', 'true');
    setShowPwaBanner(false);
  };

  const handleNav = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── MOBILE PWA INSTALLATION BANNER ── */}
      {showPwaBanner && (
        <div
          id="pwa-install-banner"
          style={{
            background: 'linear-gradient(90deg, #0284C7 0%, #0EA5E9 100%)',
            color: 'white',
            padding: '0.45rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: 10,
            borderBottom: '1px solid #7DD3FC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '1rem' }}>📲</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>Add Haftora to Home Screen</strong> for 1-tap access & offline learning!
            </span>
          </div>
          <button
            onClick={dismissPwaBanner}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header
        id="app-header"
        style={{
          background: 'white',
          borderBottom: '1.5px solid #BAE6FD',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 12px rgba(14,165,233,0.08)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button
            id="nav-home"
            onClick={() => handleNav('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Haftora home"
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(14,165,233,0.4)'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#0C1A27', letterSpacing: '-0.03em' }}>
              Haftora
            </span>
          </button>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: 4 }} className="desktop-nav">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.45rem 0.9rem',
                    borderRadius: 999,
                    border: isActive ? '1.5px solid #0EA5E9' : '1.5px solid transparent',
                    background: isActive ? '#E0F2FE' : 'transparent',
                    color: isActive ? '#0284C7' : '#64748B',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side: streak + auth + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Streak pill */}
            <div
              id="streak-badge"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#FFFBEB', border: '1.5px solid #FCD34D',
                borderRadius: 999, padding: '0.35rem 0.9rem',
                color: '#B45309', fontSize: '0.78rem', fontWeight: 700,
              }}
            >
              <Flame size={14} color="#F59E0B" fill="#F59E0B" />
              <span>{streakDays} Day Streak</span>
            </div>

            {/* Optional Netlify Auth Button */}
            <AuthModal />

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
              className="mobile-menu-btn"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div
            id="mobile-nav-menu"
            style={{
              background: 'white',
              borderTop: '1px solid #BAE6FD',
              padding: '0.75rem 1rem 1rem',
              display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8,
            }}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.7rem 1rem',
                    borderRadius: 12,
                    border: isActive ? '1.5px solid #0EA5E9' : '1.5px solid #E0F2FE',
                    background: isActive ? '#E0F2FE' : '#F0F9FF',
                    color: isActive ? '#0284C7' : '#475569',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── BOTTOM TAB BAR (Mobile only) ── */}
      <nav
        id="bottom-tab-bar"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'white',
          borderTop: '1.5px solid #BAE6FD',
          display: 'grid',
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
          boxShadow: '0 -4px 24px rgba(14,165,233,0.1)',
        }}
        className="bottom-tab-bar"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              onClick={() => handleNav(item.id)}
              aria-label={item.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '0.5rem 0.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? '#0EA5E9' : '#94A3B8',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.18s' }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500, fontFamily: "'Inter', sans-serif" }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0EA5E9', marginTop: -2 }} />
              )}
            </button>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .bottom-tab-bar { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
};
