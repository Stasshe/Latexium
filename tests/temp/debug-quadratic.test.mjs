import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('Testing x^2 - 2x + 4 factorization directly');

try {
  const expression = 'x^2 - 2x + 4';
  console.log(`Input: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  
  if (parseResult.error) {
    console.error('Parse error:', parseResult.error);
    throw new Error(parseResult.error);
  }
  
  if (!ast) {
    throw new Error('No AST generated');
  }
  
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  
  console.log('Result value:', result.value);
  console.log('Steps:', result.steps);
  
  // Calculate discriminant for x^2 - 2x + 4
  const a = 1, b = -2, c = 4;
  const discriminant = b * b - 4 * a * c;
  console.log(`\nDiscriminant calculation for x^2 - 2x + 4:`);
  console.log(`Discriminant = b^2 - 4ac = (-2)^2 - 4(1)(4) = 4 - 16 = ${discriminant}`);
  console.log(`Since discriminant < 0, this should NOT be factorizable over real numbers`);
  
} catch (error) {
  console.error('Error:', error);
}

console.log('\n' + '='.repeat(50));
console.log('Testing x^2 - 2x + 1 (should be (x-1)^2)');

try {
  const expression = 'x^2 - 2x + 1';
  console.log(`Input: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  
  if (!ast) {
    throw new Error('No AST generated');
  }
  
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  
  console.log('Result value:', result.value);
  
  // Calculate discriminant for x^2 - 2x + 1
  const a = 1, b = -2, c = 1;
  const discriminant = b * b - 4 * a * c;
  console.log(`\nDiscriminant calculation for x^2 - 2x + 1:`);
  console.log(`Discriminant = b^2 - 4ac = (-2)^2 - 4(1)(1) = 4 - 4 = ${discriminant}`);
  console.log(`Since discriminant = 0, this should be (x-1)^2`);
  
} catch (error) {
  console.error('Error:', error);
}