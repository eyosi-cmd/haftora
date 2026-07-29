import { FINANCIAL_KNOWLEDGE_BASE } from '../../src/services/rag/knowledgeBase';
import { LUFFY_SYSTEM_PROMPT, STRAW_HAT_PERSONA, formatLuffyResponse } from '../../src/services/rag/luffyPersona';
import { queryRAGChatbot, extractTickerSymbol, tokenize, computeTF, rankChunksWithTFIDF } from '../../src/services/rag/ragEngine';

interface StressTestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: StressTestResult[] = [];

function record(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${category}] ${status} - ${name}: ${details}`);
}

async function runEmpiricalStressSuite() {
  console.log('====================================================');
  console.log('🚀 EMPIRICAL STRESS TEST SUITE - MILESTONE 2');
  console.log('====================================================\n');

  // ==========================================
  // SECTION 1: TICKER EXTRACTION STRESS TESTS
  // ==========================================
  console.log('--- 1. TICKER EXTRACTION ACCURACY & EDGE CASES ---');
  
  // Single standard tickers
  const singleTests = [
    { input: "Should I buy VOO?", expected: "VOO" },
    { input: "What about GOOGL?", expected: "GOOGL" },
    { input: "Is NVDA a good investment?", expected: "NVDA" },
    { input: "Tell me about vti", expected: "VTI" },
    { input: "How is qqqm performing?", expected: "QQQM" }
  ];

  for (const t of singleTests) {
    const extracted = extractTickerSymbol(t.input);
    record('Ticker Extraction', `Single ticker: "${t.input}"`, extracted === t.expected, `Got: ${extracted}, Expected: ${t.expected}`);
  }

  // Multi-ticker prompts
  const multiTests = [
    { input: "Should I buy VOO and NVDA?", expectedFirst: "VOO", containsAll: ["VOO", "NVDA"] },
    { input: "Compare VOO vs QQQ and GOOGL", expectedFirst: "VOO", containsAll: ["VOO", "QQQ", "GOOGL"] }
  ];

  for (const t of multiTests) {
    const extracted = extractTickerSymbol(t.input);
    // Note: current implementation extractTickerSymbol only returns a SINGLE ticker string or null!
    const isSingleReturnOnly = typeof extracted === 'string';
    record('Ticker Extraction', `Multi-ticker prompt: "${t.input}"`, extracted === t.expectedFirst, 
      `Extracted single ticker: ${extracted} (Notice: Only 1 ticker returned out of multiple present)`);
  }

  // False positive English words matching ticker list
  const falsePositives = [
    { input: "I don't want to SPY on anyone.", tickerInList: "SPY" },
    { input: "How to BND my portfolio together?", tickerInList: "BND" }
  ];

  for (const t of falsePositives) {
    const extracted = extractTickerSymbol(t.input);
    const triggersFalsePos = extracted === t.tickerInList;
    record('Ticker Extraction', `English word collision: "${t.input}"`, !triggersFalsePos, 
      `Extracted: ${extracted}. ${triggersFalsePos ? 'FAIL: Common English verb/word triggered stock quote lookup!' : 'PASS'}`);
  }

  // No ticker prompts
  const noTickerTests = [
    "How does a Roth IRA work?",
    "What is tax loss harvesting?",
    "Explain expense ratios over 30 years"
  ];

  for (const input of noTickerTests) {
    const extracted = extractTickerSymbol(input);
    record('Ticker Extraction', `No ticker: "${input}"`, extracted === null, `Got: ${extracted}, Expected: null`);
  }


  // ==========================================
  // SECTION 2: TF-IDF RETRIEVAL & VECTOR ENGINE
  // ==========================================
  console.log('\n--- 2. TF-IDF VECTOR SEARCH ENGINE & RETRIEVAL ---');

  // Tokenizer edge cases
  const tokenTest1 = tokenize("401(k)");
  record('Tokenization', 'Punctuation in 401(k)', tokenTest1.includes('401') && tokenTest1.includes('k'), `Tokens for "401(k)": ${JSON.stringify(tokenTest1)}`);

  const tokenTest2 = tokenize("401k");
  record('Tokenization', 'No punctuation in 401k', tokenTest2.includes('401k'), `Tokens for "401k": ${JSON.stringify(tokenTest2)}`);

  record('Tokenization', '401(k) vs 401k token alignment', JSON.stringify(tokenTest1) !== JSON.stringify(tokenTest2),
    `Notice: "401(k)" tokenizes to ["401", "k"] while "401k" tokenizes to ["401k"]`);

  // Retrieval Queries
  const retrievalTests = [
    { query: "expense ratio math 0.03% vs 0.75%", expectedCategory: "expense_math" },
    { query: "Roth IRA 401k contribution limit 7000 23000", expectedCategory: "tax_strategy" },
    { query: "broad market index etf voo vti vxus", expectedCategory: "etf_profiles" },
    { query: "tech growth QQQ NVDA GOOGL", expectedCategory: "stock_profiles" },
    { query: "compound interest savings rate", expectedCategory: "core_principles" }
  ];

  for (const t of retrievalTests) {
    const ranked = rankChunksWithTFIDF(t.query);
    const topChunk = ranked[0]?.chunk;
    const pass = topChunk?.category === t.expectedCategory;
    record('TF-IDF Retrieval', `Query: "${t.query}"`, pass, `Top match: [${topChunk?.category}] ${topChunk?.title} (score: ${ranked[0]?.score.toFixed(3)})`);
  }

  // Mixed Query / Edge Case Retrieval
  const mixedQuery = "What is the expense ratio fee drag in a Roth IRA?";
  const rankedMixed = rankChunksWithTFIDF(mixedQuery);
  console.log(`[TF-IDF Retrieval] Mixed Query "${mixedQuery}":`);
  rankedMixed.forEach((r, idx) => console.log(`   Rank ${idx+1}: [${r.chunk.category}] ${r.chunk.title} (score: ${r.score.toFixed(3)})`));

  // Empty / Noise queries
  const emptyRank = rankChunksWithTFIDF("");
  record('TF-IDF Retrieval', 'Empty query ranking', emptyRank.every(r => r.score === 0), `All scores zero for empty string: ${emptyRank.every(r => r.score === 0)}`);

  const stopWordOnlyRank = rankChunksWithTFIDF("the and or of to in");
  record('TF-IDF Retrieval', 'Stop word only query ranking', stopWordOnlyRank.every(r => r.score === 0), `All scores zero for stop-word query: ${stopWordOnlyRank.every(r => r.score === 0)}`);


  // ==========================================
  // SECTION 3: KNOWLEDGE BASE MATH & CONTENT ACCURACY
  // ==========================================
  console.log('\n--- 3. KNOWLEDGE BASE ACCURACY & MATH VERIFICATION ---');

  // Verify Expense Ratio Math in kb-006
  const kbExpense = FINANCIAL_KNOWLEDGE_BASE.find(c => c.id === 'kb-006');
  if (kbExpense) {
    const P = 10000;
    const years = 30;
    const grossReturn = 0.08;
    const lowFee = 0.0003; // 0.03%
    const highFee = 0.0075; // 0.75%

    const fvLow = P * Math.pow(1 + (grossReturn - lowFee), years);
    const fvHigh = P * Math.pow(1 + (grossReturn - highFee), years);
    const diff = fvLow - fvHigh;
    const pctLost = (diff / fvLow) * 100;

    record('Math Verification', '0.03% Fee 30yr FV ($99,357)', Math.round(fvLow) === 99357, `Calculated: $${fvLow.toFixed(2)}, KB states: $99,357`);
    record('Math Verification', '0.75% Fee 30yr FV ($81,228)', Math.round(fvHigh) === 81228, `Calculated: $${fvHigh.toFixed(2)}, KB states: $81,228`);
    record('Math Verification', 'Fee Drag Wealth Lost ($18,129)', Math.round(diff) === 18129, `Calculated difference: $${diff.toFixed(2)}, KB states: $18,129`);
    record('Math Verification', 'Percentage of potential wealth lost (>18%)', pctLost > 18.0 && pctLost < 18.5, `Calculated % lost: ${pctLost.toFixed(2)}%, KB states over 18%`);
  } else {
    record('Math Verification', 'kb-006 existence', false, 'kb-006 chunk missing!');
  }

  // Verify Tax Rules in kb-005
  const kbTax = FINANCIAL_KNOWLEDGE_BASE.find(c => c.id === 'kb-005');
  if (kbTax) {
    record('Tax Rules', 'Roth IRA contribution limit $7,000', kbTax.content.includes('$7,000'), 'Includes $7,000 limit');
    record('Tax Rules', '401(k) contribution limit $23,000', kbTax.content.includes('$23,000'), 'Includes $23,000 limit');
    record('Tax Rules', 'Age threshold 59.5', kbTax.content.includes('59.5'), 'Includes 59.5 age threshold');
  }


  // ==========================================
  // SECTION 4: END-TO-END SYNTHESIS & HARDCODED OVERRIDE BEHAVIOR
  // ==========================================
  console.log('\n--- 4. END-TO-END RAG SYNTHESIS & BEHAVIOR ---');

  // Check query syntheses
  const testQueries = [
    { query: "Should I buy VOO and NVDA?", checkQuote: true, checkLuffy: true },
    { query: "What about GOOGL?", checkQuote: true, checkLuffy: true },
    { query: "How do Roth IRAs compare to 401k?", checkQuote: false, checkLuffy: true },
    { query: "Explain 0.03% vs 0.75% expense ratios over 30 years", checkQuote: false, checkLuffy: true },
    { query: "What is the fee drag of Roth IRA investments?", checkConflict: "roth vs fee drag override" }
  ];

  for (const q of testQueries) {
    const res = await queryRAGChatbot(q.query);
    const hasLuffy = res.answer.startsWith('SHISHISHI!');
    const hasQuote = res.liveQuote !== undefined;

    if (q.checkLuffy) {
      record('RAG Chatbot E2E', `Luffy framing for "${q.query}"`, hasLuffy, `Prefix: ${res.answer.substring(0, 15)}`);
    }
    if (q.checkQuote) {
      record('RAG Chatbot E2E', `Live quote injection for "${q.query}"`, hasQuote, `Live Quote: ${JSON.stringify(res.liveQuote)}`);
    }
    if (q.checkConflict) {
      const mentionsRoth = res.answer.includes('Roth IRA');
      const mentionsFeeDragMath = res.answer.includes('leaky ship hull') || res.answer.includes('0.03% Expense Ratio');
      record('RAG Synthesizer Logic', `Conflict query "${q.query}" hardcoded override behavior`, 
        mentionsRoth && !mentionsFeeDragMath, 
        `Mentions Roth: ${mentionsRoth}, Mentions Fee Drag Math: ${mentionsFeeDragMath}. (Synthesizer matched 'roth' first and ignored fee drag!)`);
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n====================================================');
  console.log('📊 EMPIRICAL STRESS TEST SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`Total Scenarios Tested: ${total}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed / Anomalies Found: ${failedCount}`);
}

runEmpiricalStressSuite().catch(console.error);
