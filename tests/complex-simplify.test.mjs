import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Complex Simplification Test Cases ===');

// Test deeply nested additions
console.log('\n1. Testing deeply nested additions: (((x+1)+2)+3)+4');
const nested = parseLatex('(((x+1)+2)+3)+4');
console.log('Input: (((x+1)+2)+3)+4');
console.log('Parsed AST depth:', JSON.stringify(nested.ast, null, 2));
const nestedResult = analyze(nested.ast, { task: 'distribute' });
console.log('Result:', nestedResult.value);
console.log('Error:', nestedResult.error);

// Test complex polynomial-like expressions
console.log('\n2. Testing complex polynomial: 3x^3 + 2x^2 + x^3 + 4x^2 + 5x + 2x');
const polynomial = parseLatex('3x^3 + 2x^2 + x^3 + 4x^2 + 5x + 2x');
console.log('Input: 3x^3 + 2x^2 + x^3 + 4x^2 + 5x + 2x');
const polyResult = analyze(polynomial.ast, { task: 'distribute' });
console.log('Result:', polyResult.value);
console.log('Error:', polyResult.error);

// Test mixed coefficients with fractions
console.log('\n3. Testing mixed coefficients: 1/2*x + 3/4*x + 1/4*x');
const fractions = parseLatex('1/2*x + 3/4*x + 1/4*x');
console.log('Input: 1/2*x + 3/4*x + 1/4*x');
const fracResult = analyze(fractions.ast, { task: 'distribute' });
console.log('Result:', fracResult.value);
console.log('Error:', fracResult.error);

// Test negative coefficients and subtraction
console.log('\n4. Testing negative coefficients: 5x - 3x + 2x - 7x + x');
const negative = parseLatex('5x - 3x + 2x - 7x + x');
console.log('Input: 5x - 3x + 2x - 7x + x');
const negResult = analyze(negative.ast, { task: 'distribute' });
console.log('Result:', negResult.value);
console.log('Error:', negResult.error);

// Test multiple variables with powers
console.log('\n5. Testing multiple variables: 2x^2*y + 3x*y^2 + x^2*y + 2x*y^2');
const multiVar = parseLatex('2x^2*y + 3x*y^2 + x^2*y + 2x*y^2');
console.log('Input: 2x^2*y + 3x*y^2 + x^2*y + 2x*y^2');
const multiResult = analyze(multiVar.ast, { task: 'distribute' });
console.log('Result:', multiResult.value);
console.log('Error:', multiResult.error);

// Test zero elimination
console.log('\n6. Testing zero elimination: 0*x + 3x + 0 + 2x + 0*y');
const zeros = parseLatex('0*x + 3x + 0 + 2x + 0*y');
console.log('Input: 0*x + 3x + 0 + 2x + 0*y');
const zeroResult = analyze(zeros.ast, { task: 'distribute' });
console.log('Result:', zeroResult.value);
console.log('Error:', zeroResult.error);

// Test identity elimination
console.log('\n7. Testing identity elimination: 1*x + x*1 + 2*x*1*1');
const identities = parseLatex('1*x + x*1 + 2*x*1*1');
console.log('Input: 1*x + x*1 + 2*x*1*1');
const identResult = analyze(identities.ast, { task: 'distribute' });
console.log('Result:', identResult.value);
console.log('Error:', identResult.error);

// Test complex nested structure
console.log('\n8. Testing complex nested: (2x + 3) + (4x - 1) + (x + 5)');
const complexNested = parseLatex('(2x + 3) + (4x - 1) + (x + 5)');
console.log('Input: (2x + 3) + (4x - 1) + (x + 5)');
const complexResult = analyze(complexNested.ast, { task: 'distribute' });
console.log('Result:', complexResult.value);
console.log('Error:', complexResult.error);

// Test power simplification
console.log('\n9. Testing power simplification: x^1 + x^0 + 2*x^1');
const powers = parseLatex('x^1 + x^0 + 2*x^1');
console.log('Input: x^1 + x^0 + 2*x^1');
const powerResult = analyze(powers.ast, { task: 'distribute' });
console.log('Result:', powerResult.value);
console.log('Error:', powerResult.error);

// Test very complex mixed expression
console.log('\n10. Testing very complex: 3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
const veryComplex = parseLatex('3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
console.log('Input: 3x^2 + 2y - x^2 + 4y + 5z - 3z + x^2 - y');
const veryComplexResult = analyze(veryComplex.ast, { task: 'distribute' });
console.log('Result:', veryComplexResult.value);
console.log('Error:', veryComplexResult.error);

console.log('\n=== Complex Tests Complete ===');