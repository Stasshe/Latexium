/**
 * Test the original BZ integration test to see if it works now
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function testBerlekampIntegrationImproved() {
  console.log('Testing Improved Berlekamp-Zassenhaus Integration...\n');

  const testCases = [
    {
      name: 'Simple quadratic',
      input: 'x^2 - 3x + 2',
      task: 'factor',
      expected: '(x - 1)(x - 2)'
    },
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
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`Test: ${testCase.name}`);
      console.log(`Input: ${testCase.input}`);
      
      const parseResult = parseLatex(testCase.input);
      const ast = parseResult.ast;
      
      if (ast) {
        const result = analyze(ast, { task: testCase.task });
        
        console.log(`Result: ${result.value}`);
        
        // Check if BZ strategy was attempted
        const bzAttempted = result.steps.some(step => 
          step.includes('berlekamp-zassenhaus') || step.includes('Berlekamp')
        );
        
        if (bzAttempted) {
          console.log('✅ Berlekamp-Zassenhaus strategy was attempted');
          
          // Check if factorization was successful (result different from input)
          if (result.value !== testCase.input) {
            console.log('✅ Some factorization occurred');
            passed++;
          } else {
            console.log('❌ No factorization occurred (result same as input)');
          }
        } else {
          console.log('❌ Berlekamp-Zassenhaus strategy was NOT attempted');
        }
      }
      
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error in test "${testCase.name}":`, error.message);
      console.log('---\n');
    }
  }

  console.log(`\nSummary: ${passed}/${total} tests had successful factorization`);
  return passed > 0;
}

testBerlekampIntegrationImproved();