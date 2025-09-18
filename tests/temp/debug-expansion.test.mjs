/**
 * Debug Expansion Step
 */

import { parseLatex } from '../../dist/index.esm.js';
import { expandExpression } from '../../dist/index.esm.js';

console.log('=== Debug Expansion ===\n');

// Test the problematic case: 6x + 9
const testExpression = '6x + 9';
console.log(`Testing expression: ${testExpression}`);

try {
  const parsed = parseLatex(testExpression);
  console.log('Parsed AST:', JSON.stringify(parsed.ast, null, 2));

  if (!parsed.ast) {
    console.error('No AST returned from parser');
  }

  const expanded = expandExpression(parsed.ast);
  console.log('Expanded result:', expanded);
  console.log('Expanded result type:', typeof expanded);
  
  if (expanded) {
    console.log('Expanded AST:', JSON.stringify(expanded, null, 2));
  } else {
    console.error('Expansion returned null/undefined');
  }

} catch (error) {
  console.error('Error:', error.message);
}