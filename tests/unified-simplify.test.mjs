import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Testing Unified Simplify Function ===');

// Test basic like terms combination
console.log('\n1. Testing basic like terms:');
const basic = parseLatex('2x + 3x');
console.log('Input: 2x + 3x');
console.log('Parsed:', JSON.stringify(basic, null, 2));
const basicResult = analyze(basic.ast, { task: 'distribute' });
console.log('Result:', basicResult.value);
console.log('Error:', basicResult.error);

// Test coefficient preservation
console.log('\n2. Testing coefficient preservation:');
const coeff = parseLatex('6x^2');
console.log('Input: 6x^2');
console.log('Parsed:', JSON.stringify(coeff, null, 2));
const coeffResult = analyze(coeff.ast, { task: 'distribute' });
console.log('Result:', coeffResult.value);
console.log('Error:', coeffResult.error);

// Test distribution and simplification
console.log('\n3. Testing distribution with simplification:');
const dist = parseLatex('2(x + 3)');
console.log('Input: 2(x + 3)');
console.log('Parsed:', JSON.stringify(dist, null, 2));
const distResult = analyze(dist.ast, { task: 'distribute' });
console.log('Result:', distResult.value);
console.log('Error:', distResult.error);

// Test complex like terms
console.log('\n4. Testing complex like terms:');
const complex = parseLatex('3x^2 + 2x^2 + x^2');
console.log('Input: 3x^2 + 2x^2 + x^2');
console.log('Parsed:', JSON.stringify(complex, null, 2));
const complexResult = analyze(complex.ast, { task: 'distribute' });
console.log('Result:', complexResult.value);
console.log('Error:', complexResult.error);

// Test mixed terms
console.log('\n5. Testing mixed terms:');
const mixed = parseLatex('4x + 2y + 3x + y');
console.log('Input: 4x + 2y + 3x + y');
console.log('Parsed:', JSON.stringify(mixed, null, 2));
const mixedResult = analyze(mixed.ast, { task: 'distribute' });
console.log('Result:', mixedResult.value);
console.log('Error:', mixedResult.error);

console.log('\n=== Test Complete ===');