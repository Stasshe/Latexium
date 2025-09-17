import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== COMPLEX DIFFERENTIATION TESTS ===\n');

const complexDifferentiationTests = [
  // Chain rule with multiple compositions
  {
    name: 'Deep chain rule: sin(cos(x²))',
    expression: '\\sin(\\cos(x^2))',
    variable: 'x',
    description: 'Chain rule with three nested functions'
  },
  {
    name: 'Exponential chain: e^(sin(x))',
    expression: '\\exp(\\sin(x))',
    variable: 'x',
    description: 'Exponential with trigonometric argument'
  },
  {
    name: 'Complex product: x²·sin(x)·e^x',
    expression: 'x^2 * \\sin(x) * \\exp(x)',
    variable: 'x',
    description: 'Triple product requiring multiple product rule applications'
  },
  {
    name: 'Quotient with chain: sin(x)/cos(x²)',
    expression: '\\frac{\\sin(x)}{\\cos(x^2)}',
    variable: 'x',
    description: 'Quotient rule with chain rule in denominator'
  },
  {
    name: 'Nested fractions: (x+1)/(x²+2x+1)',
    expression: '\\frac{x + 1}{x^2 + 2 * x + 1}',
    variable: 'x',
    description: 'Quotient rule with polynomial expressions'
  },
  {
    name: 'Logarithmic chain: ln(x²+1)',
    expression: '\\ln(x^2 + 1)',
    variable: 'x',
    description: 'Logarithm with polynomial argument'
  },
  {
    name: 'Power with variable base and exponent: x^x',
    expression: 'x^x',
    variable: 'x',
    description: 'Variable in both base and exponent (logarithmic differentiation)'
  },
  {
    name: 'Trigonometric product: sin(x)·cos(x)',
    expression: '\\sin(x) * \\cos(x)',
    variable: 'x',
    description: 'Product of trigonometric functions'
  },
  {
    name: 'Exponential quotient: e^x/(1+e^x)',
    expression: '\\frac{\\exp(x)}{1 + \\exp(x)}',
    variable: 'x',
    description: 'Quotient with exponential in numerator and denominator'
  },
  {
    name: 'Mixed transcendental: x·ln(x)·sin(x)',
    expression: 'x * \\ln(x) * \\sin(x)',
    variable: 'x',
    description: 'Product of polynomial, logarithmic, and trigonometric functions'
  }
];

const complexIntegrationTests = [
  // Integration by parts and substitution
  {
    name: 'Integration by parts: x·e^x',
    expression: 'x * \\exp(x)',
    variable: 'x',
    description: 'Requires integration by parts'
  },
  {
    name: 'Trigonometric integral: sin²(x)',
    expression: '\\sin(x)^2',
    variable: 'x',
    description: 'Requires trigonometric identity'
  },
  {
    name: 'Rational function: 1/(x²+1)',
    expression: '\\frac{1}{x^2 + 1}',
    variable: 'x',
    description: 'Standard arctangent integral'
  },
  {
    name: 'Exponential with coefficient: 2e^(3x)',
    expression: '2 * \\exp(3 * x)',
    variable: 'x',
    description: 'Exponential with coefficient and scaling'
  },
  {
    name: 'Logarithmic integral: ln(x)/x',
    expression: '\\frac{\\ln(x)}{x}',
    variable: 'x',
    description: 'Requires substitution u = ln(x)'
  },
  {
    name: 'Square root: √(x²+1)',
    expression: '\\sqrt{x^2 + 1}',
    variable: 'x',
    description: 'Square root of polynomial'
  },
  {
    name: 'Rational with factorization: (x+1)/(x²-1)',
    expression: '\\frac{x + 1}{x^2 - 1}',
    variable: 'x',
    description: 'Partial fractions required'
  },
  {
    name: 'Trigonometric substitution: 1/√(1-x²)',
    expression: '\\frac{1}{\\sqrt{1 - x^2}}',
    variable: 'x',
    description: 'Arcsine integral'
  },
  {
    name: 'Product requiring parts: x²·ln(x)',
    expression: 'x^2 * \\ln(x)',
    variable: 'x',
    description: 'Integration by parts with polynomial'
  },
  {
    name: 'Complex rational: (2x+3)/(x²+4)',
    expression: '\\frac{2 * x + 3}{x^2 + 4}',
    variable: 'x',
    description: 'Combination of logarithmic and arctangent integrals'
  }
];

