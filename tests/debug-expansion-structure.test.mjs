import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Debugging expansion structure...\n');

// Test case: (x+1)^3
const testExpression = '(x+1)^3';
console.log('Input:', testExpression);

try {
  const ast = parseLatex(testExpression);
  console.log('Parsed AST structure:', JSON.stringify(ast.ast, null, 2));
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Expanded AST structure:', JSON.stringify(result.ast, null, 2));
  console.log('Result:', result.value);
} catch (error) {
  console.error('Error:', error.message);
}