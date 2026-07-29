export interface KnowledgeChunk {
  id: string;
  category: 'core_principles' | 'etf_profiles' | 'stock_profiles' | 'tax_strategy';
  title: string;
  content: string;
  keywords: string[];
}

export const FINANCIAL_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'kb-001',
    category: 'core_principles',
    title: 'The Golden Rules of Wealth Accumulation & Compound Interest',
    content: `Building long-term wealth (the ultimate Grand Line treasure!) relies on three principles: 1) High Savings Rate, 2) Low Expense Ratios (<0.15%), and 3) Uninterrupted Compound Growth over 10-30 years. Albert Einstein called compound interest the eighth wonder of the world. By reinvesting dividends and capturing market returns via low-cost index funds, your money grows exponentially.`,
    keywords: ['compound interest', 'wealth', 'savings rate', 'expense ratio', 'rules', 'basics']
  },
  {
    id: 'kb-002',
    category: 'etf_profiles',
    title: 'Broad Market Equity ETFs: VOO, VTI, VXUS',
    content: `VOO (Vanguard S&P 500 ETF) and VTI (Vanguard Total Stock Market ETF) are the foundational anchors of a Boglehead portfolio. VOO tracks the 500 largest U.S. companies with an ultra-low 0.03% expense ratio ($3/yr per $10k). VTI covers 3,700+ U.S. equities including mid and small-cap stocks. Pair VOO or VTI with VXUS (Vanguard Total International Stock ETF, 0.07% fee) for total global diversification across developed and emerging markets outside the U.S.`,
    keywords: ['voo', 'vti', 'vxus', 's&p 500', 'total stock market', 'international', 'index etf']
  },
  {
    id: 'kb-003',
    category: 'etf_profiles',
    title: 'Tech & Growth Focused ETFs: QQQ, QQQM, VGT',
    content: `For aggressive growth exposure, QQQ & QQQM track the Nasdaq-100 index dominated by tech giants like Apple, Microsoft, NVIDIA, Amazon, and Alphabet. QQQM is the lower-cost retail twin of QQQ (0.15% fee vs 0.20%). VGT (Vanguard Information Technology ETF) offers pure-play U.S. tech sector exposure with a low 0.10% expense ratio. High potential returns accompanied by higher volatility.`,
    keywords: ['qqq', 'qqqm', 'vgt', 'tech', 'nasdaq', 'growth', 'technology']
  },
  {
    id: 'kb-004',
    category: 'stock_profiles',
    title: 'Megacap Growth Equities: GOOGL & NVDA',
    content: `NVIDIA (NVDA) is the premier hardware infrastructure leader powering global Artificial Intelligence (AI) compute, data centers, and CUDA software stacks. Alphabet (GOOGL) dominates search, YouTube monetization, Android, and Google Cloud AI. While individual stocks carry higher single-company risk than broad ETFs, top megacap tech leaders provide unmatched revenue scaling and moat advantages.`,
    keywords: ['nvda', 'googl', 'nvidia', 'google', 'alphabet', 'individual stock', 'ai']
  },
  {
    id: 'kb-005',
    category: 'tax_strategy',
    title: 'Tax-Advantaged Account Location Rules: Roth IRA vs 401(k) vs Taxable',
    content: `Maximizing net returns requires proper asset location: 1) Roth IRA: Place your highest expected growth assets (e.g. QQQM, NVDA, VOO) here because all capital gains and withdrawals are 100% TAX-FREE after age 59.5! 2) 401(k) / Traditional IRA: Great for pre-tax deduction and core broad market index funds. 3) Taxable Brokerage: Best for municipal bonds and tax-efficient broad stock ETFs (VOO/VTI) utilizing qualified dividend tax rates.`,
    keywords: ['roth ira', '401k', 'tax', 'asset location', 'retirement', 'tax-free']
  }
];
