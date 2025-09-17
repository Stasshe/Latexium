import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== PARSING FIXES TEST ===\n');

const parsingTests = [
  {
    name: 'Square root notation',
    expression: '\\sqrt{x^2 + 1}',
    description: 'Should parse sqrt with braces correctly'
  },
  {
    name: 'Square root simple',
    expression: '\\sqrt{x}',
    description: 'Simple square root'
  },
  {
    name: 'Negative exponent with braces',
    expression: 'x^{-2}',
    description: 'Negative exponent in braces'
  },
  {
    name: 'Negative exponent simple',
    expression: 'x^{-1}',
    description: 'Simple negative exponent'
  },
  {
    name: 'Complex sqrt expression',
    expression: '\\sqrt{1 - x^2}',
    description: 'Square root with complex expression'
  },
  {
    name: 'Nested function with sqrt',
    expression: '\\ln(\\sqrt{x})',
    description: 'Logarithm of square root'
  }
];

console.log('Testing parsing fixes...\n');

for (const test of parsingTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Description: ${test.description}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE FAILED: ${parseResult.error}`);
    } else {
      console.log(`✅ PARSED SUCCESSFULLY`);
      console.log(`AST: ${JSON.stringify(parseResult.ast, null, 2).slice(0, 200)}...`);
      
      // Test differentiation if it's a function of x
      if (test.expression.includes('x')) {
        const diffResult = analyze(parseResult.ast, {
          task: 'differentiate',
          variable: 'x'
        });
        
        if (diffResult.error) {
          console.log(`⚠️  DIFF ERROR: ${diffResult.error}`);
        } else {
          console.log(`📐 DERIVATIVE: ${diffResult.value}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
  }
  
  console.log('');
}

console.log('=== TESTING EDGE CASES ===\n');

const edgeCases = [
  'x^{-3}',
  '\\sqrt{x^{-1}}', 
  '\\frac{1}{\\sqrt{x}}',
  'x^{-1/2}',
  '\\sqrt{\\sqrt{x}}'
];

for (const expr of edgeCases) {
  console.log(`Testing: ${expr}`);
  try {
    const result = parseLatex(expr);
    console.log(result.error ? `❌ ${result.error}` : '✅ Parsed');
  } catch (e) {
    console.log(`💥 ${e.message}`);
  }
}