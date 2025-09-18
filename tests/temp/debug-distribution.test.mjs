/**
 * Simple Test for Distribution Logic
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function testDistribution(expression, expected, description) {
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

console.log('🚀 Distribution Test');
console.log('===================');

// Test basic distribution
testDistribution('2(x + 1)', '2x + 2', 'Basic distribution a(b+c)');
testDistribution('x(y + z)', 'x(y + z)', 'Variable distribution x(y+z)');
testDistribution('(a + b)c', 'a c + b c', 'Reverse distribution (a+b)c');

// Test subtraction distribution
testDistribution('2(x - 1)', '2x - 2', 'Distribution with subtraction');
testDistribution('(x - y)z', 'x z - y z', 'Reverse distribution with subtraction');

// Test power expansion
testDistribution('(x + 1)^{2}', 'x^{2} + 2x + 1', 'Binomial square expansion');
testDistribution('(x - 1)^{2}', 'x^{2} - 2x + 1', 'Binomial square with subtraction');

// Test power simplification
testDistribution('x^{2}', 'x^{2}', 'Simple power (no change)');
testDistribution('(x^{2})^{2}', 'x^{4}', 'Power of power');