# Project Plan: Haftora RAG Investing Chatbot ("Straw Hat Bot")

## Architecture
- Frontend: React / TypeScript app in `src/` (components in `src/components/`, entry point `src/App.tsx`).
- RAG & Services: `src/services/rag/` containing Knowledge Base (`knowledgeBase.ts`), Semantic Search / RAG Engine (`ragEngine.ts`), Live NASDAQ Tick Data Injection, and Luffy Persona system prompt (`luffyPersona.ts`).
- UI: Floating Chatbot Widget (`src/components/ChatWidget.tsx`) with pirate styling mounted globally in `App.tsx`.
- Tests: `tests/fallback.test.ts` and build scripts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Codebase Exploration | Examine structure, package.json, build scripts, tests, services, UI layout | None | DONE |
| 2 | R1 & R2: RAG Engine, KB & Luffy Persona | Enhance `knowledgeBase.ts` (add expense ratio math chunk), implement TF-IDF vector search & live quote injection in `ragEngine.ts`, export `LUFFY_SYSTEM_PROMPT` & guardrails in `luffyPersona.ts` | M1 | IN_PROGRESS |
| 3 | R3: ChatWidget UI | Refine floating chat widget (`src/components/ChatWidget.tsx`) pirate styling, responsive mobile bottom navbar offset, mounted in `App.tsx` | M2 | PLANNED |
| 4 | Verification & Forensic Audit | Run `npx tsx tests/fallback.test.ts`, `npm run build`, Reviewers, Challengers, and Forensic Audit | M3 | PLANNED |
