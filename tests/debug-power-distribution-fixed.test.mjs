import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Testing power distribution with improved variable simplification...\n');

// Test case 1: (x-1)^10 - (x+1)^10 (should not expand due to size limit)
const testExpression = '(x-1)^{10} - (x+1)^{10}';
console.log('Input:', testExpression);

try {
  const ast = parseLatex(testExpression);
  console.log('Parsed correctly');
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Distribution result:', result.value);
  console.log('Steps:', result.steps);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n--- Testing simpler case: (x-1)^2 ---');
const simpleTest = '(x-1)^2';
console.log('Input:', simpleTest);

try {
  const ast = parseLatex(simpleTest);
  console.log('Parsed correctly');
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Distribution result:', result.value);
  console.log('Steps:', result.steps);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n--- Testing (x+1)^3 ---');
const cubeTest = '(x+1)^3';
console.log('Input:', cubeTest);

try {
  const ast = parseLatex(cubeTest);
  console.log('Parsed correctly');
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Distribution result:', result.value);
  console.log('Steps:', result.steps);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n--- Testing (x+1)^4 ---');
const fourthTest = '(x+1)^4';
console.log('Input:', fourthTest);

try {
  const ast = parseLatex(fourthTest);
  console.log('Parsed correctly');
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Distribution result:', result.value);
  console.log('Steps:', result.steps);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n--- Testing (x+1)^5 (should not expand) ---');
const fifthTest = '(x+1)^5';
console.log('Input:', fifthTest);

try {
  const ast = parseLatex(fifthTest);
  console.log('Parsed correctly');
  
  const result = analyze(ast.ast, { task: 'distribute' });
  console.log('Distribution result:', result.value);
  console.log('Steps:', result.steps);
} catch (error) {
  console.error('Error:', error.message);
}