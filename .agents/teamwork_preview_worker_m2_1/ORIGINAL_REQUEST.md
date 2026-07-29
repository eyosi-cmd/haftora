## 2026-07-28T23:38:41Z
You are Worker 1 for Milestone 2 (R1 & R2: Financial KB, TF-IDF RAG Engine, Live Quote Injection, and Luffy Persona).
Target directory: C:\Users\anonn\Desktop\haftora
Your working directory: C:\Users\anonn\Desktop\haftora\.agents\teamwork_preview_worker_m2_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:

1. **R1 - Knowledge Base Document (`src/services/rag/knowledgeBase.ts`)**:
   - Ensure comprehensive financial knowledge base chunks covering:
     - Core asset allocation (VTI, VOO, VXUS, QQQ, GOOGL, NVDA).
     - Tax-advantaged account rules (Roth IRA vs. 401(k) contribution limits, tax treatment, withdrawal rules).
     - Expense ratio math (calculating and comparing fee drag over 30 years, e.g. 0.03% vs 0.75% expense ratio impact on a $10,000 portfolio).
   - Export typed `KnowledgeChunk` interface and `FINANCIAL_KNOWLEDGE_BASE` array.

2. **R1 - TF-IDF RAG Engine & Live Quote Context (`src/services/rag/ragEngine.ts`)**:
   - Implement a lightweight TF-IDF / vector embedding semantic search engine:
     - Tokenize, compute Term Frequency (TF) and Inverse Document Frequency (IDF) or cosine similarity for query vs knowledge base chunks.
     - Select top N (e.g. top 2-3) relevant context chunks based on vector/TF-IDF similarity score.
   - Extract stock/ETF tickers dynamically from user query (e.g., VOO, VTI, VXUS, QQQ, GOOGL, NVDA, AAPL, MSFT, TSLA, SPY, SCHD, etc.).
   - Integrate live quote data: Call `fetchLiveQuote(ticker)` from `src/services/marketApi.ts` for detected tickers.
   - Dynamically synthesize the chatbot response using retrieved RAG context chunks, live quote data, and Luffy persona rules.

3. **R2 - Luffy / Straw Hat Pirate Persona & System Prompt (`src/services/rag/luffyPersona.ts`)**:
   - Export `LUFFY_SYSTEM_PROMPT` containing full persona description and financial guardrails:
     - Energetic, optimistic, adventurous pirate captain ("Straw Hat Bot / Captain Luffy of Financial Freedom") encouraging wealth building like hunting for One Piece treasure.
     - Financial Guardrails: Objective financial education, zero high-risk gambling/meme advice, citing knowledge base principles.
   - Export `STRAW_HAT_PERSONA` metadata and `formatLuffyResponse` wrapper.

4. **Build & Test Verification**:
   - Run `npm run build` to verify clean compilation.
   - Run `npx tsx tests/fallback.test.ts` to ensure zero regressions.

5. Write `changes.md` and `handoff.md` in your working directory `C:\Users\anonn\Desktop\haftora\.agents\teamwork_preview_worker_m2_1`.
6. Send a message to the orchestrator when finished.
