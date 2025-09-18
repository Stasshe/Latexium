/**
 * Comprehensive Factorization Test
 * Test various factorization cases to ensure the system works correctly
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('🧮 Comprehensive Factorization Test\n');

const testCases = [
  '6x + 9',           // Common factor: 3(2x + 3)
  'x^2 - 4',          // Difference of squares: (x + 2)(x - 2)
  'x^2 - 9',          // Difference of squares: (x + 3)(x - 3)
  '4x + 8',           // Common factor: 4(x + 2)
  '2x^2 + 4x',        // Common factor: 2x(x + 2)
  'x^2 - 16',         // Difference of squares: (x + 4)(x - 4)
  '3x + 6',           // Common factor: 3(x + 2)
  'x^2 - 25'          // Difference of squares: (x + 5)(x - 5)
];

for (const expression of testCases) {
  console.log(`=== Testing: ${expression} ===`);
  
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse error: ${parseResult.error}`);
      continue;
    }
    
    const factorResult = analyze(parseResult.ast, { task: 'factor' });
    console.log(`✅ Result: ${factorResult.value}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

console.log('🎉 Test completed!');