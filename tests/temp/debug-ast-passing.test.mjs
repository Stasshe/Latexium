/**
 * Debug AST node passing to analyze function
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function debugASTNodePassing() {
  console.log('Debugging AST Node Passing...\n');

  const input = 'x^3 - 6x^2 + 11x - 6';
  
  try {
    console.log(`Input: ${input}`);
    
    const parseResult = parseLatex(input);
    console.log('Parse result structure:', Object.keys(parseResult));
    console.log('Parse result error:', parseResult.error);
    
    // Extract the AST from the parse result
    const ast = parseResult.ast;
    console.log('AST type:', ast?.type);
    console.log('AST structure (first level):', JSON.stringify(ast, null, 2).substring(0, 500));
    
    if (ast) {
      console.log('\nCalling analyze with AST...');
      const result = analyze(ast, { task: 'factor' });
      console.log('Analysis result:', JSON.stringify(result, null, 2));
    } else {
      console.log('No AST found in parse result');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugASTNodePassing();