/**
 * Basic Mathematical Simplification
 * Core simplification functions without distribution or expansion
 * Used by both unified-simplify.ts and distribution.ts to avoid circular dependencies
 */

import type { ASTNode, BinaryExpression, UnaryExpression, Fraction, Factorial } from '@/types';

/**
 * Basic simplification function for use in distribution.ts
 * Only performs fundamental mathematical simplifications
 */
export function basicSimplify(node: ASTNode): ASTNode {
  if (!node) return node;

  switch (node.type) {
    case 'NumberLiteral':
    case 'Identifier':
      return node;

    case 'UnaryExpression':
      return simplifyUnaryBasic(node);

    case 'BinaryExpression':
      return simplifyBinaryBasic(node);

    case 'Fraction':
      return simplifyFractionBasic(node);

    case 'Factorial':
      return simplifyFactorialBasic(node);

    default:
      return node;
  }
}

function simplifyFactorialBasic(node: Factorial): ASTNode {
  const arg = basicSimplify(node.argument);
  // n! for non-negative integer
  if (arg.type === 'NumberLiteral' && Number.isInteger(arg.value) && arg.value >= 0) {
    return { type: 'NumberLiteral', value: factorial(arg.value) };
  }
  // (x+1)! → (x+1)*x*...*1 展開（整数値でなければシンボリックのまま）
  // 展開は x! → x*(x-1)*...*1 だが、ここでは (expr)! → Product{expr, k, 1, expr}
  // ただし、argが単なるIdentifierやBinaryExpression('+', ...)なら展開可能
  if (
    arg.type === 'Identifier' ||
    (arg.type === 'BinaryExpression' && (arg.operator === '+' || arg.operator === '-'))
  ) {
    // Productノードで表現
    return {
      type: 'Product',
      expression: { type: 'Identifier', name: 'k' },
      variable: 'k',
      lowerBound: { type: 'NumberLiteral', value: 1 },
      upperBound: arg,
    };
  }
  // それ以外はシンボリックのまま
  return { type: 'Factorial', argument: arg };
}

function factorial(n: number): number {
  let res = 1;
  for (let i = 2; i <= n; ++i) res *= i;
  return res;
}

/**
 * Basic unary expression simplification
 */
function simplifyUnaryBasic(node: UnaryExpression): ASTNode {
  const operand = basicSimplify(node.operand);

  // Double negation: --x = x
  if (node.operator === '-' && operand.type === 'UnaryExpression' && operand.operator === '-') {
    return operand.operand;
  }

  // Negative number: -(5) = -5
  if (node.operator === '-' && operand.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: -operand.value };
  }

  // Positive number: +(5) = 5
  if (node.operator === '+') {
    return operand;
  }

  return { ...node, operand };
}

/**
 * Basic binary expression simplification
 */
function simplifyBinaryBasic(node: BinaryExpression): ASTNode {
  const left = basicSimplify(node.left);
  const right = basicSimplify(node.right);

  switch (node.operator) {
    case '+':
      return simplifyAdditionBasic(left, right);
    case '-':
      return simplifySubtractionBasic(left, right);
    case '*':
      return simplifyMultiplicationBasic(left, right);
    case '/':
      return simplifyDivisionBasic(left, right);
    case '^':
      return simplifyPowerBasic(left, right);
    default:
      return { ...node, left, right };
  }
}

/**
 * Basic addition simplification
 */
function simplifyAdditionBasic(left: ASTNode, right: ASTNode): ASTNode {
  // x + 0 = x
  if (right.type === 'NumberLiteral' && right.value === 0) return left;
  if (left.type === 'NumberLiteral' && left.value === 0) return right;

  // x + (-y) = x - y (convert addition of negative to subtraction)
  if (right.type === 'UnaryExpression' && right.operator === '-') {
    return simplifySubtractionBasic(left, right.operand);
  }

  // x + (-n) = x - n (convert addition of negative number to subtraction)
  if (right.type === 'NumberLiteral' && right.value < 0) {
    return {
      type: 'BinaryExpression',
      operator: '-',
      left,
      right: { type: 'NumberLiteral', value: -right.value },
    };
  }

  // x + (-x + n) = n, x + (n - x) = n
  if (left.type === 'Identifier' && right.type === 'BinaryExpression') {
    // x + (-x + n)
    if (
      right.operator === '+' &&
      right.left.type === 'UnaryExpression' &&
      right.left.operator === '-' &&
      right.left.operand.type === 'Identifier' &&
      right.left.operand.name === left.name &&
      right.right.type === 'NumberLiteral'
    ) {
      return right.right;
    }
    // x + (n - x)
    if (
      right.operator === '-' &&
      right.right.type === 'Identifier' &&
      right.right.name === left.name &&
      right.left.type === 'NumberLiteral'
    ) {
      return right.left;
    }
  }

  // Number + Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value + right.value };
  }

  return { type: 'BinaryExpression', operator: '+', left, right };
}

