/**
 * Test Berlekamp-Zassenhaus integration into factorization system
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function testBerlekampIntegration() {
  console.log('Testing Berlekamp-Zassenhaus Integration...\n');

  const testCases = [
    {
      name: 'Cubic polynomial',
      input: 'x^3 - 6x^2 + 11x - 6',
      task: 'factor',
      expected: '(x - 1)(x - 2)(x - 3)'
    },
    {
      name: 'Quartic polynomial',
      input: 'x^4 - 10x^2 + 9',
      task: 'factor',
      expected: '(x^2 - 1)(x^2 - 9)'
    },
    {
      name: 'High degree polynomial',
      input: 'x^5 - 1',
      task: 'factor',
      expected: '(x - 1)(x^4 + x^3 + x^2 + x + 1)'
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`Test: ${testCase.name}`);
      console.log(`Input: ${testCase.input}`);
      
      const ast = parseLatex(testCase.input);
      const result = analyze(ast, { task: testCase.task });
      
      console.log(`Result: ${result.result}`);
      console.log(`Steps: ${JSON.stringify(result.steps, null, 2)}`);
      
      // Check if BZ strategy was used
      const usedBZ = result.steps.some(step => 
        step.includes('Berlekamp') || step.includes('berlekamp')
      );
      
      if (usedBZ) {
        console.log('✅ Berlekamp-Zassenhaus strategy was used');
        passed++;
      } else {
        console.log('❌ Berlekamp-Zassenhaus strategy was NOT used');
      }
      
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error in test "${testCase.name}":`, error.message);
      console.log('---\n');
    }
  }

  console.log(`\nSummary: ${passed}/${total} tests detected BZ usage`);
  return passed === total;
}

testBerlekampIntegration();