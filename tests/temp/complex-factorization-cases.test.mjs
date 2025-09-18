import { parseLatex, analyze } from '../../dist/index.esm.js';

// Complex factorization test cases
console.log('=== Complex Factorization Test Cases ===\n');

function testFactorization(expression, expectedPattern = '') {
  console.log(`Input: ${expression}`);
  if (expectedPattern) console.log(`Expected pattern: ${expectedPattern}`);
  
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.error('Parse Error:', parseResult.error);
      return;
    }
    
    const result = analyze(parseResult.ast, { task: 'factor', variable: 'x' });
    console.log('Result:', result.value);
    console.log('Steps:', result.steps.slice(-3)); // Show last 3 steps only for brevity
    if (result.error) {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('---\n');
}

// 1. Nested power expressions
console.log('1. Testing x^8 - x^4 (common factor x^4):');
testFactorization('x^8 - x^4', 'x^4(x^4 - 1) → x^4(x^2+1)(x^2-1) → x^4(x^2+1)(x+1)(x-1)');

console.log('2. Testing x^12 - x^6 (higher powers):');
testFactorization('x^12 - x^6', 'x^6(x^6 - 1)');

console.log('3. Testing 2x^8 - 2x^4 (with coefficient):');
testFactorization('2x^8 - 2x^4', '2x^4(x^4 - 1)');

// 2. Mixed terms with different coefficients
console.log('4. Testing 3x^6 - 12x^2 (different powers):');
testFactorization('3x^6 - 12x^2', '3x^2(x^4 - 4)');

console.log('5. Testing 4x^10 - 16x^2 (very different powers):');
testFactorization('4x^10 - 16x^2', '4x^2(x^8 - 4)');

// 3. More complex coefficient patterns
console.log('6. Testing 12x^4 - 48 (larger coefficients):');
testFactorization('12x^4 - 48', '12(x^4 - 4)');

console.log('7. Testing 18x^8 - 72 (complex deep factorization):');
testFactorization('18x^8 - 72', '18(x^8 - 4)');

// 4. Fractional expressions
console.log('8. Testing x^4/2 - 2 (fractional coefficient):');
testFactorization('x^4/2 - 2', '1/2(x^4 - 4)');

console.log('9. Testing 3x^4/4 - 3 (complex fraction):');
testFactorization('3x^4/4 - 3', '3/4(x^4 - 4)');

// 5. Expressions that might need simplification
console.log('10. Testing (x^2)^2 - 4 (nested exponents):');
testFactorization('(x^2)^2 - 4', '(x^2)^2 - 4');

console.log('11. Testing x^2 \\cdot x^2 - 16 (multiplication to power):');
testFactorization('x^2 \\cdot x^2 - 16', 'x^4 - 16');

// 6. Very high order cases
console.log('12. Testing x^32 - 1 (extremely high order):');
testFactorization('x^32 - 1', 'Recursive factorization');

console.log('13. Testing 16x^16 - 256 (high coefficient and power):');
testFactorization('16x^16 - 256', '16(x^16 - 16)');