/**
 * Debug Term Extraction
 * Testing the polynomial term analysis
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('🔍 Debugging Term Extraction\n');

// Test the term extraction directly
const expression = '6x + 9';
const parseResult = parseLatex(expression);

console.log('Expression:', expression);
console.log('AST:', JSON.stringify(parseResult.ast, null, 2));

console.log('\n=== Manual Term Analysis ===');

// Let's manually trace what should happen:
// Terms should be:
// Term 1: coefficient=6, variables={x: 1}, sign=1
// Term 2: coefficient=9, variables={}, sign=1
// GCD of [6, 9] = 3
// After factoring out 3:
// Term 1: coefficient=2, variables={x: 1}
// Term 2: coefficient=3, variables={}
// Result should be: 3 * (2x + 3)

console.log('Expected:');
console.log('- Term 1: 6x (coefficient=6, variables={x:1})');
console.log('- Term 2: 9 (coefficient=9, no variables)');
console.log('- GCD: 3');
console.log('- After factoring: 2x + 3');
console.log('- Final: 3(2x + 3)');

console.log('\n=== Actual Analysis ===');
const factorResult = analyze(parseResult.ast, { task: 'factor' });
console.log('Actual result:', factorResult.value);
console.log('Steps:', factorResult.steps);