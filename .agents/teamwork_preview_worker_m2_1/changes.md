# Summary of Changes — Milestone 2 (R1 & R2)

## Files Modified / Added

1. **`src/services/rag/knowledgeBase.ts`**
   - Expanded `KnowledgeChunk` interface category union to include `'expense_math'`.
   - Updated `FINANCIAL_KNOWLEDGE_BASE` array with 6 comprehensive knowledge chunks covering:
     - Core asset allocation (VTI, VOO, VXUS, QQQ, GOOGL, NVDA).
     - Tax-advantaged account location rules (Roth IRA vs 401(k) contribution limits: $7,000 vs $23,000, tax treatment, withdrawal rules after age 59.5).
     - Expense ratio math (30-year fee drag comparison of 0.03% vs 0.75% expense ratio on a $10,000 portfolio: $99,357 vs $81,228, losing over $18,100 to fee drag).

2. **`src/services/rag/luffyPersona.ts`**
   - Exported `LUFFY_SYSTEM_PROMPT` containing complete persona voice, pirate metaphors, and financial education guardrails (objective education, zero meme/gambling advice, knowledge base grounding).
   - Preserved and exported `STRAW_HAT_PERSONA` metadata (name, title, greeting, avatar SVG).
   - Enhanced `formatLuffyResponse` wrapper for market radar badge formatting and pirate laugh prefixing ("SHISHISHI! 🏴‍☠️").

3. **`src/services/rag/ragEngine.ts`**
   - Implemented lightweight TF-IDF / vector embedding semantic search engine:
     - Tokenization, stop-word filtering (`tokenize`).
     - Term Frequency computation (`computeTF`).
     - Inverse Document Frequency calculation ($IDF(t) = \ln(1 + N / DF(t))$) and Cosine Similarity vector search (`rankChunksWithTFIDF`).
   - Integrated dynamic ticker extraction (`extractTickerSymbol`) for tickers like VOO, VTI, VXUS, QQQ, GOOGL, NVDA, AAPL, MSFT, TSLA, SPY, SCHD, etc.
   - Integrated real-time quote hydration by invoking `fetchLiveQuote(ticker)` from `src/services/marketApi.ts`.
   - Implemented dynamic response synthesis combining retrieved top RAG sources, live quote data, and Captain Luffy persona framing.

4. **`tests/rag.test.ts`**
   - Created comprehensive RAG test suite covering Knowledge Base completeness, TF-IDF ranking accuracy, ticker extraction, Luffy persona exports, and end-to-end RAG query execution (15/15 tests passing).

## Verification Results

- `npm run build`: Pass (Clean compilation with Vite bundle generation).
- `npx tsx tests/fallback.test.ts`: Pass (3/3 tests passing, zero regressions).
- `npx tsx tests/rag.test.ts`: Pass (15/15 tests passing).
