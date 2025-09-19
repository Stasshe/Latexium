/**
 * Debug LLL factorization for x^4 - 1 specifically
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function debugX4Minus1() {
  console.log('Debugging x^4 - 1 factorization...\n');

  const input = 'x^4 - 1';
  
  try {
    console.log(`Input: ${input}`);
    
    const parseResult = parseLatex(input);
    const ast = parseResult.ast;
    
    if (ast) {
      console.log('AST structure:', JSON.stringify(ast, null, 2));
      
      const result = analyze(ast, { task: 'factor' });
      
      console.log('\nResult:', result.value);
      console.log('\nDetailed steps:');
      result.steps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
      
      console.log('\nExpected: (x^2 - 1)(x^2 + 1) = (x - 1)(x + 1)(x^2 + 1)');
      console.log('Actual:', result.value);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugX4Minus1();