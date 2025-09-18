import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Debug new system...\n');

const expr = '6x^2';
console.log(`Testing: ${expr}`);

try {
  const ast = parseLatex(expr);
  console.log('Parsed AST:', JSON.stringify(ast.ast, null, 2));
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Result:', result);
  console.log('Result value:', result.value);
  console.log('Result error:', result.error);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}