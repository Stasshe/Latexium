import { parseLatex, analyze } from '../../dist/index.esm.js';

// Additional tests for recursive factorization
console.log('=== Additional Recursive Factorization Tests ===\n');

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

// More complex test cases
console.log('1. Testing 3x^6 - 12 (deeper recursive factorization):');
testFactorization('3x^6 - 12');

console.log('2. Testing 4x^8 - 64 (very deep factorization):');
testFactorization('4x^8 - 64');

console.log('3. Testing 6x^4 - 24 (should factor to 6(x^2+2)(x^2-2)):');
testFactorization('6x^4 - 24');

console.log('4. Testing x^16 - 256 (extremely deep):');
testFactorization('x^16 - 256');

console.log('5. Testing 8x^4 - 128 (high coefficient):');
testFactorization('8x^4 - 128');