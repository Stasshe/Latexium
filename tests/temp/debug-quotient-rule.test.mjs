/**
 * Specific Test for Quotient Rule Simplification
 * Test the exact case that should give -4x/(x^2-1)^2
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function testSpecificCase(expression, expected, description) {
  console.log(`\n🔬 Testing: ${description}`);
  console.log(`Expression: ${expression}`);
  console.log(`Expected: ${expected}`);
  
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

    console.log(`Got: ${analyzeResult.value}`);
    
    if (analyzeResult.value === expected) {
      console.log(`✅ PASS`);
    } else {
      console.log(`❌ FAIL`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

console.log('🚀 Quotient Rule Simplification Test');
console.log('====================================');

// Test the exact numerator expansion
testSpecificCase('2x(x^{2} - 1) - (x^{2} + 1)(2x)', '-4x', 'Numerator expansion');

// Test the exact expanded form
testSpecificCase('2x^{3} - 2x - 2x^{3} - 2x', '-4x', 'Direct expanded form');

// Test just the coefficient simplification
testSpecificCase('2x^{3} - 2x^{3}', '0', 'x^3 terms cancel');
testSpecificCase('-2x - 2x', '-4x', 'Linear terms combine');

// Test the full fraction
testSpecificCase('\\frac{2x(x^{2} - 1) - (x^{2} + 1)(2x)}{(x^{2} - 1)^{2}}', '\\frac{-4x}{(x^{2} - 1)^{2}}', 'Full fraction simplification');

// Test individual components
testSpecificCase('(x^{2} - 1)^{2}', 'x^{4} - 2x^{2} + 1', 'Denominator expansion');
testSpecificCase('x^{2} + 1', 'x^{2} + 1', 'Simple polynomial');
testSpecificCase('x^{2} - 1', 'x^{2} - 1', 'Simple polynomial');