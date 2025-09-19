import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Testing Distribution with Unified Simplify ===');

// Test basic distribution
console.log('\n1. Basic distribution: 2(x + 3)');
const basic = parseLatex('2(x + 3)');
console.log('Input: 2(x + 3)');
const basicResult = analyze(basic.ast, { task: 'distribute' });
console.log('Result:', basicResult.value);
console.log('Expected: 2x + 6');

// Test distribution with like terms
console.log('\n2. Distribution with like terms: 2(x + 3) + 3(x + 1)');
const liketerms = parseLatex('2(x + 3) + 3(x + 1)');
console.log('Input: 2(x + 3) + 3(x + 1)');
const liketermsResult = analyze(liketerms.ast, { task: 'distribute' });
console.log('Result:', liketermsResult.value);
console.log('Expected: 5x + 9');

// Test power expansion
console.log('\n3. Power expansion: (x + 1)^2');
const power = parseLatex('(x + 1)^2');
console.log('Input: (x + 1)^2');
const powerResult = analyze(power.ast, { task: 'distribute' });
console.log('Result:', powerResult.value);
console.log('Expected: x^2 + 2x + 1');

// Test complex distribution
console.log('\n4. Complex distribution: (2x + 3)(x - 1)');
const complex = parseLatex('(2x + 3)(x - 1)');
console.log('Input: (2x + 3)(x - 1)');
const complexResult = analyze(complex.ast, { task: 'distribute' });
console.log('Result:', complexResult.value);
console.log('Expected: 2x^2 + x - 3');

// Test variable coefficient
console.log('\n5. Variable coefficient: x(y + 2) + y(x + 1)');
const varcoeff = parseLatex('x(y + 2) + y(x + 1)');
console.log('Input: x(y + 2) + y(x + 1)');
const varcoeffResult = analyze(varcoeff.ast, { task: 'distribute' });
console.log('Result:', varcoeffResult.value);
console.log('Expected: 2xy + 2x + y');

// Test distribution with subtraction
console.log('\n6. Distribution with subtraction: 3(x - 2) - 2(x - 1)');
const subtraction = parseLatex('3(x - 2) - 2(x - 1)');
console.log('Input: 3(x - 2) - 2(x - 1)');
const subtractionResult = analyze(subtraction.ast, { task: 'distribute' });
console.log('Result:', subtractionResult.value);
console.log('Expected: x - 4');

console.log('\n=== Distribution Tests Complete ===');
