// src/components/AuthModal.tsx
// Optional Netlify Identity Auth Modal — keeps site 100% publicly accessible
import React, { useEffect, useState } from 'react';
import netlifyIdentity, { User } from 'netlify-identity-widget';
import { User as UserIcon, LogOut, LogIn, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onUserChange?: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onUserChange }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      // Dynamic Netlify Identity endpoint init
      const identityApiUrl = window.location.hostname.includes('netlify.app')
        ? `${window.location.origin}/.netlify/identity`
        : 'https://haftora.netlify.app/.netlify/identity';

      // ── Unconditional stale token purge ───────────────────────────
      // GoTrue JWT secrets rotate whenever a new Netlify site instance
      // is provisioned. Always clear any cached auth tokens on startup
      // so users get a clean login prompt instead of a "Request ID" 401.
      localStorage.removeItem('gotrue.user');
      localStorage.removeItem('gotrue.token');
      // Also clear netlify-identity-widget's own namespace
      Object.keys(localStorage)
        .filter(k => k.startsWith('netlify-identity-'))
        .forEach(k => localStorage.removeItem(k));
      // ─────────────────────────────────────────────────────────────

      netlifyIdentity.init({
        APIUrl: identityApiUrl,
      });

      const user = netlifyIdentity.currentUser();
      setCurrentUser(user);
      if (onUserChange) onUserChange(user);

      netlifyIdentity.on('login', (u) => {
        setCurrentUser(u);
        if (onUserChange) onUserChange(u);
        netlifyIdentity.close();
      });

      netlifyIdentity.on('logout', () => {
        setCurrentUser(null);
        if (onUserChange) onUserChange(null);
      });
    } catch (err) {
      // Silently handle any initialization notices
    }

    return () => {
      try {
        netlifyIdentity.off('login');
        netlifyIdentity.off('logout');
      } catch {}
    };
  }, []);

  const handleOpenAuth = () => {
    netlifyIdentity.open('login');
  };

  const handleLogout = () => {
    netlifyIdentity.logout();
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 999, padding: '0.35rem 0.85rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065F46', fontFamily: "'Inter', sans-serif" }}>
            {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Member'}
          </span>
          <button
            onClick={handleLogout}
            title="Log Out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', padding: 2 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <button
          id="btn-open-login"
          onClick={handleOpenAuth}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 999, fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
        >
          <LogIn size={14} color="#0EA5E9" />
          <span>Log In / Sign Up</span>
        </button>
      )}
    </div>
  );
};
