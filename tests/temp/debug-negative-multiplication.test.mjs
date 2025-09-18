import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Testing Negative Multiplication Handling ===\n');

const testCases = [
  'x(-y)',
  'a(-b)',
  '2(-x)',
  'x(-1)',
  '(-x)y',
  '(-a)(-b)',
  'x(-y-z)',
  '2(-3x + 4)',
];

for (const expr of testCases) {
  console.log(`\nExpression: ${expr}`);
  
  try {
    const parseResult = parseLatex(expr);
    console.log('Parse result AST:', JSON.stringify(parseResult.ast, null, 2));
    
    if (!parseResult.error) {
      const simplifyResult = analyze(parseResult.ast, { task: 'simplify' });
      console.log('Simplify result:', simplifyResult.value);
      
      const evaluateResult = analyze(parseResult.ast, { task: 'evaluate' });
      console.log('Evaluate result:', evaluateResult.value);
    } else {
      console.log('Parse error:', parseResult.error);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}