import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Multiple similar terms test...\n');

const testCases = [
  '8x + 8x + 8x',
  'x + x + x',
  '16x + 8x + 8x',
];

for (const expr of testCases) {
  console.log(`\nTesting: ${expr}`);
  
  try {
    const ast = parseLatex(expr);
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Result:', result.value);
  } catch (error) {
    console.error('Error:', error.message);
  }
}