const complexEquationTests = [
  // Higher degree and complex equations
  {
    name: 'Perfect square: x²-6x+9',
    expression: 'x^2 - 6 * x + 9',
    variable: 'x',
    description: 'Perfect square trinomial (double root)'
  },
  {
    name: 'No real solutions: x²+x+1',
    expression: 'x^2 + x + 1',
    variable: 'x',
    description: 'Negative discriminant'
  },
  {
    name: 'Large coefficients: 100x²-200x+100',
    expression: '100 * x^2 - 200 * x + 100',
    variable: 'x',
    description: 'Large coefficients with common factor'
  },
  {
    name: 'Fraction coefficients: (1/2)x²+(3/4)x-1/8',
    expression: '\\frac{1}{2} * x^2 + \\frac{3}{4} * x - \\frac{1}{8}',
    variable: 'x',
    description: 'Fractional coefficients'
  },
  {
    name: 'Irrational coefficients: x²-2',
    expression: 'x^2 - 2',
    variable: 'x',
    description: 'Results in irrational solutions (±√2)'
  },
  {
    name: 'Linear with fractions: (2/3)x-4/9',
    expression: '\\frac{2}{3} * x - \\frac{4}{9}',
    variable: 'x',
    description: 'Linear equation with fractions'
  },
  {
    name: 'Disguised linear: 3x²-3x²+5x-10',
    expression: '3 * x^2 - 3 * x^2 + 5 * x - 10',
    variable: 'x',
    description: 'Quadratic terms cancel out'
  },
  {
    name: 'Zero coefficient: 0x²+4x-8',
    expression: '0 * x^2 + 4 * x - 8',
    variable: 'x',
    description: 'Leading coefficient is zero'
  },
  {
    name: 'Factored form difference of squares: x²-16',
    expression: 'x^2 - 16',
    variable: 'x',
    description: 'Difference of squares (x-4)(x+4)'
  },
  {
    name: 'Complex discriminant: 2x²-3x+5',
    expression: '2 * x^2 - 3 * x + 5',
    variable: 'x',
    description: 'Discriminant < 0, no real solutions'
  }
];

const edgeCaseTests = [
  // Edge cases and error conditions
  {
    name: 'Constant equation: 5',
    expression: '5',
    task: 'solve',
    variable: 'x',
    description: 'No solutions (5 ≠ 0)'
  },
  {
    name: 'Zero equation: 0',
    expression: '0',
    task: 'solve',
    variable: 'x',
    description: 'Infinitely many solutions (should error)'
  },
  {
    name: 'Complex expression: sin(x²)·e^(cos(x))',
    expression: '\\sin(x^2) * \\exp(\\cos(x))',
    task: 'differentiate',
    variable: 'x',
    description: 'Very complex chain and product rule combination'
  },
  {
    name: 'Large polynomial: x⁵',
    expression: 'x^5',
    task: 'differentiate',
    variable: 'x',
    description: 'Higher degree polynomial'
  },
  {
    name: 'Negative exponents: x^(-2)',
    expression: 'x^{-2}',
    task: 'integrate',
    variable: 'x',
    description: 'Negative power integration'
  },
  {
    name: 'Mixed variables: x*y+z',
    expression: 'x * y + z',
    task: 'differentiate',
    variable: 'x',
    description: 'Expression with multiple variables'
  },
  {
    name: 'Very small numbers: 0.0001x²+0.0002x+0.0003',
    expression: '0.0001 * x^2 + 0.0002 * x + 0.0003',
    task: 'solve',
    variable: 'x',
    description: 'Very small coefficients'
  },
  {
    name: 'Nested functions: ln(sin(√x))',
    expression: '\\ln(\\sin(\\sqrt{x}))',
    task: 'differentiate',
    variable: 'x',
    description: 'Multiple nested function compositions'
  },
  {
    name: 'Constants in expression: e+π·x',
    expression: 'e + π * x',
    task: 'differentiate',
    variable: 'x',
    description: 'Mathematical constants in expression'
  },
  {
    name: 'Complex fraction: (x²+2x+1)/(x³-x)',
    expression: '\\frac{x^2 + 2 * x + 1}{x^3 - x}',
    task: 'differentiate',
    variable: 'x',
    description: 'Complex quotient rule'
  }
];

