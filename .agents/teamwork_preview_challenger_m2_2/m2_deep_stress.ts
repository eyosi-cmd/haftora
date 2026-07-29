import { queryRAGChatbot, extractTickerSymbol, tokenize, rankChunksWithTFIDF } from '../../src/services/rag/ragEngine';

async function deepStressTest() {
  console.log('====================================================');
  console.log('🧪 DEEP STRESS TEST - SECURITY, RESILIENCE & LATENCY');
  console.log('====================================================\n');

  // 1. Currency & Special Symbol Tokenization
  console.log('--- 1. Currency & Special Symbol Tokenization ---');
  const currencyPrompts = ["$7,000", "$23,000", "0.03%", "0.75%"];
  for (const cp of currencyPrompts) {
    const tokens = tokenize(cp);
    console.log(`Prompt: "${cp}" => Tokens: ${JSON.stringify(tokens)}`);
  }

  // 2. Query Latency & Benchmark (1000 queries)
  console.log('\n--- 2. TF-IDF Search Engine Benchmark ---');
  const testQueries = [
    "What is VOO expense ratio?",
    "Roth IRA contribution limits for 2026",
    "Should I buy NVDA or GOOGL for AI growth?",
    "How does fee drag ruin portfolio returns over 30 years?",
    "Broad market asset allocation VTI vs VXUS"
  ];

  const start = Date.now();
  const iterations = 1000;
  for (let i = 0; i < iterations; i++) {
    const q = testQueries[i % testQueries.length];
    rankChunksWithTFIDF(q);
  }
  const elapsed = Date.now() - start;
  console.log(`⏱️ Executed ${iterations} TF-IDF rank queries in ${elapsed}ms (${(elapsed / iterations).toFixed(3)}ms per query)`);

  // 3. Robustness against Prompt Injections / Special characters
  console.log('\n--- 3. Prompt Robustness & Error Handling ---');
  const adversarialPrompts = [
    "<script>alert('xss')</script>",
    "'; DROP TABLE knowledge_chunks; --",
    "VOO ".repeat(100),
    "🎉🚀🔥💎🙌",
    "null",
    "undefined"
  ];

  for (const adv of adversarialPrompts) {
    try {
      const res = await queryRAGChatbot(adv);
      const isOk = typeof res.answer === 'string' && res.answer.length > 0;
      console.log(`Adversarial Input: "${adv.substring(0, 30)}..." => Response generated successfully? ${isOk ? 'YES' : 'NO'}`);
    } catch (err: any) {
      console.error(`❌ Adversarial input caused crash on "${adv}":`, err?.message);
    }
  }

  // 4. Overlap & Priority matrix in Synthesizer
  console.log('\n--- 4. Synthesizer Keyword Priority Matrix ---');
  const matrixQueries = [
    { query: "Roth IRA expense ratio fee drag", matchedBranch: "" },
    { query: "NVDA in a Roth IRA tax strategy", matchedBranch: "" },
    { query: "VOO expense ratio 0.03%", matchedBranch: "" },
    { query: "Tech allocation QQQ with VOO anchor", matchedBranch: "" }
  ];

  for (const m of matrixQueries) {
    const res = await queryRAGChatbot(m.query);
    let branch = "else (retrieved context)";
    if (res.answer.includes("Roth IRAs and 401(k)s are your ultimate tax-defense shields")) branch = "Roth / Tax Branch";
    else if (res.answer.includes("Beware of hidden fee drag")) branch = "Expense / Fee Drag Branch";
    else if (res.answer.includes("Broad market index funds are your ironclad battleship")) branch = "VOO / VTI / Broad Market Branch";
    else if (res.answer.includes("Tech and AI giants like QQQM")) branch = "Tech / NVDA / QQQ Branch";

    console.log(`Query: "${m.query}" => Triggered Branch: [${branch}]`);
  }
}

deepStressTest().catch(console.error);
