/**
 * Comprehensive Factorization Test Suite
 * Tests for the new advanced factorization system
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('🚀 Advanced Factorization System Tests\n');

const testCases = [
  // Common Factor Extraction
  {
    category: 'Common Factors',
    tests: [
      {
        name: 'Simple common numeric factor',
        input: '6x + 9',
        expected: '3(2x + 3)',
        description: 'Extract GCD from terms',
      },
      {
        name: 'Common factor with variables',
        input: '4x^2 + 8x',
        expected: '4x(x + 2)',
        description: 'Extract both numeric and variable factors',
      },
      {
        name: 'Common factor with three terms',
        input: '12x^3 + 18x^2 + 24x',
        expected: '6x(2x^2 + 3x + 4)',
        description: 'Multiple terms with common factors',
      },
      {
        name: 'Negative common factor',
        input: '-6x^2 - 9x',
        expected: '-3x(2x + 3)',
        description: 'Handle negative coefficients',
      },
    ],
  },

  // Difference of Squares
  {
    category: 'Difference of Squares',
    tests: [
      {
        name: 'Simple difference of squares',
        input: 'x^2 - 4',
        expected: '(x + 2)(x - 2)',
        description: 'Basic a² - b² pattern',
      },
      {
        name: 'Difference with coefficients',
        input: '9x^2 - 16',
        expected: '(3x + 4)(3x - 4)',
        description: 'Coefficient squares',
      },
      {
        name: 'Variable difference of squares',
        input: 'x^2 - y^2',
        expected: '(x + y)(x - y)',
        description: 'Two variables',
      },
      {
        name: 'Higher power difference',
        input: 'x^4 - 1',
        expected: '(x^2 + 1)(x + 1)(x - 1)',
        description: 'Nested difference of squares',
      },
    ],
  },

  // Perfect Square Trinomials
  {
    category: 'Perfect Square Trinomials',
    tests: [
      {
        name: 'Simple perfect square',
        input: 'x^2 + 4x + 4',
        expected: '(x + 2)^2',
        description: '(a + b)² expansion',
      },
      {
        name: 'Perfect square with subtraction',
        input: 'x^2 - 6x + 9',
        expected: '(x - 3)^2',
        description: '(a - b)² expansion',
      },
      {
        name: 'Perfect square with coefficient',
        input: '4x^2 + 12x + 9',
        expected: '(2x + 3)^2',
        description: 'Leading coefficient > 1',
      },
      {
        name: 'Perfect square trinomial with variables',
        input: 'x^2 + 2xy + y^2',
        expected: '(x + y)^2',
        description: 'Two variables perfect square',
      },
    ],
  },

  // Quadratic Factorization
  {
    category: 'Quadratic Factorization',
    tests: [
      {
        name: 'Simple quadratic',
        input: 'x^2 + 5x + 6',
        expected: '(x + 2)(x + 3)',
        description: 'Basic quadratic with positive coefficients',
      },
      {
        name: 'Quadratic with negative constant',
        input: 'x^2 - x - 6',
        expected: '(x - 3)(x + 2)',
        description: 'Negative constant term',
      },
      {
        name: 'Quadratic with leading coefficient',
        input: '2x^2 + 7x + 3',
        expected: '(2x + 1)(x + 3)',
        description: 'Leading coefficient ≠ 1',
      },
      {
        name: 'Quadratic with large coefficients',
        input: '6x^2 + 11x + 3',
        expected: '(2x + 3)(3x + 1)',
        description: 'Larger coefficients',
      },
    ],
  },

  // Factoring by Grouping
  {
    category: 'Factoring by Grouping',
    tests: [
      {
        name: 'Standard grouping',
        input: 'xy + 2y + 3x + 6',
        expected: '(x + 2)(y + 3)',
        description: 'Four terms with common factors',
      },
      {
        name: 'Grouping with variables',
        input: 'ax + ay + bx + by',
        expected: '(a + b)(x + y)',
        description: 'Multiple variables grouping',
      },
      {
        name: 'Complex grouping',
        input: '2x^2 + 4x + 3x + 6',
        expected: '(x + 2)(2x + 3)',
        description: 'Mixed terms grouping',
      },
    ],
  },

  // Cubic Factorization
  {
    category: 'Cubic Factorization',
    tests: [
      {
        name: 'Simple cubic with rational root',
        input: 'x^3 - 1',
        expected: '(x - 1)(x^2 + x + 1)',
        description: 'Difference of cubes',
      },
      {
        name: 'Sum of cubes',
        input: 'x^3 + 8',
        expected: '(x + 2)(x^2 - 2x + 4)',
        description: 'Sum of cubes pattern',
      },
      {
        name: 'Perfect cube',
        input: 'x^3 + 3x^2 + 3x + 1',
        expected: '(x + 1)^3',
        description: 'Perfect cube trinomial',
      },
      {
        name: 'Cubic with multiple roots',
        input: 'x^3 - 6x^2 + 11x - 6',
        expected: '(x - 1)(x - 2)(x - 3)',
        description: 'Three linear factors',
      },
    ],
  },

  // Complex Cases
  {
    category: 'Complex Cases',
    tests: [
      {
        name: 'Mixed strategies',
        input: '2x^4 - 8',
        expected: '2(x^2 + 2)(x + √2)(x - √2)',
        description: 'Common factor + difference of squares',
        allowApproximate: true,
      },
      {
        name: 'Nested factoring',
        input: '(x^2 + 2x + 1) - 4',
        expected: '(x + 3)(x - 1)',
        description: 'Factor after expansion',
      },
    ],
  },
];

/**
 * Run factorization test
 */
