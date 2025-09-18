import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('Debugging AST parsing...\n');

const expression = '2x^2 + 4x';
console.log(`Testing: ${expression}`);

try {
  const ast = parseLatex(expression);
  console.log('Parsed AST:', JSON.stringify(ast, null, 2));
  
  const result = analyze(expression, { task: 'factor' });
  console.log('\nAnalysis result:', result);
} catch (error) {
  console.error('Error:', error);
}