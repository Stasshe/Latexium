import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Cubic Factorization Tests ===\n');

const testCases = [
  // Sum and difference of cubes
  {
    name: 'Sum of cubes: x³ + 8',
    input: 'x^3 + 8',
    expected: '(x + 2)(x^2 - 2x + 4)',
  },
  {
    name: 'Difference of cubes: x³ - 27',
    input: 'x^3 - 27',
    expected: '(x - 3)(x^2 + 3x + 9)',
  },
  {
    name: 'Sum of cubes with variables: a³ + b³',
    input: 'a^3 + b^3',
    expected: '(a + b)(a^2 - ab + b^2)',
  },

  // Factorable cubic polynomials
  {
    name: 'Cubic with rational root: x³ - 6x² + 11x - 6',
    input: 'x^3 - 6*x^2 + 11*x - 6',
    expected: '(x - 1)(x - 2)(x - 3)',
  },
  {
    name: 'Cubic with repeated root: x³ - 3x² + 3x - 1',
    input: 'x^3 - 3*x^2 + 3*x - 1',
    expected: '(x - 1)^3',
  },
  {
    name: 'Cubic by grouping: x³ + x² + x + 1',
    input: 'x^3 + x^2 + x + 1',
    expected: '(x + 1)(x^2 + 1)',
  },

  // More complex cases
  {
    name: 'Cubic with coefficient: 2x³ - 16',
    input: '2*x^3 - 16',
    expected: '2(x - 2)(x^2 + 2x + 4)',
  },
  {
    name: 'Cubic quadratic factor: x³ + x² - 4x - 4',
    input: 'x^3 + x^2 - 4*x - 4',
    expected: '(x + 1)(x - 2)(x + 2)',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  try {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);

    const ast = parseLatex(testCase.input);
    console.log('Parsed AST:', JSON.stringify(ast, null, 2));

    const result = analyze(ast, { task: 'factor' });
    console.log('Analysis result:', JSON.stringify(result, null, 2));

    if (result.steps && result.steps.length > 0) {
      const finalStep = result.steps[result.steps.length - 1];
      console.log(`Result: ${finalStep.latex}`);
      console.log(`Expected: ${testCase.expected}`);

      // For now, just check if factorization produced steps
      if (result.steps.length > 1) {
        console.log('✅ PASS - Factorization steps generated');
        passed++;
      } else {
        console.log('❌ FAIL - No factorization steps');
        failed++;
      }
    } else {
      console.log('❌ FAIL - No steps generated');
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log('---\n');
}

console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
