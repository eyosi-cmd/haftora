import { FINANCIAL_KNOWLEDGE_BASE, KnowledgeChunk } from './knowledgeBase';
import { formatHaffyResponse, LUFFY_SYSTEM_PROMPT } from './luffyPersona';
import { fetchLiveQuote } from '../marketApi';

export interface RAGChatResponse {
  answer: string;
  retrievedSources: KnowledgeChunk[];
  liveQuote?: { ticker: string; price: number; changePercent: number };
}

// Stop words set to filter out noise tokens
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
  'will', 'would', 'should', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
  'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'how', 'why', 'where', 'when', 'me', 'us', 'him', 'them'
]);

/**
 * Tokenizes text into lowercase terms, removing punctuation and stop words.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.%$]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));
}

/**
 * Compute Term Frequency (TF) vector for a token array: TF(t, d) = count(t, d) / total_tokens(d)
 */
export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  for (const [token, count] of tf.entries()) {
    tf.set(token, count / tokens.length);
  }
  return tf;
}

/**
 * Pre-processed document collection representation for TF-IDF scoring.
 */
interface ProcessedDoc {
  chunk: KnowledgeChunk;
  tokens: string[];
  tf: Map<string, number>;
}

// Prepare document tokens with title/keyword boosting
function prepareDocs(): ProcessedDoc[] {
  return FINANCIAL_KNOWLEDGE_BASE.map(chunk => {
    // Boost title and keywords by including them with extra weight in the document representation
    const text = `${chunk.title} ${chunk.title} ${chunk.content} ${chunk.keywords.join(' ')} ${chunk.keywords.join(' ')}`;
    const tokens = tokenize(text);
    const tf = computeTF(tokens);
    return { chunk, tokens, tf };
  });
}

/**
 * TF-IDF Vector Search Engine: calculates cosine similarity between user query vector and knowledge base chunk vectors.
 */