/**
 * Basic subtraction simplification
 */
function simplifySubtractionBasic(left: ASTNode, right: ASTNode): ASTNode {
  // x - 0 = x
  if (right.type === 'NumberLiteral' && right.value === 0) return left;

  // 0 - x = -x
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'UnaryExpression', operator: '-', operand: right };
  }

  // x - (-y) = x + y (subtract negative becomes addition)
  if (right.type === 'UnaryExpression' && right.operator === '-') {
    return simplifyAdditionBasic(left, right.operand);
  }

  // x - (-n) = x + n (subtract negative number)
  if (right.type === 'NumberLiteral' && right.value < 0) {
    return simplifyAdditionBasic(left, { type: 'NumberLiteral', value: -right.value });
  }

  // x - (a + b) = x - a - b (distribute subtraction over addition)
  if (right.type === 'BinaryExpression' && right.operator === '+') {
    const step1 = simplifySubtractionBasic(left, right.left);
    return simplifySubtractionBasic(step1, right.right);
  }

  // x - (a - b) = x - a + b (distribute subtraction over subtraction)
  if (right.type === 'BinaryExpression' && right.operator === '-') {
    const step1 = simplifySubtractionBasic(left, right.left);
    return simplifyAdditionBasic(step1, right.right);
  }

  // Number - Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value - right.value };
  }

  return { type: 'BinaryExpression', operator: '-', left, right };
}

/**
 * Basic multiplication simplification
 */
function simplifyMultiplicationBasic(left: ASTNode, right: ASTNode): ASTNode {
  // x * 0 = 0
  if (
    (left.type === 'NumberLiteral' && left.value === 0) ||
    (right.type === 'NumberLiteral' && right.value === 0)
  ) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // x * 1 = x
  if (left.type === 'NumberLiteral' && left.value === 1) return right;
  if (right.type === 'NumberLiteral' && right.value === 1) return left;

  // Handle negative multiplications: A * (-B) = -(A * B)
  if (right.type === 'UnaryExpression' && right.operator === '-') {
    const positiveResult = simplifyMultiplicationBasic(left, right.operand);
    return { type: 'UnaryExpression', operator: '-', operand: positiveResult };
  }

  // Handle negative multiplications: (-A) * B = -(A * B)
  if (left.type === 'UnaryExpression' && left.operator === '-') {
    const positiveResult = simplifyMultiplicationBasic(left.operand, right);
    return { type: 'UnaryExpression', operator: '-', operand: positiveResult };
  }

  // Handle negative multiplications: (-A) * (-B) = A * B
  if (
    left.type === 'UnaryExpression' &&
    left.operator === '-' &&
    right.type === 'UnaryExpression' &&
    right.operator === '-'
  ) {
    return simplifyMultiplicationBasic(left.operand, right.operand);
  }

  // Handle negative numbers: x * (-2) = -2x
  if (left.type === 'NumberLiteral' && left.value < 0) {
    return {
      type: 'UnaryExpression',
      operator: '-',
      operand: simplifyMultiplicationBasic({ type: 'NumberLiteral', value: -left.value }, right),
    };
  }
  if (right.type === 'NumberLiteral' && right.value < 0) {
    return {
      type: 'UnaryExpression',
      operator: '-',
      operand: simplifyMultiplicationBasic(left, { type: 'NumberLiteral', value: -right.value }),
    };
  }

  // Number * Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value * right.value };
  }

  // Number * Fraction: n * (a/b) = (n*a)/b
  if (left.type === 'NumberLiteral' && right.type === 'Fraction') {
    const numerator = simplifyMultiplicationBasic(left, right.numerator);
    return simplifyFractionBasic({ type: 'Fraction', numerator, denominator: right.denominator });
  }

  // Fraction * Number: (a/b) * n = (a*n)/b
  if (left.type === 'Fraction' && right.type === 'NumberLiteral') {
    const numerator = simplifyMultiplicationBasic(left.numerator, right);
    return simplifyFractionBasic({ type: 'Fraction', numerator, denominator: left.denominator });
  }

  return { type: 'BinaryExpression', operator: '*', left, right };
}

