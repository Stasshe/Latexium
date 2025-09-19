/**
 * Debug detailed factorization process for x^5 - x
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function debugDetailedFactorizationProcess() {
  console.log('Debugging detailed factorization process for x^5 - x...\n');

  const input = 'x^5 - x';
  
  try {
    console.log(`Input: ${input}`);
    
    const parseResult = parseLatex(input);
    const ast = parseResult.ast;
    
    if (ast) {
      console.log('Original AST structure:', JSON.stringify(ast, null, 2));
      
      const result = analyze(ast, { task: 'factor' });
      
      console.log('\nResult:', result.value);
      console.log('\nDetailed steps:');
      result.steps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
      
      console.log('\nBased on the steps, the issue seems to be that after step 6, the common factor x is lost.');
      console.log('Expected process:');
      console.log('1. x^5 - x');
      console.log('2. x(x^4 - 1)  <- common factor extraction');
      console.log('3. x[(x^2)^2 - 1^2]  <- recognize difference of squares');
      console.log('4. x(x^2 - 1)(x^2 + 1)  <- factor difference of squares');
      console.log('5. x(x - 1)(x + 1)(x^2 + 1)  <- factor x^2 - 1');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugDetailedFactorizationProcess();