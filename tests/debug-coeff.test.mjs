/**
 * Debug coefficient formatting
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function debugFormat(expression, description) {
  console.log(`\n🔬 Debugging: ${description}`);
  console.log(`Expression: ${expression}`);
  
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse Error: ${parseResult.error}`);
      return;
    }

    const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
    if (analyzeResult.error) {
      console.log(`❌ Analyze Error: ${analyzeResult.error}`);
      return;
    }

    console.log(`Result: ${analyzeResult.value}`);
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

console.log('🚀 Coefficient Formatting Debug');
console.log('==============================');

debugFormat('2x', 'Simple coefficient');
debugFormat('3 * x', 'Explicit multiplication');
debugFormat('2 * x * y', 'Multiple variables');
debugFormat('2 * (x * y)', 'Parentheses multiplication');
debugFormat('2 * (x + 1)', 'Coefficient times parentheses');
debugFormat('(a - b)^{2}', 'Expression with negative coefficient');