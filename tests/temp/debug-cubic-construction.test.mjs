import { parseLatex, analyze } from '../../dist/index.esm.js';

// Test the specific cubic sum of cubes construction step by step
console.log('Debugging cubic sum of cubes construction');

// Let's build x^2 - 2x + 4 manually and see what it produces
try {
  const expression = 'x^2 - 2*x + 4';
  console.log(`Input: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  console.log('AST for x^2 - 2*x + 4:', JSON.stringify(ast, null, 2));
  
  if (ast) {
    const result = analyze(ast, { task: 'factor', variable: 'x' });
    console.log('Factorization result:', result.value);
    console.log('Steps:', result.steps);
  }
  
} catch (error) {
  console.error('Error:', error);
}

console.log('\n' + '='.repeat(50));
console.log('Testing (x + 2) * (x^2 - 2*x + 4) expansion to verify formula');

try {
  const expression = '(x + 2) * (x^2 - 2*x + 4)';
  console.log(`Input: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  
  if (ast) {
    const result = analyze(ast, { task: 'distribute', variable: 'x' });
    console.log('Distribution result:', result.value);
    console.log('This should equal x^3 + 8 if the formula is correct');
  }
  
} catch (error) {
  console.error('Error:', error);
}