import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('Testing cubic sum of cubes factorization: x^3 + 8');

try {
  const expression = 'x^3 + 8';
  console.log(`Input: ${expression}`);
  
  const parseResult = parseLatex(expression);
  const ast = parseResult.ast;
  console.log('Parse result:', parseResult);
  console.log('AST:', JSON.stringify(ast, null, 2));
  
  if (parseResult.error) {
    console.error('Parse error:', parseResult.error);
    throw new Error(parseResult.error);
  }
  
  if (!ast) {
    throw new Error('No AST generated');
  }
  
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  console.log('Analysis result:', result);
  console.log('Result value:', result.value);
  console.log('Result type:', result.valueType);
  console.log('Steps:', result.steps);
  console.log('Error:', result.error);
  
  console.log('\nExpected: (x + 2)(x^2 - 2x + 4)');
  console.log(`Got: ${result.value || 'undefined'}`);
  
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(50));
console.log('Testing quartic as quadratic: x^4 - 13x^2 + 36');

try {
  const expression = 'x^4 - 13x^2 + 36';
  console.log(`Input: ${expression}`);
  
  const ast = parseLatex(expression);
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  
  console.log('Result:', result.result);
  console.log('Type:', result.type);
  console.log('Steps:', result.steps);
  
  console.log('\nExpected: (x^2 - 4)(x^2 - 9)');
  console.log(`Got: ${result.result}`);
  
} catch (error) {
  console.error('Error:', error);
}

console.log('\n' + '='.repeat(50));
console.log('Testing perfect fourth power: x^4 + 4x^3 + 6x^2 + 4x + 1');

try {
  const expression = 'x^4 + 4x^3 + 6x^2 + 4x + 1';
  console.log(`Input: ${expression}`);
  
  const ast = parseLatex(expression);
  const result = analyze(ast, { task: 'factor', variable: 'x' });
  
  console.log('Result:', result.result);
  console.log('Type:', result.type);
  console.log('Steps:', result.steps);
  
  console.log('\nExpected: (x + 1)^4');
  console.log(`Got: ${result.result}`);
  
} catch (error) {
  console.error('Error:', error);
}