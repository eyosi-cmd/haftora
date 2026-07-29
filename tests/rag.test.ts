import { FINANCIAL_KNOWLEDGE_BASE } from '../src/services/rag/knowledgeBase';
import { LUFFY_SYSTEM_PROMPT, STRAW_HAT_PERSONA, formatLuffyResponse } from '../src/services/rag/luffyPersona';
import { queryRAGChatbot, extractTickerSymbol, tokenize, rankChunksWithTFIDF } from '../src/services/rag/ragEngine';

async function runRAGTests() {
  console.log('🧪 Starting R1 & R2 Financial KB, TF-IDF RAG & Luffy Persona Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ Passed: ${message}`);
      passed++;
    } else {
      console.error(`❌ Failed: ${message}`);
      failed++;
    }
  }

  // Test 1: Knowledge Base Structure & Required Coverage
  try {
    assert(FINANCIAL_KNOWLEDGE_BASE.length >= 6, 'FINANCIAL_KNOWLEDGE_BASE contains at least 6 comprehensive chunks');
    
    const hasExpenseMath = FINANCIAL_KNOWLEDGE_BASE.some(c => 
      c.category === 'expense_math' && 
      c.content.includes('0.03%') && 
      c.content.includes('0.75%') && 
      c.content.includes('30 years') && 
      c.content.includes('$10,000')
    );
    assert(hasExpenseMath, 'KB contains 30-year expense ratio math chunk comparing 0.03% vs 0.75% on $10,000');

    const hasTaxRules = FINANCIAL_KNOWLEDGE_BASE.some(c => 
      c.category === 'tax_strategy' && 
      c.content.includes('Roth IRA') && 
      c.content.includes('401(k)') && 
      c.content.includes('$7,000') && 
      c.content.includes('$23,000') && 
      c.content.includes('59.5')
    );
    assert(hasTaxRules, 'KB contains tax-advantaged account rules with $7,000 Roth IRA & $23,000 401(k) limits');

    const hasAssetAlloc = FINANCIAL_KNOWLEDGE_BASE.some(c => 
      c.content.includes('VOO') && 
      c.content.includes('VTI') && 
      c.content.includes('VXUS') && 
      c.content.includes('QQQ') && 
      c.content.includes('GOOGL') && 
      c.content.includes('NVDA')
    );
    assert(hasAssetAlloc, 'KB covers core asset allocation (VTI, VOO, VXUS, QQQ, GOOGL, NVDA)');
  } catch (err: any) {
    console.error('❌ KB Structure Exception:', err?.message);
    failed++;
  }

  // Test 2: TF-IDF Ranking Accuracy
  try {
    const expenseQuery = 'expense ratio math 0.03% vs 0.75% fee drag over 30 years';
    const rankedExpense = rankChunksWithTFIDF(expenseQuery);
    assert(rankedExpense[0].chunk.category === 'expense_math', 'TF-IDF engine ranks expense_math chunk highest for fee drag query');

    const taxQuery = 'Roth IRA vs 401k contribution limits and withdrawal rules';
    const rankedTax = rankChunksWithTFIDF(taxQuery);
    assert(rankedTax[0].chunk.category === 'tax_strategy', 'TF-IDF engine ranks tax_strategy chunk highest for Roth IRA query');
  } catch (err: any) {
    console.error('❌ TF-IDF Engine Exception:', err?.message);
    failed++;
  }

  // Test 3: Ticker Extraction
  try {
    assert(extractTickerSymbol('Should I buy VOO or VTI for my portfolio?') === 'VOO', 'Extracted VOO ticker from query');
    assert(extractTickerSymbol('What is the current price of NVDA?') === 'NVDA', 'Extracted NVDA ticker from query');
    assert(extractTickerSymbol('Tell me about Roth IRA rules') === null, 'Returns null when no ticker is present');
  } catch (err: any) {
    console.error('❌ Ticker Extraction Exception:', err?.message);
    failed++;
  }

  // Test 4: Luffy System Prompt & Response Formatting
  try {
    assert(typeof LUFFY_SYSTEM_PROMPT === 'string' && LUFFY_SYSTEM_PROMPT.includes('Captain Luffy'), 'LUFFY_SYSTEM_PROMPT exported and valid');
    assert(STRAW_HAT_PERSONA.name === 'Captain Luffy (Straw Hat Bot)', 'STRAW_HAT_PERSONA metadata valid');

    const formatted = formatLuffyResponse('Roth IRAs give tax free growth!', { ticker: 'VOO', price: 520.50, changePercent: 1.25 });
    assert(formatted.includes('LIVE MARKET RADAR') && formatted.includes('VOO') && formatted.startsWith('SHISHISHI'), 'formatLuffyResponse includes market radar & Luffy prefix');
  } catch (err: any) {
    console.error('❌ Luffy Persona Exception:', err?.message);
    failed++;
  }

  // Test 5: End-to-End RAG Query Execution
  try {
    const res = await queryRAGChatbot('Tell me about VOO expense ratio');
    assert(res.answer.startsWith('SHISHISHI!'), 'RAG chatbot response starts with Luffy pirate persona framing');
    assert(res.retrievedSources.length > 0, 'RAG chatbot retrieved relevant knowledge sources');
    assert(res.liveQuote !== undefined && res.liveQuote.ticker === 'VOO', 'RAG chatbot injected live quote data for detected ticker VOO');
  } catch (err: any) {
    console.error('❌ End-to-End RAG Execution Exception:', err?.message);
    failed++;
  }

  console.log(`\n📊 RAG Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runRAGTests();
