import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Simple term test...\n');

const expr = 'x^2';
console.log(`Testing: ${expr}`);

try {
  const ast = parseLatex(expr);
  console.log('Parsed AST:', JSON.stringify(ast.ast, null, 2));
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Result:', result.value);
} catch (error) {
  console.error('Error:', error.message);
}