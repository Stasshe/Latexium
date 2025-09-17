import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== AUTOMATIC VARIABLE INFERENCE TESTS ===\n');

const variableInferenceTests = [
  // Single variable cases - should automatically detect
  {
    name: 'Single variable x',
    expression: 'x^2 + 3*x + 2',
    task: 'differentiate',
    description: 'Should auto-detect x as the variable'
  },
  {
    name: 'Single variable y',
    expression: 'y^3 - 2*y',
    task: 'differentiate', 
    description: 'Should auto-detect y as the variable'
  },
  {
    name: 'Single variable t',
    expression: '\\sin(t) + \\cos(t)',
    task: 'integrate',
    description: 'Should auto-detect t as the variable'
  },
  {
    name: 'Single variable equation',
    expression: 'a^2 - 4',
    task: 'solve',
    description: 'Should auto-detect a as the solve variable'
  },
  
  // Multiple variable cases - should use priority order
  {
    name: 'Multiple variables with x priority',
    expression: 'x*y + z',
    task: 'differentiate',
    description: 'Should prioritize x over y, z'
  },
  {
    name: 'Multiple variables with y priority',
    expression: 'y*z + t',
    task: 'differentiate',
    description: 'Should prioritize y over z, t'
  },
  {
    name: 'Multiple variables alphabetical',
    expression: 'a*b + c',
    task: 'differentiate',
    description: 'Should pick first alphabetically (a)'
  },
  
  // Explicit variable specification (should override auto-detection)
  {
    name: 'Explicit variable override',
    expression: 'x*y + z',
    task: 'differentiate',
    variable: 'y',
    description: 'Should use explicitly specified y instead of auto-detected x'
  },
  
  // No variable cases
  {
    name: 'Constant expression',
    expression: '5 + 3',
    task: 'differentiate',
    description: 'Should default to x for constants'
  }
];

console.log('Testing automatic variable inference...\n');

let passedTests = 0;
let totalTests = 0;

for (const test of variableInferenceTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Task: ${test.task}`);
  console.log(`Description: ${test.description}`);
  
  if (test.variable) {
    console.log(`Explicit variable: ${test.variable}`);
  }
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE FAILED: ${parseResult.error}`);
      totalTests++;
      console.log('');
      continue;
    }
    
    const options = {
      task: test.task,
      ...(test.variable && { variable: test.variable })
    };
    
    const analyzeResult = analyze(parseResult.ast, options);
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYSIS FAILED: ${analyzeResult.error}`);
    } else {
      console.log(`✅ SUCCESS: ${analyzeResult.value}`);
      console.log(`📝 Steps: ${analyzeResult.steps[0]}`); // Show first step which includes variable info
      passedTests++;
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
  
  totalTests++;
  console.log('');
}

console.log('=== VARIABLE INFERENCE SUMMARY ===');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}`);
console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All variable inference tests passed!');
} else {
  console.log('⚠️  Some variable inference tests failed.');
}

// Test specific inference scenarios
console.log('\n=== VARIABLE PRIORITY TESTS ===\n');

const priorityTests = [
  {
    name: 'x beats y',
    expression: 'x + y',
    expected: 'x'
  },
  {
    name: 'y beats z',
    expression: 'y + z',
    expected: 'y'
  },
  {
    name: 'x beats everything',
    expression: 'x + y + z + t + u + v + w',
    expected: 'x'
  },
  {
    name: 'no priority variables',
    expression: 'a + b + c',
    expected: 'a'
  }
];

console.log('Testing variable priority logic...\n');

for (const test of priorityTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Expected variable: ${test.expected}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE FAILED: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, { task: 'differentiate' });
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYSIS FAILED: ${analyzeResult.error}`);
    } else {
      // Check if the expected variable was used
      const stepText = analyzeResult.steps[0] || '';
      if (stepText.includes(test.expected)) {
        console.log(`✅ CORRECT: Used variable '${test.expected}' as expected`);
      } else {
        console.log(`❌ INCORRECT: Expected '${test.expected}', but got different variable`);
        console.log(`   Step: ${stepText}`);
      }
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
  
  console.log('');
}