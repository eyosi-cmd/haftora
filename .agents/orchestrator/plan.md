# Project Plan: Haftora RAG Investing Chatbot ("Straw Hat Bot")

## Architecture
- Frontend: React / TypeScript app in `src/` (components in `src/components/`, entry point `src/App.tsx`).
- RAG & Services: `src/services/rag/` containing Knowledge Base, Semantic Search (TF-IDF/embeddings), Live NASDAQ Tick Data Injection, and Luffy Persona system prompt (`luffyPersona.ts`).
- UI: Floating Chatbot Widget (`src/components/ChatWidget.tsx`) with pirate styling mounted in `App.tsx`.
- Tests: `tests/fallback.test.ts` (and relevant unit/integration test suite).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Codebase Exploration | Examine structure, package.json, build scripts, tests | None | IN_PROGRESS |
| 2 | R1: RAG Engine & KB | Knowledge base, semantic search engine, live quote injection in `src/services/rag/` | M1 | PLANNED |
| 3 | R2: Luffy Persona | Luffy system prompt & financial guardrails in `src/services/rag/luffyPersona.ts` | M2 | PLANNED |
| 4 | R3: ChatWidget UI | Floating chat widget (`src/components/ChatWidget.tsx`) & integration in `App.tsx` | M2, M3 | PLANNED |
| 5 | E2E Testing & Audit | Verify build (`npm run build`), test suite (`tests/fallback.test.ts`), and Forensic Audit | M4 | PLANNED |
