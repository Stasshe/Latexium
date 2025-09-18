import { parseLatex, analyze } from '../../dist/index.esm.js';

// Advanced and edge case tests
console.log('=== Advanced Factorization Edge Cases ===\n');

function testFactorization(expression) {
  console.log(`Input: ${expression}`);
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.error('Parse Error:', parseResult.error);
      return;
    }
    
    const result = analyze(parseResult.ast, { task: 'factor', variable: 'x' });
    console.log('Result:', result.value);
    if (result.error) {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('---\n');
}

// 1. Mixed variable powers that need different strategies
console.log('1. Testing x^3 - x (common factor and further factorization):');
testFactorization('x^3 - x');

console.log('2. Testing x^5 - x (higher odd power):');
testFactorization('x^5 - x');

console.log('3. Testing x^6 - x^2 (different even powers):');
testFactorization('x^6 - x^2');

// 2. Coefficients that form patterns
console.log('4. Testing 2x^3 - 2x (coefficient and common factor):');
testFactorization('2x^3 - 2x');

console.log('5. Testing 3x^5 - 3x (higher coefficient):');
testFactorization('3x^5 - 3x');

// 3. Very high powers
console.log('6. Testing x^64 - 1 (extremely high power):');
testFactorization('x^64 - 1');

console.log('7. Testing x^16 - x^8 (high powers with common factor):');
testFactorization('x^16 - x^8');

// 4. Multiple variable expressions (if supported)
console.log('8. Testing x^4 - y^4 (difference of squares with different variables):');
testFactorization('x^4 - y^4');

// 5. Complex nested structures
console.log('9. Testing (x^2 + 1)^2 - 4 (nested structure):');
testFactorization('(x^2 + 1)^2 - 4');

console.log('10. Testing x^8 + x^4 (sum instead of difference):');
testFactorization('x^8 + x^4');