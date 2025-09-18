import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== COMPLEX EXPRESSION DEBUG ===\n');

// Test the problematic expression
const expression = '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1';
console.log(`Testing: ${expression}`);

try {
  const parseResult = parseLatex(expression);
  
  if (parseResult.error) {
    console.log(`❌ PARSE ERROR: ${parseResult.error}`);
  } else {
    console.log('✅ PARSED SUCCESSFULLY');
    console.log('AST:', JSON.stringify(parseResult.ast, null, 2));
    
    const analyzeResult = analyze(parseResult.ast, {
      task: 'simplify',
      variable: 'x'
    });
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
    } else {
      console.log(`✅ RESULT: ${analyzeResult.value}`);
      console.log(`Expected: x^3 + 4x^2 + 2x - 2`);
      console.log(`Steps:`, analyzeResult.steps);
    }
  }
} catch (error) {
  console.log(`💥 ERROR: ${error.message}`);
  console.log(`Stack: ${error.stack}`);
}

console.log('\n=== COMPLEX FRACTION TEST ===\n');

// Test complex fractions
const complexFractions = [
  '\\frac{\\frac{1}{2}}{\\frac{1}{3}}',
  '\\frac{\\frac{x}{y}}{\\frac{a}{b}}',
  '\\frac{\\frac{x+1}{x-1}}{\\frac{x+2}{x-2}}'
];

for (const expr of complexFractions) {
  console.log(`Testing: ${expr}`);
  
  try {
    const parseResult = parseLatex(expr);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
    } else {
      const analyzeResult = analyze(parseResult.ast, {
        task: 'simplify',
        variable: 'x'
      });
      
      if (analyzeResult.error) {
        console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
      } else {
        console.log(`✅ RESULT: ${analyzeResult.value}`);
      }
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
  }
  
  console.log('');
}