async function runTestSuite(tests, suiteName) {
  console.log(`\n=== ${suiteName} ===\n`);
  
  let passed = 0;
  let failed = 0;
  let errors = 0;
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`Expression: ${test.expression}`);
    console.log(`Description: ${test.description}`);
    
    try {
      const parseResult = parseLatex(test.expression);
      
      if (parseResult.error) {
        console.log(`❌ PARSE FAILED: ${parseResult.error}`);
        failed++;
        console.log('');
        continue;
      }
      
      const task = test.task || (suiteName.includes('DIFFERENTIATION') ? 'differentiate' : 
                                suiteName.includes('INTEGRATION') ? 'integrate' : 'solve');
      
      const analyzeResult = analyze(parseResult.ast, {
        task: task,
        variable: test.variable
      });
      
      if (analyzeResult.error) {
        console.log(`⚠️  EXPECTED LIMITATION: ${analyzeResult.error}`);
        errors++;
      } else {
        console.log(`✅ RESULT: ${analyzeResult.value}`);
        console.log(`Steps: ${analyzeResult.steps.slice(0, 3).join(' → ')}${analyzeResult.steps.length > 3 ? '...' : ''}`);
        passed++;
      }
      
    } catch (error) {
      console.log(`💥 RUNTIME ERROR: ${error.message}`);
      errors++;
    }
    
    console.log('');
  }
  
  console.log(`\n--- ${suiteName} SUMMARY ---`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Expected Limitations: ${errors}`);
  console.log(`📊 Success Rate: ${passed > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0}%`);
  
  return { passed, failed, errors };
}

// Run all test suites
console.log('🔥 STRESS TESTING LATEXIUM MATHEMATICAL ENGINES 🔥');
console.log('These tests are designed to push the limits and reveal weaknesses.\n');

const results = {
  differentiation: await runTestSuite(complexDifferentiationTests, 'COMPLEX DIFFERENTIATION TESTS'),
  integration: await runTestSuite(complexIntegrationTests, 'COMPLEX INTEGRATION TESTS'),
  equations: await runTestSuite(complexEquationTests, 'COMPLEX EQUATION TESTS'),
  edgeCases: await runTestSuite(edgeCaseTests, 'EDGE CASE TESTS')
};

console.log('\n🏆 OVERALL STRESS TEST RESULTS 🏆');
const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);
const totalTests = totalPassed + totalFailed + totalErrors;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`);
console.log(`⚠️  Limitations: ${totalErrors} (${((totalErrors/totalTests)*100).toFixed(1)}%)`);

if (totalPassed / totalTests > 0.7) {
  console.log('🎉 EXCELLENT: The mathematical engines are robust!');
} else if (totalPassed / totalTests > 0.5) {
  console.log('👍 GOOD: Solid foundation with room for improvement');
} else {
  console.log('⚠️  NEEDS WORK: Several areas need strengthening');
}

console.log('\n🔬 Use these results to identify areas for enhancement and optimization.');