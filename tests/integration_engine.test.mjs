import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Integration Engine Tests ===\n');

const tests = [
  { name: 'Constant', expr: '5', var: 'x' },
  { name: 'Variable', expr: 'x', var: 'x' },
  { name: 'Power rule', expr: 'x^2', var: 'x' },
  { name: 'Sine function', expr: '\\sin(x)', var: 'x' },
  { name: 'Cosine function', expr: '\\cos(x)', var: 'x' }
];

let passed = 0;

for (const test of tests) {
  console.log(`Test: ${test.name} - ${test.expr}`);
  
  try {
    const parseResult = parseLatex(test.expr);
    
    if (parseResult.error) {
      console.log(`❌ Parse failed: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, {
      task: 'integrate',
      variable: test.var
    });
    
    if (analyzeResult.error) {
      console.log(`❌ Analysis failed: ${analyzeResult.error}`);
      continue;
    }
    
    console.log(`✅ Result: ${analyzeResult.value}`);
    passed++;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

console.log(`Passed: ${passed}/${tests.length} tests`);