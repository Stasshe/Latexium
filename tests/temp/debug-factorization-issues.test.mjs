/**
 * Debug Test for Factorization Issues
 * Identifying problems with the current implementation
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('🔍 Debugging Factorization Issues\n');

// Test simple case step by step
console.log('=== Simple Case: 6x + 9 ===');

const parseResult = parseLatex('6x + 9');
console.log('Parse result:', JSON.stringify(parseResult.ast, null, 2));

if (!parseResult.error) {
  const factorResult = analyze(parseResult.ast, { task: 'factor' });
  console.log('Factor result:', factorResult.value);
  console.log('Steps:', factorResult.steps);
}

console.log('\n=== Simple Case: x^2 - 4 ===');

const parseResult2 = parseLatex('x^2 - 4');
console.log('Parse result:', JSON.stringify(parseResult2.ast, null, 2));

if (!parseResult2.error) {
  const factorResult2 = analyze(parseResult2.ast, { task: 'factor' });
  console.log('Factor result:', factorResult2.value);
  console.log('Steps:', factorResult2.steps);
}

console.log('\n=== Debug Complete ===');