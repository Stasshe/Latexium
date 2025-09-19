import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('='.repeat(60));
console.log('INVESTIGATING AST STRUCTURE FROM CUBIC SUM STRATEGY');
console.log('='.repeat(60));

// Parse and inspect the cubic sum of cubes result
try {
  const expression = 'x^3 + 8';
  console.log(`\nOriginal expression: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  
  if (!ast) {
    throw new Error('No AST generated');
  }
  
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  console.log('Result:', result.value);
  
  // Look at the final AST structure
  console.log('\nFinal AST structure:');
  console.log(JSON.stringify(result.ast, null, 2));
  
  // Check if the right side (quadratic factor) is correctly constructed
  if (result.ast && result.ast.type === 'BinaryExpression' && result.ast.operator === '*') {
    const rightSide = result.ast.right;
    console.log('\nQuadratic factor AST:');
    console.log(JSON.stringify(rightSide, null, 2));
    
    // Convert this AST back to see what it represents
    console.log('\nTesting the extracted quadratic factor separately...');
    const quadResult = analyze(rightSide, { task: 'factor', variable: 'x' });
    console.log('Quadratic factorization result:', quadResult.value);
    console.log('Quadratic steps:', quadResult.steps);
  }
  
} catch (error) {
  console.error('Error:', error);
}

console.log('\n' + '='.repeat(60));
console.log('ANALYZING THE AST BUILDER ISSUE');
console.log('='.repeat(60));

// The issue might be in how ASTBuilder creates the quadratic factor
// Let's check if 2^2 is being created instead of just 4
console.log('The cubic strategy generates: x² - 2x + 2²');
console.log('But 2² should be simplified to 4');
console.log('If it remains as 2², that could confuse the polynomial analyzer');

try {
  const expression = 'x^2 - 2*x + 2^2';
  console.log(`\nTesting: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  
  if (!ast) {
    throw new Error('No AST generated');
  }
  
  console.log('AST for x² - 2x + 2²:');
  console.log(JSON.stringify(ast, null, 2));
  
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  console.log('Factorization result:', result.value);
  console.log('Steps:', result.steps);
  
} catch (error) {
  console.error('Error:', error);
}