/**
 * Basic division simplification
 */
function simplifyDivisionBasic(left: ASTNode, right: ASTNode): ASTNode {
  // x / 1 = x
  if (right.type === 'NumberLiteral' && right.value === 1) return left;

  // 0 / x = 0
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Number / Number - keep as fraction to preserve exact values
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral' && right.value !== 0) {
    // Only convert to decimal if it results in a whole number
    const result = left.value / right.value;
    if (Number.isInteger(result)) {
      return { type: 'NumberLiteral', value: result };
    }
    // Otherwise, keep as fraction
    const reduced = reduceFraction(left.value, right.value);
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: reduced.num },
      denominator: { type: 'NumberLiteral', value: reduced.den },
    };
  }

  // Convert division to fraction for better mathematical representation
  return { type: 'Fraction', numerator: left, denominator: right };
}

/**
 * Basic power simplification
 */
function simplifyPowerBasic(base: ASTNode, exponent: ASTNode): ASTNode {
  // x^0 = 1
  if (exponent.type === 'NumberLiteral' && exponent.value === 0) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // x^1 = x
  if (exponent.type === 'NumberLiteral' && exponent.value === 1) {
    return base;
  }

  // Number^Number
  if (base.type === 'NumberLiteral' && exponent.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: Math.pow(base.value, exponent.value) };
  }

  return { type: 'BinaryExpression', operator: '^', left: base, right: exponent };
}

/**
 * Basic fraction simplification
 */
function simplifyFractionBasic(node: Fraction): ASTNode {
  const numerator = basicSimplify(node.numerator);
  const denominator = basicSimplify(node.denominator);

  // Handle complex fractions: (a/b) / (c/d) = (a*d) / (b*c)
  if (numerator.type === 'Fraction' && denominator.type === 'Fraction') {
    return simplifyFractionBasic({
      type: 'Fraction',
      numerator: simplifyMultiplicationBasic(numerator.numerator, denominator.denominator),
      denominator: simplifyMultiplicationBasic(numerator.denominator, denominator.numerator),
    });
  }

  // Handle (a/b) / c = a / (b*c)
  if (numerator.type === 'Fraction') {
    return simplifyFractionBasic({
      type: 'Fraction',
      numerator: numerator.numerator,
      denominator: simplifyMultiplicationBasic(numerator.denominator, denominator),
    });
  }

  // Handle a / (b/c) = (a*c) / b
  if (denominator.type === 'Fraction') {
    return simplifyFractionBasic({
      type: 'Fraction',
      numerator: simplifyMultiplicationBasic(numerator, denominator.denominator),
      denominator: denominator.numerator,
    });
  }

  // x / 1 = x
  if (denominator.type === 'NumberLiteral' && denominator.value === 1) {
    return numerator;
  }

  // 0 / x = 0
  if (numerator.type === 'NumberLiteral' && numerator.value === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Reduce numeric fractions
  if (
    numerator.type === 'NumberLiteral' &&
    denominator.type === 'NumberLiteral' &&
    denominator.value !== 0
  ) {
    const reduced = reduceFraction(numerator.value, denominator.value);
    if (reduced.den === 1) {
      return { type: 'NumberLiteral', value: reduced.num };
    }
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: reduced.num },
      denominator: { type: 'NumberLiteral', value: reduced.den },
    };
  }

  return { type: 'Fraction', numerator, denominator };
}

/**
 * Utility function to reduce fractions
 */
function reduceFraction(num: number, den: number): { num: number; den: number } {
  const g = gcd(Math.abs(num), Math.abs(den));
  return { num: num / g, den: den / g };
}

/**
 * Greatest common divisor
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
