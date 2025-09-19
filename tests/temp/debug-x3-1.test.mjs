/**
 * Debug x^3 - 1 factorization specifically
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function debugX3Minus1() {
  console.log('Debugging x^3 - 1 factorization...\n');

  const input = 'x^3 - 1';
  
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
      
      console.log('\nExpected: (x - 1)(x^2 + x + 1)');
      console.log('Actual:', result.value);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugX3Minus1();