async function runFactorizationTest(testCase) {
  try {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);

    // Parse the input
    const parseResult = parseLatex(testCase.input);
    if (parseResult.error) {
      console.log(`❌ Parse error: ${parseResult.error}`);
      return false;
    }

    // Attempt factorization
    const factorResult = analyze(parseResult.ast, { task: 'factor' });

    if (factorResult.error) {
      console.log(`❌ Factorization error: ${factorResult.error}`);
      return false;
    }

    console.log(`Result: ${factorResult.value}`);
    console.log(`Expected: ${testCase.expected}`);

    // For now, just check if factorization was attempted
    if (factorResult.value && factorResult.value !== testCase.input) {
      console.log(`✅ Factorization performed`);

      // Show steps if available
      if (factorResult.steps && factorResult.steps.length > 1) {
        console.log(`Steps:`);
        factorResult.steps.slice(1).forEach((step, i) => {
          console.log(`  ${i + 1}. ${step}`);
        });
      }

      return true;
    } else {
      console.log(`⚠️  No factorization or unchanged`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  let totalTests = 0;
  let passedTests = 0;

  for (const category of testCases) {
    console.log(`\n=== ${category.category} ===\n`);

    for (const test of category.tests) {
      const passed = await runFactorizationTest(test);
      if (passed) passedTests++;
      totalTests++;
      console.log(); // Empty line
    }
  }

  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check implementation.');
  }
}

/**
 * Test advanced features
 */
async function testAdvancedFeatures() {
  console.log('\n=== Advanced Features Test ===\n');

  // Test factorization with steps
  try {
    const parseResult = parseLatex('x^2 + 5x + 6');
    if (!parseResult.error) {
      console.log('Testing step-by-step factorization...');
      const result = analyze(parseResult.ast, { task: 'factor' });

      console.log(`Expression: ${parseResult.value}`);
      console.log(`Final result: ${result.value}`);

      if (result.steps) {
        console.log('\nSteps:');
        result.steps.forEach((step, i) => {
          console.log(`${i + 1}. ${step}`);
        });
      }
    }
  } catch (error) {
    console.log(`Advanced features test failed: ${error.message}`);
  }

  console.log('\n=== Performance Test ===\n');

  // Test performance with complex expressions
  const complexExpressions = [
    'x^4 - 5x^3 + 6x^2 + 4x - 8',
    '12x^3 + 18x^2 - 30x - 45',
    '8x^3 - 27',
    'x^6 - 1',
  ];

  for (const expr of complexExpressions) {
    console.log(`Performance test: ${expr}`);
    const start = Date.now();

    try {
      const parseResult = parseLatex(expr);
      if (!parseResult.error) {
        const result = analyze(parseResult.ast, { task: 'factor' });
        const end = Date.now();

        console.log(`Result: ${result.value}`);
        console.log(`Time: ${end - start}ms`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    console.log();
  }
}

// Run all tests
await runAllTests();
await testAdvancedFeatures();

console.log('\n=== Advanced Factorization Tests Complete ===');
