import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== DIFFERENTIATION ISSUE TEST ===\n');

// Test the original problematic case
console.log('Test: \\frac{1}{1000} * x^3 differentiation');
const test1 = parseLatex('\\frac{1}{1000} * x^3');
if (!test1.error) {
  const result1 = analyze(test1.ast, { task: 'differentiate', variable: 'x' });
  console.log('Result:', result1.value);
  console.log('Should not contain "0 +"');
  console.log('Contains "0 +":', result1.value.includes('0 +'));
}
console.log();

// Test another case that might have similar issues
console.log('Test: x^3 + 2*x^2 + x + 1 differentiation');
const test2 = parseLatex('x^3 + 2*x^2 + x + 1');
if (!test2.error) {
  const result2 = analyze(test2.ast, { task: 'differentiate', variable: 'x' });
  console.log('Result:', result2.value);
  console.log('Should not contain malformed expressions');
}