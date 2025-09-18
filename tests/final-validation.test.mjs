import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Final Validation Tests ===');

// Test the problematic case from test 4
console.log('\n1. Chain subtraction: 5x - 3x + 2x - 7x + x');
const chain = parseLatex('5x - 3x + 2x - 7x + x');
console.log('Input: 5x - 3x + 2x - 7x + x');
const chainResult = analyze(chain.ast, { task: 'distribute' });
console.log('Result:', chainResult.value);
console.log('Expected: -2x');
console.log('Manual calculation: 5 - 3 + 2 - 7 + 1 =', 5 - 3 + 2 - 7 + 1);

// Simpler case to verify
console.log('\n2. Simple subtraction chain: 5x - 3x - 2x');
const simple = parseLatex('5x - 3x - 2x');
console.log('Input: 5x - 3x - 2x');
const simpleResult = analyze(simple.ast, { task: 'distribute' });
console.log('Result:', simpleResult.value);
console.log('Expected: 0');
console.log('Manual calculation: 5 - 3 - 2 =', 5 - 3 - 2);

// Another case
console.log('\n3. Mixed operations: 3x + 2x - x - x');
const mixed = parseLatex('3x + 2x - x - x');
console.log('Input: 3x + 2x - x - x');
const mixedResult = analyze(mixed.ast, { task: 'distribute' });
console.log('Result:', mixedResult.value);
console.log('Expected: 3x');
console.log('Manual calculation: 3 + 2 - 1 - 1 =', 3 + 2 - 1 - 1);

console.log('\n=== Validation Complete ===');