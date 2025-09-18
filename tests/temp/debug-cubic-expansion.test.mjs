import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Testing cubic expansion step by step...\n');

const expr = '(x+2)^3';
console.log(`Testing: ${expr}`);

try {
  const ast = parseLatex(expr);
  console.log('Original AST:', JSON.stringify(ast.ast, null, 2));
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Final result:', result.value);
  console.log('Should be: x^3 + 6x^2 + 12x + 8');
  
  console.log('\nSteps:');
  for (let i = 0; i < result.steps.length; i++) {
    console.log(`  ${i + 1}. ${result.steps[i]}`);
  }
} catch (error) {
  console.error('Error:', error.message);
}