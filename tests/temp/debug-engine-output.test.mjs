/**
 * Debug factorization engine output
 */

import { parseLatex } from '../../dist/index.esm.js';

console.log('🔍 Direct Engine Test\n');

// Get the AST for x^2 - 4
const expression = 'x^2 - 4';
const parseResult = parseLatex(expression);

console.log('Testing factorization engine directly...');

// Import and test the factorization engine directly
try {
  // We need to inspect what the engine is actually producing
  // The issue might be in the conversion between AST and LaTeX
  
  console.log('Original AST structure:');
  console.log('Type:', parseResult.ast.type);
  console.log('Operator:', parseResult.ast.operator);
  console.log('Left side structure:', JSON.stringify(parseResult.ast.left, null, 2));
  console.log('Right side structure:', JSON.stringify(parseResult.ast.right, null, 2));
  
  // This should help us understand where the conversion is going wrong
  
} catch (error) {
  console.error('Error:', error.message);
}