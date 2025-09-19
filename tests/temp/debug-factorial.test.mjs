import { parseLatex, basicSimplify } from '../../dist/index.esm.js';
import assert from 'assert';

function testFactorial(input, expectedAstType, expectedValue) {
  const { ast, error } = parseLatex(input);
  if (error) throw new Error(error);
  const simplified = basicSimplify(ast);
  assert.strictEqual(simplified.type, expectedAstType, 'AST type mismatch');
  if (expectedValue !== undefined) {
    assert.strictEqual(simplified.value, expectedValue, 'Value mismatch');
  }
  return simplified;
}

// 数値階乗
const ast5 = testFactorial('5!', 'NumberLiteral', 120);
const ast0 = testFactorial('0!', 'NumberLiteral', 1);

console.log('Numeric factorial tests passed', { ast5, ast0 });

// 変数階乗
const { ast: astX } = parseLatex('x!');
const simpX = basicSimplify(astX);
assert.strictEqual(simpX.type, 'Product');
assert.strictEqual(simpX.variable, 'k');
assert.strictEqual(simpX.lowerBound.value, 1);
assert.deepStrictEqual(simpX.upperBound, { type: 'Identifier', name: 'x' });

// (x+1)!
const { ast: astXp1 } = parseLatex('(x+1)!');
const simpXp1 = basicSimplify(astXp1);
assert.strictEqual(simpXp1.type, 'Product');
assert.strictEqual(simpXp1.variable, 'k');
assert.strictEqual(simpXp1.lowerBound.value, 1);
assert.strictEqual(simpXp1.upperBound.type, 'BinaryExpression');

// シンボリック（展開不可）
//const { ast: astSin } = parseLatex('sin(x)!');
//const simpSin = basicSimplify(astSin);
//assert.strictEqual(simpSin.type, 'Factorial');

console.log('factorial tests passed');
