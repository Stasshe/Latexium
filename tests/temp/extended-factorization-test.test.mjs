/**
 * Extended Factorization Test
 * Test more complex factorization cases including variable factors
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('🔬 Extended Factorization Test\n');

const testCases = [
  // Basic cases (should work)
  { expr: '6x + 9', expected: '3(2x + 3)' },
  { expr: 'x^2 - 4', expected: '(x + 2)(x - 2)' },
  
  // Variable common factor cases (problematic)
  { expr: '2x^2 + 4x', expected: '2x(x + 2)' },
  { expr: 'x^2 + x', expected: 'x(x + 1)' },
  { expr: '3x^2 + 6x', expected: '3x(x + 2)' },
  
  // Complex cases
  { expr: 'x^3 + x^2', expected: 'x^2(x + 1)' },
  { expr: '4x^3 + 8x^2', expected: '4x^2(x + 2)' },
  { expr: 'xy + x', expected: 'x(y + 1)' },
  
  // Perfect squares
  { expr: 'x^2 + 2x + 1', expected: '(x + 1)^2' },
  { expr: 'x^2 - 2x + 1', expected: '(x - 1)^2' },
  
  // Difference of squares (more complex)
  { expr: '4x^2 - 9', expected: '(2x + 3)(2x - 3)' },
  { expr: '9x^2 - 16', expected: '(3x + 4)(3x - 4)' },
];

for (const { expr, expected } of testCases) {
  console.log(`=== Testing: ${expr} ===`);
  console.log(`Expected: ${expected}`);
  
  try {
    const parseResult = parseLatex(expr);
    if (parseResult.error) {
      console.log(`❌ Parse error: ${parseResult.error}`);
      continue;
    }
    
    const factorResult = analyze(parseResult.ast, { task: 'factor' });
    const actual = factorResult.value;
    
    if (actual === expected) {
      console.log(`✅ Result: ${actual}`);
    } else {
      console.log(`❌ Result: ${actual}`);
      console.log(`   Expected: ${expected}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

console.log('🎯 Test completed!');