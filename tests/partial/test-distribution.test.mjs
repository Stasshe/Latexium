/**
 * Test Multi-term Distribution
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function testDistribution(expression, expected, description) {
  console.log(`\n🧪 Testing: ${description}`);
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

    const result = analyzeResult.value;
    console.log(`Actual: ${result}`);

    if (result === expected) {
      console.log(`✅ PASS`);
    } else {
      console.log(`❌ FAIL - Expected ${expected}, got ${result}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

console.log('🚀 Multi-term Distribution Test');
console.log('===============================');

// Basic single term distribution
testDistribution('2(x + 1)', '2x + 2', 'Basic single term distribution');
testDistribution('3(a + b)', '3a + 3b', 'Single term times sum');
testDistribution('x(y + z)', 'xy + xz', 'Variable times sum');

// Reverse distribution
testDistribution('(x + 1) * 2', '2x + 2', 'Reverse distribution');
testDistribution('(a + b) * c', 'ac + bc', 'Sum times variable');

// Multi-term × Multi-term
testDistribution('(x + 1)(y + 2)', 'xy + 2x + y + 2', 'Two binomials');
testDistribution('(a + b)(c + d)', 'ac + ad + bc + bd', 'General binomial product');
testDistribution('(x + y + z)(a + b)', 'xa + xb + ya + yb + za + zb', 'Trinomial times binomial');

// With subtraction
testDistribution('(x - 1)(y + 2)', 'xy + 2x - y - 2', 'Binomial with subtraction');
testDistribution('(a - b)(c - d)', 'ac - ad - bc + bd', 'Both with subtraction');

// Powers (special case)
testDistribution('(x + 1)^{2}', 'x^{2} + 2x + 1', 'Binomial square');
testDistribution('(a - b)^{2}', 'a^{2} - 2ab + b^{2}', 'Binomial square with subtraction');

// Three terms
testDistribution(
  '(x + y + z)(a + b + c)',
  'xa + xb + xc + ya + yb + yc + za + zb + zc',
  'Three term multiplication'
);

console.log('\n🔬 Testing factorization preference...');

// Test expand vs factor preference
console.log('\n--- Internal expansion (default) ---');
testDistribution('2x + 4', '2x + 4', 'Should stay expanded');
testDistribution('6x + 9y', '6x + 9y', 'Should stay expanded');

console.log('\n--- With common factors ---');
testDistribution('2x + 4', '2(x + 2)', 'Common factor extraction');
testDistribution('6x + 9y', '3(2x + 3y)', 'Common factor with variables');
