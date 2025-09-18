import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== SPECIFIC COMPLEX EXPRESSION TEST ===\n');

// Test the problematic expression step by step
const testCases = [
  {
    expr: '-x',
    desc: 'Simple negative x'
  },
  {
    expr: '(-x-1-3x+x^2)',
    desc: 'Inner parentheses content'
  },
  {
    expr: '-(-x-1-3x+x^2)',
    desc: 'Negative of inner parentheses'
  },
  {
    expr: '1 -(-x-1-3x+x^2)',
    desc: 'First subtraction'
  },
  {
    expr: '1 -(-x-1-3x+x^2)+ x',
    desc: 'Add x'
  },
  {
    expr: '(-x+1)',
    desc: 'Second parentheses'
  },
  {
    expr: '-(-x+1)',
    desc: 'Negative of second parentheses'
  },
  {
    expr: '1 -(-x-1-3x+x^2)+ x-(-x+1)-x',
    desc: 'Complete inner expression'
  },
  {
    expr: 'x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)',
    desc: 'Multiply by x'
  },
  {
    expr: '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)',
    desc: 'Multiply by -x'
  },
  {
    expr: '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1',
    desc: 'Complete expression'
  }
];

for (const test of testCases) {
  console.log(`\n--- ${test.desc} ---`);
  console.log(`Expression: ${test.expr}`);
  
  try {
    const parseResult = parseLatex(test.expr);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, {
      task: 'simplify',
      variable: 'x'
    });
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
    } else {
      console.log(`✅ RESULT: ${analyzeResult.value}`);
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
}

console.log('\n=== COMPLEX FRACTION TESTS ===\n');

const fractionTests = [
  {
    expr: '\\frac{\\frac{1}{2}}{\\frac{1}{3}}',
    expected: '\\frac{3}{2}',
    desc: 'Simple complex fraction'
  },
  {
    expr: '\\frac{\\frac{x}{y}}{\\frac{a}{b}}',
    expected: '\\frac{bx}{ay}',
    desc: 'Variable complex fraction'
  },
  {
    expr: '\\frac{\\frac{x+1}{x-1}}{\\frac{x+2}{x-2}}',
    expected: '\\frac{(x+1)(x-2)}{(x-1)(x+2)}',
    desc: 'Polynomial complex fraction'
  }
];

for (const test of fractionTests) {
  console.log(`\n--- ${test.desc} ---`);
  console.log(`Expression: ${test.expr}`);
  console.log(`Expected: ${test.expected}`);
  
  try {
    const parseResult = parseLatex(test.expr);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, {
      task: 'simplify',
      variable: 'x'
    });
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
    } else {
      console.log(`✅ RESULT: ${analyzeResult.value}`);
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
}