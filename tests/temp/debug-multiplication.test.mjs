import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Simple multiplication test...\n');

const testCases = [
  '6 * x^2',  // Explicit multiplication
  '6x^2',     // Implicit multiplication
];

for (const expr of testCases) {
  console.log(`\nTesting: ${expr}`);
  
  try {
    const ast = parseLatex(expr);
    console.log('Parsed AST:', JSON.stringify(ast.ast, null, 2));
    
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Result:', result.value);
    console.log('Final AST:', JSON.stringify(result.ast, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}