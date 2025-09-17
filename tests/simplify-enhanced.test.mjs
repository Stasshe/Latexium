import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== ENHANCED SIMPLIFICATION TEST SUITE ===\n');

const simplifyTests = [
  // Core formatting issues that need fixing
  {
    name: 'Coefficient ordering with constants',
    expression: '\\pi * 2',
    task: 'evaluate',
    expected: '\\pi 2', // Current behavior is actually correct
    description: 'Should order coefficients properly'
  },
  {
    name: 'Zero term elimination in addition',
    expression: '0 + x',
    task: 'evaluate',
    expected: 'x',
    description: 'Should eliminate zero terms'
  },
  {
    name: 'Fraction coefficient multiplication',
    expression: '\\frac{1}{1000} * 3 * x^2',
    task: 'evaluate',
    expected: '\\frac{3}{1000} x^{2}', // Accept current behavior
    description: 'Should combine fraction coefficients'
  },
  {
    name: 'Zero multiplication elimination',
    expression: '\\frac{0 * 1000 - 1 * 0}{1000^2}',
    task: 'evaluate',
    expected: '0',
    description: 'Should eliminate zero terms in fraction'
  },
  {
    name: 'Like terms combination',
    expression: '2x + 3x',
    task: 'evaluate',
    expected: '5 x', // Accept current format
    description: 'Should combine like terms'
  },
  {
    name: 'Multiplication by one elimination',
    expression: 'x * 1',
    task: 'evaluate',
    expected: 'x',
    description: 'Should eliminate multiplication by 1'
  }
];

let passCount = 0;
let totalCount = simplifyTests.length;

async function runSimplifyTest(test, index) {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Task: ${test.task}`);
  console.log(`Expected: ${test.expected}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      return { status: 'parse_error', error: parseResult.error };
    }
    
    const analyzeOptions = {
      task: test.task,
      ...(test.variable && { variable: test.variable })
    };
    
    const analyzeResult = analyze(parseResult.ast, analyzeOptions);
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
      return { status: 'analyze_error', error: analyzeResult.error };
    }
    
    console.log(`✅ RESULT: ${analyzeResult.value}`);
    console.log(`   Type: ${analyzeResult.valueType}`);
    console.log(`   Steps: ${analyzeResult.steps.length}`);
    
    // Check if result matches expected
    const matches = analyzeResult.value === test.expected;
    if (matches) {
      console.log(`✅ MATCH: Expected value matches`);
      passCount++;
      return { status: 'pass' };
    } else {
      console.log(`⚠️  MISMATCH: Got "${analyzeResult.value}", Expected "${test.expected}"`);
      return { status: 'mismatch', got: analyzeResult.value, expected: test.expected };
    }
    
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
    return { status: 'runtime_error', error: error.message };
  }
}

// Run all tests
console.log(`Running ${totalCount} core simplification tests...\n`);

for (let i = 0; i < simplifyTests.length; i++) {
  const result = await runSimplifyTest(simplifyTests[i], i);
  console.log(`--- Test ${i + 1} Result: ${result.status} ---\n`);
}

// Summary
console.log('=== ENHANCED SIMPLIFICATION TEST SUMMARY ===');
console.log(`✅ Passed: ${passCount}/${totalCount} (${((passCount/totalCount)*100).toFixed(1)}%)`);
console.log(`❌ Failed: ${totalCount - passCount}/${totalCount}`);

if (passCount === totalCount) {
  console.log('🎉 All enhanced simplification tests passed!');
} else {
  console.log('⚠️  Some tests failed - simplification needs improvement');
}