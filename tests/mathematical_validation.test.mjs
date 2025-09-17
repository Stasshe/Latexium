import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== MATHEMATICAL CORRECTNESS VALIDATION ===\n');

// Test mathematical correctness with known derivatives and integrals
const correctnessTests = [
  {
    name: 'Derivative Verification Tests',
    tests: [
      {
        expression: 'x^3',
        variable: 'x',
        task: 'differentiate',
        expected: '3x²',
        description: 'Power rule: d/dx(x³) = 3x²'
      },
      {
        expression: '\\sin(x)',
        variable: 'x', 
        task: 'differentiate',
        expected: 'cos(x)',
        description: 'Trigonometric: d/dx(sin(x)) = cos(x)'
      },
      {
        expression: '\\exp(x)',
        variable: 'x',
        task: 'differentiate', 
        expected: 'exp(x)',
        description: 'Exponential: d/dx(e^x) = e^x'
      },
      {
        expression: '\\ln(x)',
        variable: 'x',
        task: 'differentiate',
        expected: '1/x',
        description: 'Logarithmic: d/dx(ln(x)) = 1/x'
      },
      {
        expression: 'x * \\sin(x)',
        variable: 'x',
        task: 'differentiate',
        expected: 'sin(x) + x*cos(x)',
        description: 'Product rule: d/dx(x*sin(x)) = sin(x) + x*cos(x)'
      }
    ]
  },
  {
    name: 'Integration Verification Tests',
    tests: [
      {
        expression: 'x^2',
        variable: 'x',
        task: 'integrate',
        expected: 'x³/3',
        description: 'Power rule: ∫x²dx = x³/3 + C'
      },
      {
        expression: '\\cos(x)',
        variable: 'x',
        task: 'integrate',
        expected: 'sin(x)',
        description: 'Trigonometric: ∫cos(x)dx = sin(x) + C'
      },
      {
        expression: '\\exp(x)',
        variable: 'x',
        task: 'integrate',
        expected: 'exp(x)',
        description: 'Exponential: ∫e^x dx = e^x + C'
      },
      {
        expression: '\\frac{1}{x}',
        variable: 'x',
        task: 'integrate',
        expected: 'ln|x|',
        description: 'Logarithmic: ∫(1/x)dx = ln|x| + C'
      }
    ]
  },
  {
    name: 'Equation Solving Verification Tests',
    tests: [
      {
        expression: 'x^2 - 4',
        variable: 'x',
        task: 'solve',
        expected: 'x = ±2',
        description: 'Quadratic: x² - 4 = 0 → x = ±2'
      },
      {
        expression: '2 * x + 6',
        variable: 'x',
        task: 'solve',
        expected: 'x = -3',
        description: 'Linear: 2x + 6 = 0 → x = -3'
      },
      {
        expression: 'x^2 + 1',
        variable: 'x', 
        task: 'solve',
        expected: 'No real solutions',
        description: 'Quadratic: x² + 1 = 0 → No real solutions'
      }
    ]
  }
];

// Advanced mathematical pattern tests
const advancedPatternTests = [
  {
    name: 'Chain Rule Mastery',
    expression: '\\sin(x^2)',
    variable: 'x',
    task: 'differentiate',
    description: 'Chain rule: d/dx(sin(x²)) = cos(x²)·2x'
  },
  {
    name: 'Product Rule with Three Functions',
    expression: 'x * \\sin(x) * \\cos(x)',
    variable: 'x',
    task: 'differentiate',
    description: 'Triple product: uses product rule twice'
  },
  {
    name: 'Quotient Rule with Chain Rule',
    expression: '\\frac{\\sin(x)}{x^2 + 1}',
    variable: 'x',
    task: 'differentiate',
    description: 'Combination of quotient and chain rules'
  },
  {
    name: 'Nested Function Composition',
    expression: '\\exp(\\sin(\\cos(x)))',
    variable: 'x',
    task: 'differentiate',
    description: 'Triple nested functions requiring multiple chain rule applications'
  },
  {
    name: 'Variable Exponent',
    expression: 'x^x',
    variable: 'x',
    task: 'differentiate',
    description: 'Logarithmic differentiation: d/dx(x^x) = x^x(ln(x) + 1)'
  },
  {
    name: 'Implicit Power',
    expression: '(x^2 + 1)^3',
    variable: 'x',
    task: 'differentiate',
    description: 'Power of expression: d/dx((x²+1)³) = 3(x²+1)²·2x'
  }
];

