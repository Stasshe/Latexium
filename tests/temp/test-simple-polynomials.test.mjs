/**
 * Test simpler polynomials to verify BZ algorithm
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function testSimplePolynomials() {
  console.log('Testing Simple Polynomials with BZ...\n');

  const testCases = [
    {
      name: 'Quadratic difference of squares',
      input: 'x^2 - 4',
      expected: '(x-2)(x+2)'
    },
    {
      name: 'Simple quadratic',
      input: 'x^2 - 3x + 2',
      expected: '(x-1)(x-2)'
    },
    {
      name: 'Simple cubic',
      input: 'x^3 - x',
      expected: 'x(x-1)(x+1)'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Test: ${testCase.name}`);
      console.log(`Input: ${testCase.input}`);
      
      const parseResult = parseLatex(testCase.input);
      const ast = parseResult.ast;
      
      if (ast) {
        const result = analyze(ast, { task: 'factor' });
        console.log(`Result: ${result.value}`);
        console.log(`Error: ${result.error}`);
        
        // Check if BZ strategy was attempted
        const bzAttempted = result.steps.some(step => 
          step.includes('berlekamp-zassenhaus') || step.includes('Berlekamp')
        );
        
        console.log(`BZ Attempted: ${bzAttempted ? 'Yes' : 'No'}`);
        console.log(`Steps: ${JSON.stringify(result.steps, null, 2)}`);
      }
      
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error in test "${testCase.name}":`, error.message);
      console.log('---\n');
    }
  }
}

testSimplePolynomials();