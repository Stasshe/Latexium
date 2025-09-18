import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Debug coefficients in (x+2)^2...\n');

const expr = '(x+2)^2';
console.log(`Testing: ${expr}`);

try {
  const ast = parseLatex(expr);
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Result:', result.value);
  console.log('Should be: x^2 + 4x + 4');
} catch (error) {
  console.error('Error:', error.message);
}