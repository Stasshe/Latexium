import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Testing Function vs Multiplication Parsing ===\n');

const testCases = [
  // Functions (with backslash)
  '\\sin(x)',
  '\\cos(x)',
  '\\ln(x)',
  '\\exp(x)',
  '\\sqrt{x}',
  
  // User defined functions (should be treated as functions)
  'f(x)',
  'g(x)',
  'h(x)',
  
  // Variables (should be treated as multiplication)
  'x(y)',
  'a(b)',
  'p(q)',
  
  // Negative multiplication cases
  'x(-y)',
  'a(-b)',
  'x(-1)',
  
  // Mixed cases
  '\\sin(x)y',
  'f(x)g(y)',
];

for (const expr of testCases) {
  console.log(`\nExpression: ${expr}`);
  
  try {
    const parseResult = parseLatex(expr);
    if (!parseResult.error) {
      console.log('Type:', parseResult.ast.type);
      if (parseResult.ast.type === 'FunctionCall') {
        console.log('Function name:', parseResult.ast.name);
      } else if (parseResult.ast.type === 'BinaryExpression') {
        console.log('Operator:', parseResult.ast.operator);
      }
      console.log('LaTeX output:', analyze(parseResult.ast, { task: 'simplify' }).value);
    } else {
      console.log('Parse error:', parseResult.error);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}