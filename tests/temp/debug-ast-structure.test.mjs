/**
 * Debug AST parsing and structure
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function debugASTStructure() {
  console.log('Debugging AST Structure...\n');

  const input = 'x^3 - 6x^2 + 11x - 6';
  
  try {
    console.log(`Input: ${input}`);
    
    const ast = parseLatex(input);
    console.log('Parsed AST:', JSON.stringify(ast, null, 2));
    
    const result = analyze(ast, { task: 'factor' });
    console.log('Analysis result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugASTStructure();