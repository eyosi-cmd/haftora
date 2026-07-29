export interface KnowledgeChunk {
  id: string;
  category: 'core_principles' | 'etf_profiles' | 'stock_profiles' | 'tax_strategy' | 'expense_math';
  title: string;
  content: string;
  keywords: string[];
}

export const FINANCIAL_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'kb-001',
    category: 'core_principles',
    title: 'The Golden Rules of Core Asset Allocation & Compound Growth',
    content: `Building long-term wealth (the ultimate Grand Line treasure!) relies on sound core asset allocation: balancing broad-market Index ETFs (VOO, VTI, VXUS) with high-conviction growth assets (QQQ, GOOGL, NVDA). A core-and-explore strategy keeps 70-80% in low-cost total market index funds and 20-30% in tech/growth leaders. Key principles: 1) High Savings Rate, 2) Ultra-Low Expense Ratios (<0.15%), and 3) Uninterrupted Compound Growth over 10-30 years. Albert Einstein called compound interest the eighth wonder of the world — by reinvesting dividends and capturing market returns, your money grows exponentially.`,
    keywords: ['compound interest', 'wealth', 'savings rate', 'expense ratio', 'rules', 'basics', 'asset allocation', 'vti', 'voo', 'vxus', 'qqq', 'googl', 'nvda', 'boglehead']
  },
  {
    id: 'kb-002',
    category: 'etf_profiles',
    title: 'Broad Market Equity ETFs: VOO, VTI, VXUS',
    content: `VOO (Vanguard S&P 500 ETF) and VTI (Vanguard Total Stock Market ETF) are the foundational anchors of a Boglehead portfolio. VOO tracks the 500 largest U.S. companies with an ultra-low 0.03% expense ratio ($3/yr per $10k). VTI covers 3,700+ U.S. equities including mid and small-cap stocks with a 0.03% fee. Pair VOO or VTI with VXUS (Vanguard Total International Stock ETF, 0.07% fee) for total global diversification across developed and emerging markets outside the U.S.`,
    keywords: ['voo', 'vti', 'vxus', 's&p 500', 'total stock market', 'international', 'index etf', 'diversification', 'broad market']
  },
  {
    id: 'kb-003',
    category: 'etf_profiles',
    title: 'Tech & Growth Focused ETFs: QQQ, QQQM, VGT',
    content: `For aggressive growth exposure, QQQ & QQQM track the Nasdaq-100 index dominated by tech giants like Apple, Microsoft, NVIDIA, Amazon, and Alphabet. QQQM is the lower-cost retail twin of QQQ (0.15% fee vs 0.20%). VGT (Vanguard Information Technology ETF) offers pure-play U.S. tech sector exposure with a low 0.10% expense ratio. High potential long-term returns accompanied by higher short-term volatility.`,
    keywords: ['qqq', 'qqqm', 'vgt', 'tech', 'nasdaq', 'growth', 'technology', 'nasdaq 100']
  },
  {
    id: 'kb-004',
    category: 'stock_profiles',
    title: 'Megacap Growth Equities: GOOGL & NVDA',
    content: `NVIDIA (NVDA) is the premier hardware infrastructure leader powering global Artificial Intelligence (AI) compute, data centers, and CUDA software stacks. Alphabet (GOOGL) dominates search, YouTube monetization, Android, and Google Cloud AI. While individual stocks carry higher single-company risk than broad ETFs, top megacap tech leaders provide unmatched revenue scaling and moat advantages within a growth satellite allocation.`,
    keywords: ['nvda', 'googl', 'nvidia', 'google', 'alphabet', 'individual stock', 'ai', 'megacap']
  },
  {
    id: 'kb-005',
    category: 'tax_strategy',
    title: 'Tax-Advantaged Account Location Rules: Roth IRA vs 401(k) Contribution Limits & Tax Treatment',
    content: `Maximizing net returns requires understanding tax-advantaged account rules: 1) Roth IRA: Contributions are made with post-tax dollars up to $7,000/year (plus $1,000 catch-up if 50+). All capital gains and withdrawals are 100% TAX-FREE after age 59.5 and 5-year account holding. Principal contributions can be withdrawn anytime penalty-free! 2) 401(k) / Traditional IRA: Pre-tax contributions up to $23,000/year lower your current taxable income. Withdrawals after age 59.5 are taxed as ordinary income, with a 10% penalty if withdrawn early. Asset Location Rule: Place highest expected growth assets (e.g. QQQM, NVDA, VOO) in your Roth IRA to eliminate future capital gains tax drag!`,
    keywords: ['roth ira', '401k', 'tax', 'asset location', 'retirement', 'tax-free', 'contribution limits', 'tax treatment', 'withdrawal rules', '7000', '23000', '59.5', 'penalty']
  },
  {
    id: 'kb-006',
    category: 'expense_math',
    title: 'Expense Ratio Math & 30-Year Fee Drag Comparison',
    content: `Expense ratios silently eat away at portfolio growth due to compound fee drag. Consider a $10,000 initial portfolio invested for 30 years with an 8.0% annual gross return: With an ultra-low expense ratio of 0.03% (e.g. VOO or VTI), the net return is 7.97%, growing the portfolio to $99,357. With an active fund fee of 0.75%, the net return drops to 7.25%, resulting in $81,228. That 0.72% difference in fee drag destroys $18,129 (over 18% of total potential wealth!) paid out to fund managers instead of staying in your account. Keeping fees under 0.15% saves tens of thousands over your 30-year investment voyage.`,
    keywords: ['expense ratio', 'fee drag', 'math', '0.03%', '0.75%', '30 years', '10000', 'fees', 'comparison', 'fee impact', 'active vs passive']
  }
];

