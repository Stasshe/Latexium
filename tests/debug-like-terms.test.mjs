/**
 * Debug Like Terms Combination
 * Test the specific issue with linear term combination
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function debugLikeTerms(expression, description) {
  console.log(`\n🔍 Debug Like Terms: ${description}`);
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

console.log('🚀 Debug Like Terms Combination');
console.log('================================');

debugLikeTerms('-2x - 2x', 'Simple like terms: -2x - 2x');
debugLikeTerms('x + x', 'Positive like terms: x + x');
debugLikeTerms('2x + 3x', 'Coefficient like terms: 2x + 3x');
debugLikeTerms('-x - x', 'Negative like terms: -x - x');
debugLikeTerms('2 - 2', 'Constants: 2 - 2');