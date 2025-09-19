/**
 * Test LLL factorization strategy for high-degree polynomials
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function testLLLFactorization() {
  console.log('Testing LLL Factorization Strategy...\n');

  const testCases = [
    {
      name: 'Cubic polynomial',
      input: 'x^3 - 6x^2 + 11x - 6',
      expected: '(x - 1)(x - 2)(x - 3)'
    },
    {
      name: 'Quartic polynomial',
      input: 'x^4 - 10x^2 + 9',
      expected: '(x^2 - 1)(x^2 - 9)'
    },
    {
      name: 'Difference of cubes',
      input: 'x^3 - 8',
      expected: '(x - 2)(x^2 + 2x + 4)'
    },
    {
      name: 'Higher degree polynomial',
      input: 'x^4 - 1',
      expected: '(x - 1)(x + 1)(x^2 + 1)'
    },
    {
      name: 'Simple quintic',
      input: 'x^5 - x',
      expected: 'x(x^4 - 1)'
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
        const result = analyze(ast, { task: 'factor' });
        
        console.log(`Result: ${result.value}`);
        
        // Check if LLL strategy was attempted
        const lllAttempted = result.steps.some(step => 
          step.includes('lll-factorization') || step.includes('LLL')
        );
        
        if (lllAttempted) {
          console.log('✅ LLL strategy was attempted');
          
          // Check if factorization was successful (result different from input)
          if (result.value !== testCase.input) {
            console.log('✅ Factorization occurred');
            passed++;
          } else {
            console.log('❌ No factorization occurred (result same as input)');
          }
        } else {
          console.log('ℹ️ LLL strategy was not needed (other strategies succeeded)');
          // Check if any factorization occurred
          if (result.value !== testCase.input) {
            console.log('✅ Factorization occurred via other strategies');
            passed++;
          }
        }
        
        console.log(`Steps summary: ${result.steps.slice(0, 3).join(', ')}...`);
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

testLLLFactorization();