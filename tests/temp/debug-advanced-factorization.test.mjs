/**
 * Debug Advanced Factorization Cases
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Debug Advanced Factorization Cases ===\n');

const testCases = [
  { expr: '2x^4 - 8', expected: '2(x^2 + 2)(x + sqrt(2))(x - sqrt(2))' },
  { expr: '9x^2 - 16', expected: '(3x + 4)(3x - 4)' },
  { expr: 'x^2 + 4x + 4', expected: '(x + 2)^2' },
  { expr: 'x^2 - 6x + 9', expected: '(x - 3)^2' },
  { expr: 'x^4 - 1', expected: '(x - 1)(x + 1)(x^2 + 1)' }
];

async function debugAdvancedFactorization() {
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.expr} ---`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const parseResult = parseLatex(testCase.expr);
      
      if (parseResult.error) {
        console.error('Parse error:', parseResult.error);
        continue;
      }

      const result = analyze(parseResult.ast, {
        task: 'factor',
        variable: 'x',
        showSteps: true
      });

      console.log('Actual:', result.value);
      console.log('Match:', result.value === testCase.expected ? '✅' : '❌');
      
      console.log('Steps:');
      result.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });

      if (result.error) {
        console.error('Error:', result.error);
      }

    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

debugAdvancedFactorization();