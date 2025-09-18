import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Debug AST structure...\n');

const testCases = [
  '6x^2',
  '6x^2 + x^2',
];

for (const expr of testCases) {
  console.log(`\nTesting: ${expr}`);
  
  try {
    const ast = parseLatex(expr);
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Result value:', result.value);
    console.log('Result AST:', JSON.stringify(result.ast, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}