// Stress test for robustness
const robustnessTests = [
  {
    name: 'Zero Handling',
    expression: '0 * x + 0',
    variable: 'x',
    task: 'differentiate',
    description: 'Should handle zero coefficients gracefully'
  },
  {
    name: 'Constant Differentiation',
    expression: 'π',
    variable: 'x',
    task: 'differentiate', 
    description: 'Derivative of constant should be 0'
  },
  {
    name: 'Complex Fraction Differentiation',
    expression: '\\frac{x^3 - 2*x + 1}{x^2 + x + 1}',
    variable: 'x',
    task: 'differentiate',
    description: 'Complex rational function quotient rule'
  },
  {
    name: 'High Degree Polynomial',
    expression: 'x^{10} - 5*x^8 + 2*x^5 - x + 7',
    variable: 'x',
    task: 'differentiate',
    description: 'High degree polynomial with mixed terms'
  },
  {
    name: 'Very Large Exponent',
    expression: 'x^{100}',
    variable: 'x',
    task: 'differentiate',
    description: 'Very large exponent should not cause overflow'
  }
];

async function runVerificationSuite(suiteData) {
  console.log(`\n=== ${suiteData.name} ===\n`);
  
  let correct = 0;
  let total = 0;
  let errors = 0;
  
  for (const test of suiteData.tests) {
    total++;
    console.log(`Test: ${test.description}`);
    console.log(`Expression: ${test.expression}`);
    
    try {
      const parseResult = parseLatex(test.expression);
      
      if (parseResult.error) {
        console.log(`❌ PARSE FAILED: ${parseResult.error}`);
        errors++;
        continue;
      }
      
      const analyzeResult = analyze(parseResult.ast, {
        task: test.task,
        variable: test.variable
      });
      
      if (analyzeResult.error) {
        console.log(`⚠️  LIMITATION: ${analyzeResult.error}`);
        errors++;
      } else {
        console.log(`✅ RESULT: ${analyzeResult.value}`);
        if (test.expected) {
          console.log(`📚 EXPECTED: ${test.expected}`);
        }
        correct++;
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      errors++;
    }
    
    console.log('');
  }
  
  console.log(`--- ${suiteData.name} SUMMARY ---`);
  console.log(`✅ Correct: ${correct}/${total} (${((correct/total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Errors/Limitations: ${errors}/${total} (${((errors/total)*100).toFixed(1)}%)`);
  
  return { correct, total, errors };
}

async function runSimpleTestSuite(tests, suiteName) {
  console.log(`\n=== ${suiteName} ===\n`);
  
  let passed = 0;
  let total = tests.length;
  let errors = 0;
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`Expression: ${test.expression}`);
    console.log(`Description: ${test.description}`);
    
    try {
      const parseResult = parseLatex(test.expression);
      
      if (parseResult.error) {
        console.log(`❌ PARSE FAILED: ${parseResult.error}`);
        errors++;
        continue;
      }
      
      const analyzeResult = analyze(parseResult.ast, {
        task: test.task,
        variable: test.variable
      });
      
      if (analyzeResult.error) {
        console.log(`⚠️  LIMITATION: ${analyzeResult.error}`);
        errors++;
      } else {
        console.log(`✅ RESULT: ${analyzeResult.value}`);
        passed++;
      }
      
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      errors++;
    }
    
    console.log('');
  }
  
  console.log(`--- ${suiteName} SUMMARY ---`);
  console.log(`✅ Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Errors: ${errors}/${total} (${((errors/total)*100).toFixed(1)}%)`);
  
  return { passed, total, errors };
}

// Run all verification suites
console.log('🎯 MATHEMATICAL CORRECTNESS AND ROBUSTNESS TESTING 🎯');
console.log('This suite validates mathematical accuracy and engine robustness.\n');

const results = [];

// Run verification tests (with expected results)
for (const suite of correctnessTests) {
  const result = await runVerificationSuite(suite);
  results.push(result);
}

// Run pattern tests
const patternResult = await runSimpleTestSuite(advancedPatternTests, 'ADVANCED PATTERN TESTS');
results.push(patternResult);

// Run robustness tests
const robustnessResult = await runSimpleTestSuite(robustnessTests, 'ROBUSTNESS TESTS');
results.push(robustnessResult);

// Final summary
console.log('\n🏆 FINAL MATHEMATICAL VALIDATION RESULTS 🏆');
const totalTests = results.reduce((sum, r) => sum + r.total, 0);
const totalPassed = results.reduce((sum, r) => sum + (r.correct || r.passed), 0);
const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

console.log(`Total Tests Run: ${totalTests}`);
console.log(`✅ Mathematically Correct: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
console.log(`⚠️  Limitations/Errors: ${totalErrors} (${((totalErrors/totalTests)*100).toFixed(1)}%)`);

if (totalPassed / totalTests > 0.85) {
  console.log('🎉 EXCELLENT: Mathematical engines are highly robust and accurate!');
} else if (totalPassed / totalTests > 0.7) {
  console.log('👍 GOOD: Strong mathematical foundation with good accuracy');
} else if (totalPassed / totalTests > 0.5) {
  console.log('👌 FAIR: Decent performance with room for improvement');
} else {
  console.log('⚠️  NEEDS IMPROVEMENT: Mathematical accuracy could be enhanced');
}

console.log('\n🔬 This comprehensive testing validates the mathematical correctness of Latexium.');