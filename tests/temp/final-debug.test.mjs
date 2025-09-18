import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== STEP BY STEP COMPLEX EXPRESSION DEBUG ===\n');

const expression = '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1';
console.log(`Original: ${expression}`);

// Break down the expression step by step
console.log('\n=== STEP 1: Parse inner expression components ===');

const components = [
  '1',
  '-(-x-1-3x+x^2)', 
  'x',
  '-(-x+1)',
  '-x'
];

console.log('Components of inner expression:');
for (const component of components) {
  const parseResult = parseLatex(component);
  if (!parseResult.error) {
    const simplifyResult = analyze(parseResult.ast, {
      task: 'simplify',
      variable: 'x'
    });
    console.log(`  ${component} → ${simplifyResult.value}`);
  }
}

console.log('\n=== STEP 2: Combine inner expression ===');
const innerExpr = '1 -(-x-1-3x+x^2)+ x-(-x+1)-x';
console.log(`Inner: ${innerExpr}`);

const innerParseResult = parseLatex(innerExpr);
if (!innerParseResult.error) {
  const innerSimplifyResult = analyze(innerParseResult.ast, {
    task: 'simplify',
    variable: 'x'
  });
  console.log(`Inner simplified: ${innerSimplifyResult.value}`);
  
  // Manual calculation check
  console.log('\nManual calculation:');
  console.log('1 + (4x + 1 - x^2) + x + (x - 1) - x');
  console.log('= 1 + 4x + 1 - x^2 + x + x - 1 - x');
  console.log('= (1 + 1 - 1) + (4x + x + x - x) - x^2');
  console.log('= 1 + 5x - x^2');
}

console.log('\n=== STEP 3: Apply outer multiplication ===');
// The inner expression should be: 1 + 5x - x^2
// So -x(1 + 5x - x^2) = -x - 5x^2 + x^3

console.log('Expected after inner simplification: 1 + 5x - x^2');
console.log('Multiply by -x: -x(1 + 5x - x^2)');
console.log('= -x * 1 + -x * 5x + -x * (-x^2)');
console.log('= -x - 5x^2 + x^3');

console.log('\n=== STEP 4: Subtract 1 ===');
console.log('(-x - 5x^2 + x^3) - 1');
console.log('= x^3 - 5x^2 - x - 1');

console.log('\nCurrent system gives: -x - 5x^{2} + x^{3} - 1 (same as x^3 - 5x^2 - x - 1)');
console.log('Expected result:      x^3 + 4x^2 + 2x - 2');

console.log('\n=== VERIFICATION: Let me check if expected result is actually correct ===');
console.log('If the result should be x^3 + 4x^2 + 2x - 2,');
console.log('then before subtracting 1, we should have: x^3 + 4x^2 + 2x - 1');
console.log('This means -x(...) = x^3 + 4x^2 + 2x - 1');
console.log('So (...) should be -(x^2 + 4x + 2) + 1/x, which doesn\'t make sense.');
console.log('\nThe expected result might be wrong, or there\'s a different interpretation of the expression.');