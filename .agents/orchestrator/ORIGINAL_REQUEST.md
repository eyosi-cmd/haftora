# Original User Request

## Initial Request — 2026-07-28T23:35:54-04:00

Design, build, and integrate a real Retrieval-Augmented Generation (RAG) investing chatbot ("Straw Hat Bot") into the Haftora React/Node.js application. The bot features an adventurous, energetic "One Piece / Luffy" inspired personality, semantic knowledge base retrieval across ETFs/stocks, live NASDAQ tick data injection, and a pirate-captain styled UI avatar.

Working directory: `C:\Users\anonn\Desktop\haftora`
Integrity mode: `development`

## Requirements

### R1. Financial Knowledge Base & RAG Engine (`src/services/rag/`)
- **Knowledge Base Document**: Compile a comprehensive financial knowledge base document covering asset allocation (VTI, VOO, VXUS, QQQ, GOOGL, NVDA), tax-advantaged account rules (Roth IRA vs. 401k), and expense ratio math.
- **RAG Semantic Search**: Implement a lightweight vector/semantic retrieval engine (TF-IDF / vector embeddings) that matches user queries against the knowledge base and retrieves relevant context chunks.
- **Live NASDAQ Tick Data Context**: Inject live market quote data (current price, day change) alongside retrieved RAG context when evaluating ticker questions.

### R2. Luffy / Straw Hat Pirate Personality & Persona (`src/services/rag/luffyPersona.ts`)
- **Personality**: Energetic, optimistic, adventurous pirate captain ("Straw Hat Bot / Captain Luffy of Financial Freedom") who encourages wealth building like hunting for One Piece treasure.
- **Financial Guardrails**: Objective financial education, zero high-risk gambling/meme advice, citing knowledge base principles.

### R3. React Floating Chatbot Widget (`src/components/ChatWidget.tsx`)
- **Visual Design**: Pirate/maritime themed floating chat widget with a custom Luffy straw hat icon badge, energetic greeting, message history, typing indicators, and quick suggestion chips.
- **Live Integration**: Connect directly to backend RAG & live quote service with zero mock data.

## Acceptance Criteria

### Functionality & Tests
- [ ] `src/services/rag/` created with Knowledge Base, Semantic RAG Engine, and Luffy Persona system prompt.
- [ ] Floating `ChatWidget.tsx` component mounted globally in `App.tsx` with Luffy straw hat styling.
- [ ] Real-time quote data for requested tickers (e.g. `VOO`, `NVDA`, `AAPL`) dynamically injected into chat responses.
- [ ] Production build (`npm run build`) and test suite (`tests/fallback.test.ts`) pass cleanly with 0 errors.
