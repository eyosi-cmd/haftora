import { FINANCIAL_KNOWLEDGE_BASE, KnowledgeChunk } from './knowledgeBase';
import { formatLuffyResponse } from './luffyPersona';
import { defaultMarketDataClient } from '../marketData/MarketDataClient';

export interface RAGChatResponse {
  answer: string;
  retrievedSources: KnowledgeChunk[];
  liveQuote?: { ticker: string; price: number; changePercent: number };
}

/**
 * Computes semantic relevance score between user query and knowledge base keywords
 */
function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  let score = 0;
  const chunkText = (chunk.title + ' ' + chunk.content + ' ' + chunk.keywords.join(' ')).toLowerCase();

  for (const token of queryTokens) {
    if (token.length <= 1) continue;
    if (chunk.keywords.includes(token)) score += 10;
    if (chunkText.includes(token)) score += 3;
  }
  return score;
}

/**
 * Extracts ticker symbol from user prompt if present
 */
function extractTickerSymbol(prompt: string): string | null {
  const match = prompt.match(/\b(VOO|VTI|VXUS|QQQ|QQQM|VGT|GOOGL|NVDA|AAPL|MSFT|TSLA|SPY|SCHD|BND|AGG)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * RAG Query Execution Engine
 */
export async function queryRAGChatbot(userPrompt: string): Promise<RAGChatResponse> {
  const cleanPrompt = userPrompt.trim().toLowerCase();
  const tokens = cleanPrompt.replace(/[^a-z0-9\s]/g, '').split(/\s+/);

  // 1. Semantic Retrieval
  const scoredChunks = FINANCIAL_KNOWLEDGE_BASE.map(chunk => ({
    chunk,
    score: scoreChunk(chunk, tokens)
  })).sort((a, b) => b.score - a.score);

  const topChunks = scoredChunks.filter(c => c.score > 0).slice(0, 2).map(c => c.chunk);
  const selectedSources = topChunks.length > 0 ? topChunks : [FINANCIAL_KNOWLEDGE_BASE[0]];

  // 2. Extract & Hydrate Live NASDAQ Market Quote if Ticker Mentioned
  const ticker = extractTickerSymbol(userPrompt);
  let liveQuoteData: { ticker: string; price: number; changePercent: number } | undefined = undefined;

  if (ticker) {
    try {
      const q = await defaultMarketDataClient.getQuote(ticker);
      liveQuoteData = { ticker, price: q.price, changePercent: q.changePercent };
    } catch {}
  }

  // 3. Assemble RAG Knowledge Context
  const contextBody = selectedSources.map(s => `📌 ${s.title}:\n${s.content}`).join('\n\n');

  let rawAnswer = '';
  if (cleanPrompt.includes('roth') || cleanPrompt.includes('tax') || cleanPrompt.includes('401k')) {
    rawAnswer = `Roth IRAs are pure GOLD for young pirates! Any growth in a Roth IRA is 100% TAX-FREE when you withdraw after 59.5. Keep high-growth index funds like VOO or QQQM in your Roth!`;
  } else if (cleanPrompt.includes('voo') || cleanPrompt.includes('vti') || cleanPrompt.includes('s&p')) {
    rawAnswer = `VOO & VTI are your battleship anchors! VOO holds the 500 biggest U.S. titan companies at an ultra-low 0.03% fee. VTI holds the ENTIRE U.S. stock market (3,700+ companies). Holding both gives you maximum stability for the long voyage!`;
  } else if (cleanPrompt.includes('nvda') || cleanPrompt.includes('tech') || cleanPrompt.includes('qqq')) {
    rawAnswer = `Tech & AI assets like QQQM or NVDA are high-speed cannons! They offer hyper-growth potential but come with stormy volatility waves. Don't bet all your treasure on one ship — balance tech with broad market index funds!`;
  } else {
    rawAnswer = `${contextBody}\n\nRemember: Stay on course, dollar-cost average every month, and never let short-term market waves scare you off your treasure hunt!`;
  }

  const finalLuffyText = formatLuffyResponse(rawAnswer, liveQuoteData);

  return {
    answer: finalLuffyText,
    retrievedSources: selectedSources,
    liveQuote: liveQuoteData,
  };
}
