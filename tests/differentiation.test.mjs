import { analyze, parseLatex } from '../dist/index.esm.js';

console.log('=== Differentiation Engine Tests ===\n');

// Basic differentiation tests
const tests = [
  {
    name: 'Constant',
    expression: '5',
    variable: 'x',
    expected: '0',
  },
  {
    name: 'Variable',
    expression: 'x',
    variable: 'x',
    expected: '1',
  },
  {
    name: 'Linear function',
    expression: '3 * x + 2',
    variable: 'x',
    expected: '3',
  },
  {
    name: 'Quadratic function',
    expression: 'x^2',
    variable: 'x',
    expected: '2x',
  },
  {
    name: 'Power rule',
    expression: 'x^3',
    variable: 'x',
    expected: '3x^2',
  },
  {
    name: 'Product rule',
    expression: 'x * \\sin(x)',
    variable: 'x',
    expected: '\\sin(x) + x \\cos(x)',
  },
  {
    name: 'Chain rule - sine',
    expression: '\\sin(2 * x)',
    variable: 'x',
    expected: '2 \\cos(2x)',
  },
  {
    name: 'Chain rule - exponential',
    expression: '\\exp(x^2)',
    variable: 'x',
    expected: '2x \\exp(x^2)',
  },
  {
    name: 'Quotient rule',
    expression: '\\frac{x}{x^2 + 1}',
    variable: 'x',
    expected: '\\frac{x^2 + 1 - x \\cdot 2x}{(x^2 + 1)^2}',
  },
  {
    name: 'Trigonometric functions',
    expression: '\\cos(x)',
    variable: 'x',
    expected: '-\\sin(x)',
  },
  {
    name: 'Logarithmic function',
    expression: '\\ln(x)',
    variable: 'x',
    expected: '\\frac{1}{x}',
  },
];

let passedTests = 0;
let totalTests = tests.length;

for (const test of tests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Variable: ${test.variable}`);

  try {
    const parseResult = parseLatex(test.expression);

    if (parseResult.error) {
      console.log(`❌ Parse failed: ${parseResult.error}`);
      continue;
    }

    const analyzeResult = analyze(parseResult.ast, {
      task: 'differentiate',
      variable: test.variable,
    });

    if (analyzeResult.error) {
      console.log(`❌ Analysis failed: ${analyzeResult.error}`);
      continue;
    }

    console.log(`✅ Result: ${analyzeResult.value}`);
    console.log(`Steps: ${analyzeResult.steps.join(' → ')}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
}

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('🎉 All differentiation tests passed!');
} else {
  console.log(`❌ ${totalTests - passedTests} tests failed`);
}
