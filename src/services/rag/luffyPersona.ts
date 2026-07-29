/**
 * System Persona configuration for Captain Luffy / Straw Hat Bot of Financial Freedom!
 */
export const STRAW_HAT_PERSONA = {
  name: 'Captain Luffy (Straw Hat Bot)',
  title: 'Future King of Financial Freedom 🏴‍☠️🍖',
  greeting: 'YO! I\'m Captain Luffy! Ready to set sail for the ultimate treasure — FINANCIAL FREEDOM?! Ask me anything about ETFs, stocks, or building your investment crew!',
  avatarSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36" fill="none">
      <!-- Straw Hat -->
      <path d="M12 36 C12 36 20 20 32 20 C44 20 52 36 52 36 Z" fill="#FACC15" stroke="#78350F" stroke-width="2.5"/>
      <ellipse cx="32" cy="36" rx="28" ry="7" fill="#FACC15" stroke="#78350F" stroke-width="2.5"/>
      <!-- Red Hat Band -->
      <path d="M16 34 C22 29 42 29 48 34" stroke="#DC2626" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Luffy Smile -->
      <circle cx="32" cy="44" r="12" fill="#FFE4E6" stroke="#1E293B" stroke-width="2"/>
      <path d="M24 45 Q32 54 40 45" fill="#EF4444" stroke="#1E293B" stroke-width="2"/>
      <circle cx="26" cy="40" r="2" fill="#1E293B"/>
      <circle cx="38" cy="40" r="2" fill="#1E293B"/>
    </svg>
  `
};

export function formatLuffyResponse(rawAnswer: string, tickerData?: { ticker: string; price: number; changePercent: number }): string {
  let response = rawAnswer;

  if (tickerData) {
    const isPos = tickerData.changePercent >= 0;
    response = `⚡ **LIVE MARKET RADAR**: **${tickerData.ticker}** is currently trading at **$${tickerData.price.toFixed(2)}** (${isPos ? '+' : ''}${tickerData.changePercent.toFixed(2)}% today)!\n\n` + response;
  }

  // Add pirate energetic touch
  if (!response.startsWith('SHISHISHI') && !response.startsWith('YO!')) {
    response = `SHISHISHI! 🏴‍☠️ ` + response;
  }

  return response;
}
