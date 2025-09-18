// Test for trigonometric simplification and GCD-based fraction reduction
import { parseLatex, analyze } from '../../dist/index.esm.js';

function testSimplify(expr, expected) {
  const parsed = parseLatex(expr);
  if (!parsed || !parsed.ast) {
    console.error('Parse error:', expr);
    return;
  }
  const result = analyze(parsed.ast, { task: 'simplify' });
  const out = result && result.ast ? result.ast : null;
  console.log('Input:', expr);
  console.log('Simplified:', JSON.stringify(out));
  if (expected !== undefined) {
    console.log('Expected:', expected);
  }
  console.log('---');
}

// sin(2π) → 0
// cos(π) → -1
// tan(0) → 0
testSimplify('sin(2pi)', '{"type":"NumberLiteral","value":0}');
testSimplify('cos(pi)', '{"type":"NumberLiteral","value":-1}');
testSimplify('tan(0)', '{"type":"NumberLiteral","value":0}');

testSimplify('1/3 + 1/6', '{"type":"Fraction","numerator":{"type":"NumberLiteral","value":1},"denominator":{"type":"NumberLiteral","value":2}}');
testSimplify('6/8', '{"type":"Fraction","numerator":{"type":"NumberLiteral","value":3},"denominator":{"type":"NumberLiteral","value":4}}');
