import { parseLatex } from '../../dist/index.esm.js';
import assert from 'assert';

// \frac{x!}{(x-1)!} のパーステスト
const { ast, error } = parseLatex('\\frac{x!}{(x-1)!}');
if (error) throw new Error(error);

// 分数ノードであること
assert.strictEqual(ast.type, 'Fraction');

// 分子がFactorialノード
assert.strictEqual(ast.numerator.type, 'Factorial');
assert.strictEqual(ast.numerator.argument.type, 'Identifier');
assert.strictEqual(ast.numerator.argument.name, 'x');

// 分母がFactorialノード
assert.strictEqual(ast.denominator.type, 'Factorial');
assert.strictEqual(ast.denominator.argument.type, 'BinaryExpression');
assert.strictEqual(ast.denominator.argument.operator, '-');
assert.strictEqual(ast.denominator.argument.left.type, 'Identifier');
assert.strictEqual(ast.denominator.argument.left.name, 'x');
assert.strictEqual(ast.denominator.argument.right.type, 'NumberLiteral');
assert.strictEqual(ast.denominator.argument.right.value, 1);

console.log('factorial fraction parse test passed');