export function rankChunksWithTFIDF(userQuery: string, docs: ProcessedDoc[] = prepareDocs()): { chunk: KnowledgeChunk; score: number }[] {
  const queryTokens = tokenize(userQuery);
  if (queryTokens.length === 0) {
    return docs.map(d => ({ chunk: d.chunk, score: 0 }));
  }

  const queryTF = computeTF(queryTokens);
  const numDocs = docs.length;

  // 1. Calculate Document Frequency (DF) for each unique term
  const dfMap = new Map<string, number>();
  for (const doc of docs) {
    const uniqueTermsInDoc = new Set(doc.tf.keys());
    for (const term of uniqueTermsInDoc) {
      dfMap.set(term, (dfMap.get(term) || 0) + 1);
    }
  }

  // 2. Calculate Inverse Document Frequency (IDF) smoothed: ln(1 + N / df)
  const idfMap = new Map<string, number>();
  for (const [term, df] of dfMap.entries()) {
    idfMap.set(term, Math.log(1 + numDocs / df));
  }

  // 3. Compute Query TF-IDF Vector
  const queryTFIDF = new Map<string, number>();
  let queryNormSq = 0;
  for (const [term, tfVal] of queryTF.entries()) {
    const idfVal = idfMap.get(term) || Math.log(1 + numDocs / 1);
    const tfidf = tfVal * idfVal;
    queryTFIDF.set(term, tfidf);
    queryNormSq += tfidf * tfidf;
  }
  const queryNorm = Math.sqrt(queryNormSq);

  // 4. Compute Cosine Similarity for each document
  return docs.map(doc => {
    let dotProduct = 0;
    let docNormSq = 0;

    for (const [term, docTFVal] of doc.tf.entries()) {
      const idfVal = idfMap.get(term) || 0;
      const docTFIDF = docTFVal * idfVal;
      docNormSq += docTFIDF * docTFIDF;

      if (queryTFIDF.has(term)) {
        dotProduct += (queryTFIDF.get(term)! * docTFIDF);
      }
    }

    const docNorm = Math.sqrt(docNormSq);
    let similarity = (queryNorm > 0 && docNorm > 0) ? (dotProduct / (queryNorm * docNorm)) : 0;

    // Direct keyword match boost
    for (const qToken of queryTokens) {
      if (doc.chunk.keywords.includes(qToken)) {
        similarity += 0.15;
      }
    }

    return { chunk: doc.chunk, score: similarity };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Known ticker dictionary for extraction from user prompts
 */
const TICKER_LIST = [
  'VOO', 'VTI', 'VXUS', 'QQQ', 'QQQM', 'VGT', 'GOOGL', 'NVDA',
  'AAPL', 'MSFT', 'TSLA', 'SPY', 'SCHD', 'BND', 'AGG', 'IVV'
];

/**
 * Extracts stock/ETF tickers dynamically from user query
 */
export function extractTickerSymbol(prompt: string): string | null {
  const upperPrompt = prompt.toUpperCase();
  for (const ticker of TICKER_LIST) {
    const regex = new RegExp(`\\b${ticker}\\b`, 'i');
    if (regex.test(prompt)) {
      return ticker;
    }
  }

  // Fallback uppercase regex match for standard ticker pattern
  const match = upperPrompt.match(/\b([A-Z]{2,5})\b/);
  if (match && TICKER_LIST.includes(match[1])) {
    return match[1];
  }
  return null;
}

export function isGreetingPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  return /^(hi|hello|hey|hiya|greetings|good morning|good afternoon|good evening)\b/.test(normalized);
}

export function getHaffyGreeting(): string {
  return 'Hello! How can I help you today? I’m Haffy Two, your investing assistant for ETFs, retirement planning, and long-term wealth building.';
}

/**
 * Synthesizes the final chatbot response based on user prompt, retrieved RAG chunks, and live quote data.
 */
function synthesizeRAGResponse(
  userPrompt: string,
  topChunks: KnowledgeChunk[],
  liveQuoteData?: { ticker: string; price: number; changePercent: number }
): string {
  const cleanPrompt = userPrompt.toLowerCase();
  const contextSummary = topChunks.map(c => `📌 **${c.title}**:\n${c.content}`).join('\n\n');

  let body = '';

  // Topic specific synthesis
  if (cleanPrompt.includes('roth') || cleanPrompt.includes('401k') || cleanPrompt.includes('tax')) {
    body = `Roth IRAs and 401(k)s are key tools for long-term tax-efficient investing.\n\n` +
      `• **Roth IRA**: Contribute post-tax dollars and enjoy tax-free growth and withdrawals in retirement.\n` +
      `• **401(k)**: Contributions are often pre-tax, reducing your taxable income today, but withdrawals are taxed later.\n\n` +
      `💡 **Smart strategy**: Use a Roth for high-growth assets and a 401(k) for tax-deferral on reliable core holdings.`;
  } else if (cleanPrompt.includes('expense') || cleanPrompt.includes('fee') || cleanPrompt.includes('drag') || cleanPrompt.includes('0.03') || cleanPrompt.includes('0.75')) {
    body = `Fees can quietly reduce your long-term investment returns, so low costs matter.\n\n` +
      `• **0.03% expense ratio** (VOO/VTI) is extremely low and preserves more growth.\n` +
      `• **0.75% active fund fee** can reduce long-term results significantly.\n\n` +
      `💥 Over decades, even small fee differences can cost tens of thousands of dollars. Choose low-cost index funds when possible.`;
  } else if (cleanPrompt.includes('voo') || cleanPrompt.includes('vti') || cleanPrompt.includes('vxus') || cleanPrompt.includes('s&p') || cleanPrompt.includes('allocation')) {
    body = `Broad-market index funds are a strong foundation for diversified portfolios.\n\n` +
      `• **VOO** tracks the S&P 500 large-cap U.S. market.\n` +
      `• **VTI** covers the total U.S. equity market across large, mid, and small caps.\n` +
      `• **VXUS** adds international equity exposure.\n\n` +
      `A balanced mix of these funds provides broad diversification and low cost.`;
  } else if (cleanPrompt.includes('nvda') || cleanPrompt.includes('googl') || cleanPrompt.includes('qqq') || cleanPrompt.includes('tech')) {
    body = `Technology and AI companies can offer strong growth, but they also carry higher volatility.\n\n` +
      `• **QQQM / QQQ** tracks large-cap U.S. tech and growth companies.\n` +
      `• **NVDA & GOOGL** are leaders in AI, cloud, and platform infrastructure.\n\n` +
      `For most investors, these can be useful as a smaller satellite allocation rather than the core of a portfolio.`;
  } else {
    body = `Here are the most useful concepts I found for your question:\n\n${contextSummary}\n\n` +
      `Focus on consistent investing, low costs, and a long-term perspective to build wealth over time.`;
  }

  return body;
}

/**
 * RAG Query Execution Engine
 */
export async function queryRAGChatbot(userPrompt: string): Promise<RAGChatResponse> {
  // 1. Semantic Retrieval via TF-IDF Vector Engine
  const docs = prepareDocs();
  const ranked = rankChunksWithTFIDF(userPrompt, docs);
  const topScored = ranked.filter(r => r.score > 0).slice(0, 3);

  // Fallback to top 2 default chunks if no score > 0
  const selectedSources = topScored.length > 0 ? topScored.map(r => r.chunk) : [FINANCIAL_KNOWLEDGE_BASE[0], FINANCIAL_KNOWLEDGE_BASE[1]];

  // 2. Handle simple greetings first so Haffy Two responds immediately with a friendly offer to help.
  if (isGreetingPrompt(userPrompt)) {
    return {
      answer: getHaffyGreeting(),
      retrievedSources: [],
      liveQuote: undefined,
    };
  }

  // 3. Extract & Hydrate Live Market Quote if Ticker Mentioned
  const ticker = extractTickerSymbol(userPrompt);
  let liveQuoteData: { ticker: string; price: number; changePercent: number } | undefined = undefined;

  if (ticker) {
    try {
      const q = await fetchLiveQuote(ticker);
      liveQuoteData = {
        ticker: q.ticker,
        price: q.price,
        changePercent: q.changePercent
      };
    } catch (err) {
      console.warn(`[RAG Engine] Failed to fetch live quote for ${ticker}:`, err);
    }
  }

  // 3. Synthesize Response using retrieved RAG context, quote data, and Haffy Bot persona
  const rawBody = synthesizeRAGResponse(userPrompt, selectedSources, liveQuoteData);
  const finalAnswer = formatHaffyResponse(rawBody, userPrompt, liveQuoteData);

  return {
    answer: finalAnswer,
    retrievedSources: selectedSources,
    liveQuote: liveQuoteData,
  };
}

