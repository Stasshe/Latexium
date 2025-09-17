import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Equation Solver Tests ===\n');

const tests = [
  { name: 'Linear equation: 2x + 3', expr: '2 * x + 3', var: 'x' },
  { name: 'Linear equation: 5x - 10', expr: '5 * x - 10', var: 'x' },
  { name: 'Quadratic: x^2 - 4', expr: 'x^2 - 4', var: 'x' },
  { name: 'Quadratic: x^2 + 2x + 1', expr: 'x^2 + 2 * x + 1', var: 'x' },
  { name: 'Quadratic: 2x^2 - 5x + 2', expr: '2 * x^2 - 5 * x + 2', var: 'x' },
  { name: 'Constant: 5', expr: '5', var: 'x' }
];

let passed = 0;

for (const test of tests) {
  console.log(`Test: ${test.name} = 0`);
  
  try {
    const parseResult = parseLatex(test.expr);
    
    if (parseResult.error) {
      console.log(`❌ Parse failed: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, {
      task: 'solve',
      variable: test.var
    });
    
    if (analyzeResult.error) {
      console.log(`❌ Analysis failed: ${analyzeResult.error}`);
      continue;
    }
    
    console.log(`✅ Solutions: ${analyzeResult.value}`);
    console.log(`Steps: ${analyzeResult.steps.join(' → ')}`);
    passed++;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

console.log(`Passed: ${passed}/${tests.length} tests`);