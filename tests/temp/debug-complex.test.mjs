import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Debugging Complex Expression ===');

// The problematic expression from test 10
console.log('\n1. Full expression: 3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
const full = parseLatex('3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
console.log('Input: 3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
const fullResult = analyze(full.ast, { task: 'simplify' });
console.log('Result:', fullResult.value);
console.log('Expected: 3x^2 + 5y + 2z');

// Break it down to isolate the issue
console.log('\n2. Just the y terms: 2y + 4y - y');
const yTerms = parseLatex('2y + 4y - y');
console.log('Input: 2y + 4y - y');
const yResult = analyze(yTerms.ast, { task: 'simplify' });
console.log('Result:', yResult.value);
console.log('Expected: 5y');

console.log('\n3. Just the z terms: 5z - 3z');
const zTerms = parseLatex('5z - 3z');
console.log('Input: 5z - 3z');
const zResult = analyze(zTerms.ast, { task: 'simplify' });
console.log('Result:', zResult.value);
console.log('Expected: 2z');

console.log('\n4. Just the x^2 terms: 3x^2 - x^2 + x^2');
const xTerms = parseLatex('3x^2 - x^2 + x^2');
console.log('Input: 3x^2 - x^2 + x^2');
const xResult = analyze(xTerms.ast, { task: 'simplify' });
console.log('Result:', xResult.value);
console.log('Expected: 3x^2');

console.log('\n=== Debugging Complete ===');