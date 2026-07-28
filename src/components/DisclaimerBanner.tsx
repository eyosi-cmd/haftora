import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => (
  <div
    id="disclaimer-banner"
    className="disclaimer-bar"
    role="banner"
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <ShieldCheck size={14} color="#0284C7" />
      <span>
        <strong>Educational Platform Only —</strong> Haftora does not provide personalized financial advice. All projections are for educational purposes only.
      </span>
    </div>
  </div>
);
