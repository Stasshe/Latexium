import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Debug Simple Factorization ===\n');

try {
  console.log('1. Testing simple parsing...');
  //const ast = parseLatex('(x + 1)(x+1) xx x + xx + x');
  const ast = parseLatex('x / 3 * 2');
  console.log('AST:', JSON.stringify(ast, null, 2));

  console.log('\n2. Testing distribution...');
  const result = analyze(ast.ast, { task: 'evaluate' });
  //console.log('Result:', JSON.stringify(result, null, 2));
  console.log('Distributed LaTeX:', result.value);
  
} catch (error) {
  console.log('Error:', error.message);
  console.log('Stack:', error.stack);
}