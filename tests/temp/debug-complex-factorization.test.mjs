/**
 * Debug Complex Factorization Test
 * Test the specific case from the error log
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function debugComplexTest(expression, description) {
  console.log(`\n🔍 Debug Complex: ${description}`);
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

console.log('🚀 Debug Complex Factorization Tests');
console.log('=====================================');

// Test the specific problematic expression
debugComplexTest('\\frac{2x x^{2} - 1 - x^{2} + 1 2x}{x^{2} - 1^{2}}', 'Complex fraction from differentiation');

// Test simpler cases to understand the pattern
debugComplexTest('2x(x^{2} - 1) - (x^{2} + 1)(2x)', 'Expanded numerator');
debugComplexTest('(x^{2} - 1)^{2}', 'Power of expression');
debugComplexTest('x^{2} - 1^{2}', 'Incorrect denominator form');