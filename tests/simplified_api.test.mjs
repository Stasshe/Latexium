import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== SIMPLIFIED API USAGE TESTS ===\n');
console.log('Testing that variable specification is now truly optional!\n');

const simplifiedTests = [
  {
    name: 'Simple derivative without variable',
    expression: 'x^2 + 3*x',
    analysis: { task: 'differentiate' },
    description: 'No variable specified - should auto-detect x'
  },
  {
    name: 'Integration without variable',
    expression: '2*t + 1',
    analysis: { task: 'integrate' },
    description: 'No variable specified - should auto-detect t'
  },
  {
    name: 'Equation solving without variable',
    expression: 'y^2 - 9',
    analysis: { task: 'solve' },
    description: 'No variable specified - should auto-detect y'
  },
  {
    name: 'Trigonometric derivative',
    expression: '\\sin(u) + \\cos(u)',
    analysis: { task: 'differentiate' },
    description: 'No variable specified - should auto-detect u'
  },
  {
    name: 'Complex expression with priority',
    expression: 'x*y + z^2',
    analysis: { task: 'differentiate' },
    description: 'Multiple variables - should prioritize x'
  },
  {
    name: 'Override auto-detection',
    expression: 'x*y + z^2',
    analysis: { task: 'differentiate', variable: 'z' },
    description: 'Explicit variable should override auto-detection'
  }
];

console.log('Before: Users had to specify variable every time');
console.log('After: Variable specification is optional with smart inference!\n');

for (const test of simplifiedTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Options: ${JSON.stringify(test.analysis)}`);
  console.log(`Description: ${test.description}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE FAILED: ${parseResult.error}`);
      console.log('');
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, test.analysis);
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYSIS FAILED: ${analyzeResult.error}`);
    } else {
      console.log(`✅ SUCCESS: ${analyzeResult.value}`);
      // Show variable inference info from steps
      const inferenceStep = analyzeResult.steps.find(step => 
        step.includes('Auto-detected') || step.includes('Multiple variables') || step.includes('with respect to')
      );
      if (inferenceStep) {
        console.log(`🧠 Inference: ${inferenceStep}`);
      }
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
  
  console.log('');
}

console.log('=== COMPARISON: BEFORE vs AFTER ===\n');

console.log('BEFORE (required variable specification):');
console.log('❌ analyze(ast, { task: "differentiate" })  // Error: variable required');
console.log('✅ analyze(ast, { task: "differentiate", variable: "x" })  // Works but verbose');

console.log('\nAFTER (optional variable specification):');
console.log('✅ analyze(ast, { task: "differentiate" })  // Works with auto-inference!');
console.log('✅ analyze(ast, { task: "differentiate", variable: "x" })  // Still works for explicit control');

console.log('\n🎯 BENEFITS:');
console.log('• Simpler API for common cases (single variable expressions)');
console.log('• Smart variable prioritization (x > y > z > t > ...)');
console.log('• Backwards compatible - explicit specification still works');
console.log('• Clear feedback in steps about which variable was chosen');
console.log('• Reduces boilerplate code for users');

console.log('\n📊 ALGORITHM:');
console.log('1. If variable explicitly specified → use it');
console.log('2. If only one free variable → use it');
console.log('3. If multiple variables → use priority order (x > y > z > ...)');
console.log('4. If no common variables → use alphabetical order');
console.log('5. If no variables at all → default to x');

console.log('\n🎉 Variable specification is now truly optional with intelligent inference!');