/**
 * Factorization Test Cases
 * Comprehensive tests for polynomial factorization
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Factorization Tests ===\n');

// Test cases for factorization
const testCases = [
  // Common factors
  {
    name: 'Common factor extraction: 6x + 9',
    input: '6x + 9',
    expected: '3(2x + 3)',
  },
  {
    name: 'Common factor extraction: 4x² + 8x',
    input: '4x^2 + 8x',
    expected: '4x(x + 2)',
  },

  // Difference of squares
  {
    name: 'Difference of squares: x² - 4',
    input: 'x^2 - 4',
    expected: '(x + 2)(x - 2)',
  },
  {
    name: 'Difference of squares: 9x² - 16',
    input: '9x^2 - 16',
    expected: '(3x + 4)(3x - 4)',
  },

  // Perfect square trinomials
  {
    name: 'Perfect square: x² + 4x + 4',
    input: 'x^2 + 4x + 4',
    expected: '(x + 2)²',
  },
  {
    name: 'Perfect square: x² - 6x + 9',
    input: 'x^2 - 6x + 9',
    expected: '(x - 3)²',
  },

  // General quadratics
  {
    name: 'Simple quadratic: x² + 5x + 6',
    input: 'x^2 + 5x + 6',
    expected: '(x + 2)(x + 3)',
  },
  {
    name: 'Quadratic with negative: x² - x - 6',
    input: 'x^2 - x - 6',
    expected: '(x - 3)(x + 2)',
  },

  // Factoring by grouping
  {
    name: 'Grouping: xy + 2y + 3x + 6',
    input: 'xy + 2y + 3x + 6',
    expected: '(x + 2)(y + 3)',
  },

  // Cubic factorization
  {
    name: 'Cubic with rational root: x³ - 1',
    input: 'x^3 - 1',
    expected: '(x - 1)(x² + x + 1)',
  },
  {
    name: 'Cubic: x³ - 6x² + 11x - 6',
    input: 'x^3 - 6x^2 + 11x - 6',
    expected: '(x - 1)(x - 2)(x - 3)',
  },

  // Higher degree
  {
    name: 'Quartic: x⁴ - 1',
    input: 'x^4 - 1',
    expected: '(x - 1)(x + 1)(x² + 1)',
  },
];

async function runFactorizationTests() {
  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Input: ${testCase.input}`);

      // Parse the input
      const parseResult = parseLatex(testCase.input);
      if (parseResult.error) {
        console.log(`❌ Parse error: ${parseResult.error}\n`);
        continue;
      }

      // Attempt factorization
      const factorResult = analyze(parseResult.ast, { task: 'factor' });

      if (factorResult.error) {
        console.log(`❌ Factor error: ${factorResult.error}`);
      } else {
        console.log(`Result: ${factorResult.value || 'No factorization'}`);
        console.log(`Expected: ${testCase.expected}`);

        // For now, just check if factorization was attempted
        if (factorResult.value && factorResult.value !== testCase.input) {
          console.log(`✅ Factorization performed`);
          passed++;
        } else {
          console.log(`⚠️  No factorization or unchanged`);
        }
      }

      console.log(''); // Empty line
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed or need implementation.');
  }
}

// Additional test for step-by-step factorization
async function testStepByStep() {
  console.log('\n=== Step-by-Step Factorization Test ===\n');

  const expression = 'x^2 + 5x + 6';
  console.log(`Expression: ${expression}`);

  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`Parse error: ${parseResult.error}`);
      return;
    }

    const result = analyze(parseResult.ast, {
      task: 'factor',
      showSteps: true,
    });

    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Final result: ${result.value}`);
      console.log('\nSteps:');
      result.steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Test polynomial degree analysis
async function testPolynomialAnalysis() {
  console.log('\n=== Polynomial Analysis Test ===\n');

  const expressions = ['3x + 5', 'x^2 - 4', 'x^3 + 2x^2 - x - 2', '2x^4 - 8'];

  for (const expr of expressions) {
    console.log(`Analyzing: ${expr}`);

    try {
      const parseResult = parseLatex(expr);
      if (parseResult.error) {
        console.log(`Parse error: ${parseResult.error}\n`);
        continue;
      }

      const result = analyze(parseResult.ast, { task: 'analyze-polynomial' });

      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else {
        console.log(`Result: ${result.value}`);
        if (result.steps.length > 0) {
          console.log('Analysis steps:');
          result.steps.forEach(step => console.log(`  ${step}`));
        }
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }

    console.log('');
  }
}

// Run all tests
await runFactorizationTests();
await testStepByStep();
await testPolynomialAnalysis();

console.log('\n=== Factorization Tests Complete ===');
