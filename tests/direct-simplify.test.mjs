import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Direct Simplify Function Test ===');

// Test simple case using the new unified simplify
console.log('\n1. Testing: 2x + 3x');
const test1 = parseLatex('2x + 3x');
console.log('Input: 2x + 3x');
console.log('Original AST:');
console.log(JSON.stringify(test1.ast, null, 2));

const result1 = analyze(test1.ast, { task: 'simplify' });
console.log('Result value:', result1.value);
console.log('Result AST:');
console.log(JSON.stringify(result1.ast, null, 2));

// Test another simple case
console.log('\n2. Testing: x + x');
const test2 = parseLatex('x + x');
console.log('Input: x + x');
const result2 = analyze(test2.ast, { task: 'simplify' });
console.log('Result value:', result2.value);
console.log('Result AST:');
console.log(JSON.stringify(result2.ast, null, 2));

console.log('\n=== Debug Complete ===');