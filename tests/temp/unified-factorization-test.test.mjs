/**
 * Test cases for the new unified factorization system
 * Tests the integration of middle-simplify with pattern recognition and advanced factorization
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Testing New Unified Factorization System ===\n');

// Test cases for middle-simplify (polynomial-only)
const middleSimplifyTests = [
  {
    name: 'Basic polynomial expansion',
    input: '(x + 1)(x - 1)',
    task: 'distribute',
    expected: 'x^2 - 1'
  },
  {
    name: 'Polynomial fraction without factorization',
    input: '\\frac{2x + 4}{x + 2}',
    task: 'distribute',
    expected: '2'  // Should simplify without factorization
  },
  {
    name: 'Complex polynomial',
    input: '2x^3 + 4x^2 - 6x',
    task: 'distribute',
    expected: '2x^3 + 4x^2 - 6x'  // No factorization in middle-simplify
  }
];

// Test cases for pattern recognition
const patternRecognitionTests = [
  {
    name: 'Common factor recognition',
    input: '6x^2 + 9x + 3',
    task: 'factor',
    expected: '3(2x^2 + 3x + 1)'
  },
  {
    name: 'Difference of squares',
    input: 'x^2 - 4',
    task: 'factor',
    expected: '(x - 2)(x + 2)'
  },
  {
    name: 'Perfect square (future)',
    input: 'x^2 + 2x + 1',
    task: 'factor',
    expected: '(x + 1)^2'
  }
];

// Test cases for unified system integration
const unifiedTests = [
  {
    name: 'Polynomial fraction with factorization',
    input: '\\frac{x^2 - 1}{x + 1}',
    task: 'factor',
    expected: 'x - 1'
  },
  {
    name: 'Complex factorization and simplification',
    input: '\\frac{2x^2 + 4x + 2}{x + 1}',
    task: 'factor',
    expected: '2(x + 1)'
  },
  {
    name: 'Mixed operations',
    input: '(x^2 - 4) + (x + 2)',
    task: 'factor',
    expected: '(x - 2)(x + 2) + (x + 2)'  // Should factor the first term
  }
];

async function runTests(testSuite, suiteName) {
  console.log(`\\n--- ${suiteName} ---`);
  let passed = 0;
  let total = testSuite.length;

  for (const test of testSuite) {
    try {
      console.log(`\\nTest: ${test.name}`);
      console.log(`Input: ${test.input}`);
      console.log(`Task: ${test.task}`);
      
      const parseResult = parseLatex(test.input);
      if (parseResult.error) {
        console.log(`❌ Parse Error: ${parseResult.error}`);
        continue;
      }

      const result = analyze(parseResult.ast, { task: test.task });
      console.log(`Result: ${JSON.stringify(result)}`);
      
      if (result.result) {
        console.log(`✅ Success`);
        passed++;
      } else {
        console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }

  console.log(`\\n${suiteName} Results: ${passed}/${total} tests passed`);
  return { passed, total };
}

async function main() {
  try {
    // Test middle-simplify functionality
    const middleResults = await runTests(middleSimplifyTests, 'Middle-Simplify Tests');
    
    // Test pattern recognition
    const patternResults = await runTests(patternRecognitionTests, 'Pattern Recognition Tests');
    
    // Test unified system
    const unifiedResults = await runTests(unifiedTests, 'Unified System Tests');

    // Summary
    const totalPassed = middleResults.passed + patternResults.passed + unifiedResults.passed;
    const totalTests = middleResults.total + patternResults.total + unifiedResults.total;

    console.log('\\n=== Final Summary ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalTests - totalPassed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

    if (totalPassed === totalTests) {
      console.log('\\n🎉 All tests passed! New factorization system is working correctly.');
    } else {
      console.log('\\n⚠️  Some tests failed. Review the implementation.');
    }

  } catch (error) {
    console.error('Test execution error:', error);
  }
}

main().catch(console.error);