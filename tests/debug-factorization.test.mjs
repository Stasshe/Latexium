/**
 * Debug Factorization Test
 * Debug the common factor extraction issue
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function debugTest(expression, description) {
  console.log(`\n🔍 Debug: ${description}`);
  console.log(`Expression: ${expression}`);
  
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse Error: ${parseResult.error}`);
      return;
    }

    console.log('AST:', JSON.stringify(parseResult.ast, null, 2));

    const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
    if (analyzeResult.error) {
      console.log(`❌ Analyze Error: ${analyzeResult.error}`);
      return;
    }

    console.log(`Result: ${analyzeResult.value}`);
    console.log('Simplified AST:', JSON.stringify(analyzeResult.ast, null, 2));
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

console.log('🚀 Debug Factorization Tests');
console.log('===============================');

debugTest('6x + 9', 'Common factor extraction issue');
debugTest('6*x + 9', 'Alternative multiplication format');
debugTest('2x + 3x', 'Like terms combination');