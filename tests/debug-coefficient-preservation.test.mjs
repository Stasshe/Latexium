import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Testing coefficient preservation...\n');

const testCases = [
  '6x^2',
  '6x^2 + 0',
  '6x^2 + x^2',
];

for (const expr of testCases) {
  console.log(`Testing: ${expr}`);
  
  try {
    const ast = parseLatex(expr);
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Result:', result.value);
  } catch (error) {
    console.error('Error:', error.message);
  }
}