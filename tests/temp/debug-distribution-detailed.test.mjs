import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Debugging distribution step by step...\n');

const testCases = [
  '(x+2)^4',
  '(x-3)^3',
  '(2a+b)^3',
];

for (const expr of testCases) {
  console.log(`\n=== Testing: ${expr} ===`);
  
  try {
    const ast = parseLatex(expr);
    console.log('Parsed AST:', JSON.stringify(ast.ast, null, 2));
    
    const result = analyze(ast.ast, { task: 'distribute' });
    console.log('Final result:', result.value);
    console.log('Steps:');
    for (let i = 0; i < result.steps.length; i++) {
      console.log(`  ${i + 1}. ${result.steps[i]}`);
    }
    
    console.log('Final AST:', JSON.stringify(result.ast, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}