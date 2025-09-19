import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Final comprehensive test...\n');

const testCases = ['(x-2)^2', '(x-3)^3', '(x+2)^4', '(2a+b)^3', '(2x+3)^2'];

for (const expr of testCases) {
  console.log(`\n--- Testing: ${expr} ---`);

  try {
    const ast = parseLatex(expr);
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Result:', result.value);

    if (result.steps.length > 1) {
      console.log('Steps taken:', result.steps.length);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}
