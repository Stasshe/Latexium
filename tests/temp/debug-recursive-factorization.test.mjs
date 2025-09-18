import { parseLatex, analyze } from '../../dist/index.esm.js';

// Test recursive factorization issues
console.log('=== Testing Recursive Factorization ===\n');

function testFactorization(expression) {
  console.log(`Input: ${expression}`);
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.error('Parse Error:', parseResult.error);
      return;
    }
    
    console.log('Parsed AST:', JSON.stringify(parseResult.ast, null, 2));
    
    const result = analyze(parseResult.ast, { task: 'factor', variable: 'x' });
    console.log('Result AST:', JSON.stringify(result.ast, null, 2));
    console.log('Result LaTeX:', result.value);
    console.log('Steps:', result.steps);
    console.log('Error:', result.error);
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('---\n');
}

// Test cases
console.log('1. Testing x^4 - 4 (should work):');
testFactorization('x^4 - 4');

console.log('2. Testing 2x^4 - 8 (problematic):');
testFactorization('2x^4 - 8');

console.log('3. Testing x^2 - 4 (basic difference of squares):');
testFactorization('x^2 - 4');

console.log('4. Testing 2x^2 - 8 (with common factor):');
testFactorization('2x^2 - 8');

console.log('5. Testing x^8 - 16 (higher order):');
testFactorization('x^8 - 16');