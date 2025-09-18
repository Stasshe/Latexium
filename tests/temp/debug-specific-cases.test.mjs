import { parseLatex, analyze } from '../../dist/index.esm.js';

// Debug specific cases that are showing issues
console.log('=== Debugging Specific Issues ===\n');

function testFactorization(expression) {
  console.log(`Input: ${expression}`);
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.error('Parse Error:', parseResult.error);
      return;
    }
    
    console.log('Parsed AST structure:');
    console.log(JSON.stringify(parseResult.ast, null, 2));
    
    const result = analyze(parseResult.ast, { task: 'factor', variable: 'x' });
    console.log('Result LaTeX:', result.value);
    console.log('Result AST:');
    console.log(JSON.stringify(result.ast, null, 2));
    
    if (result.error) {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('---\n');
}

// Focus on the problematic cases
console.log('1. Testing x^8 - x^4 (should become x^4(x^4 - 1)):');
testFactorization('x^8 - x^4');

console.log('2. Testing x^4 - 1 (should become (x^2+1)(x^2-1)):');
testFactorization('x^4 - 1');

console.log('3. Testing simple x^2 - 1 for comparison:');
testFactorization('x^2 - 1');
