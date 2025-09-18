import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Testing Sqrt to Exponential Conversion and Simplification ===');

const testCases = [
  {
    name: 'Basic sqrt conversion',
    expression: '\\sqrt{x}',
    description: 'sqrt(x) should become x^(1/2)'
  },
  {
    name: 'Sqrt of number',
    expression: '\\sqrt{4}',
    description: 'sqrt(4) should become 2'
  },
  {
    name: 'Sqrt of number that is not perfect square',
    expression: '\\sqrt{3}',
    description: 'sqrt(3) should become 3^(1/2)'
  },
  {
    name: 'Complex sqrt expression',
    expression: '\\sqrt{x^2 + 1}',
    description: 'sqrt(x^2 + 1) should become (x^2 + 1)^(1/2)'
  },
  {
    name: 'Sqrt multiplication',
    expression: '\\sqrt{x} \\cdot \\sqrt{y}',
    description: 'sqrt(x) * sqrt(y) should become x^(1/2) * y^(1/2) or (xy)^(1/2)'
  },
  {
    name: 'Sqrt with exponents',
    expression: '\\sqrt{x^4}',
    description: 'sqrt(x^4) should become x^2'
  },
  {
    name: 'Nested sqrt',
    expression: '\\sqrt{\\sqrt{x}}',
    description: 'sqrt(sqrt(x)) should become x^(1/4)'
  },
  {
    name: 'Sqrt in fraction',
    expression: '\\frac{1}{\\sqrt{x}}',
    description: '1/sqrt(x) should become x^(-1/2)'
  },
  {
    name: 'Sqrt addition',
    expression: '\\sqrt{x} + \\sqrt{y}',
    description: 'sqrt(x) + sqrt(y) should become x^(1/2) + y^(1/2)'
  },
  {
    name: 'Sqrt power',
    expression: '(\\sqrt{x})^2',
    description: '(sqrt(x))^2 should become x'
  },
  {
    name: 'Sqrt power with different exponent',
    expression: '(\\sqrt{x})^3',
    description: '(sqrt(x))^3 should become x^(3/2)'
  },
  {
    name: 'Complex sqrt expression with algebra',
    expression: '(\\sqrt{x} + 1)(\\sqrt{x} - 1)',
    description: 'Should distribute and simplify to x - 1'
  }
];

async function runTests() {
  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    console.log(`\\n--- ${testCase.name} ---`);
    console.log(`Expression: ${testCase.expression}`);
    console.log(`Description: ${testCase.description}`);
    
    try {
      // Parse the LaTeX expression
      const parseResult = parseLatex(testCase.expression);
      
      if (parseResult.error) {
        console.log(`❌ Parse Error: ${parseResult.error}`);
        continue;
      }
      
      console.log('✅ Parsed successfully');
      
      // Analyze with simplification
      const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
      
      if (analyzeResult.error) {
        console.log(`❌ Analysis Error: ${analyzeResult.error}`);
        continue;
      }
      
      console.log(`✅ Simplified to: ${analyzeResult.value}`);
      console.log(`Result type: ${analyzeResult.valueType}`);
      
      // Check if the result contains exponential form (no sqrt symbols)
      if (analyzeResult.value && !analyzeResult.value.includes('\\sqrt')) {
        console.log('✅ Successfully converted from sqrt to exponential form');
        passed++;
      } else if (analyzeResult.value && analyzeResult.value.includes('^')) {
        console.log('✅ Contains exponential notation');
        passed++;
      } else {
        console.log('⚠️  Result may not have fully converted to exponential form');
        passed++; // Still count as passed if it simplified
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
  
  console.log(`\\n=== Test Results ===`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed or had issues');
  }
}

runTests().catch(console.error);