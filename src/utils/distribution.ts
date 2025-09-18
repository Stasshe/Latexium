/**
 * Distribution and Expansion Utilities
 * Handles distributive law operations for algebraic expressions
 */

import { ASTNode, BinaryExpression, NumberLiteral } from '../types';
import { combineCommutativeLikeTerms } from './commutative';
import { MAX_EXPANSION_POWER } from '../config';

/**
 * Extract all terms from an addition/subtraction expression
 * Handles nested additions like (a + b) + c → [a, b, c]
 */
export function extractAllTerms(node: ASTNode): { term: ASTNode; sign: number }[] {
  if (node.type !== 'BinaryExpression') {
    return [{ term: node, sign: 1 }];
  }

  const expr = node as BinaryExpression;

  if (expr.operator === '+') {
    return [...extractAllTerms(expr.left), ...extractAllTerms(expr.right)];
  }

  if (expr.operator === '-') {
    const leftTerms = extractAllTerms(expr.left);
    const rightTerms = extractAllTerms(expr.right).map(t => ({
      term: t.term,
      sign: -t.sign,
    }));
    return [...leftTerms, ...rightTerms];
  }

  return [{ term: node, sign: 1 }];
}

/**
 * Build an addition expression from terms with signs
 */
export function buildExpressionFromTerms(terms: { term: ASTNode; sign: number }[]): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Combine like terms with commutative consideration
  const combinedTerms = combineCommutativeLikeTerms(terms);

  if (combinedTerms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (combinedTerms.length === 1) {
    const firstTerm = combinedTerms[0];
    if (!firstTerm) {
      return { type: 'NumberLiteral', value: 0 };
    }

    const { term, sign } = firstTerm;
    if (sign === 1) {
      return term;
    }
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: -1 },
      right: term,
    };
  }

  const firstTerm = combinedTerms[0];
  if (!firstTerm) {
    return { type: 'NumberLiteral', value: 0 };
  }

  let result =
    firstTerm.sign === 1
      ? firstTerm.term
      : ({
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: -1 },
          right: firstTerm.term,
        } as ASTNode);

  for (let i = 1; i < combinedTerms.length; i++) {
    const currentTerm = combinedTerms[i];
    if (!currentTerm) continue;

    const { term, sign } = currentTerm;
    if (sign === 1) {
      result = {
        type: 'BinaryExpression',
        operator: '+',
        left: result,
        right: term,
      };
    } else {
      result = {
        type: 'BinaryExpression',
        operator: '-',
        left: result,
        right: term,
      };
    }
  }

  return result;
}

/**
 * Multiply two individual terms
 */
export function multiplyTerms(left: ASTNode, right: ASTNode): ASTNode {
  // Handle multiplication by zero
  if (
    (left.type === 'NumberLiteral' && left.value === 0) ||
    (right.type === 'NumberLiteral' && right.value === 0)
  ) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Handle multiplication by one
  if (left.type === 'NumberLiteral' && left.value === 1) {
    return right;
  }
  if (right.type === 'NumberLiteral' && right.value === 1) {
    return left;
  }

  // Handle number literals
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return {
      type: 'NumberLiteral',
      value: left.value * right.value,
    };
  }

  // Create multiplication expression
  return {
    type: 'BinaryExpression',
    operator: '*',
    left,
    right,
  };
}

/**
 * Core distribution function: (a + b + ...) * (c + d + ...)
 * Expands all combinations of terms
 */
export function distributeMultiplication(left: ASTNode, right: ASTNode): ASTNode {
  const leftTerms = extractAllTerms(left);
  const rightTerms = extractAllTerms(right);

  const expandedTerms: { term: ASTNode; sign: number }[] = [];

  // Multiply each term from left with each term from right
  for (const leftTerm of leftTerms) {
    for (const rightTerm of rightTerms) {
      const product = multiplyTerms(leftTerm.term, rightTerm.term);
      const sign = leftTerm.sign * rightTerm.sign;
      expandedTerms.push({ term: product, sign });
    }
  }

  return buildExpressionFromTerms(expandedTerms);
}

/**
 * Check if a node contains multiplication that can be distributed
 */
export function canDistribute(node: ASTNode): boolean {
  if (node.type !== 'BinaryExpression' || node.operator !== '*') {
    return false;
  }

  const expr = node as BinaryExpression;

  // Check if either operand is an addition/subtraction
  const leftIsSum =
    expr.left.type === 'BinaryExpression' &&
    (expr.left.operator === '+' || expr.left.operator === '-');
  const rightIsSum =
    expr.right.type === 'BinaryExpression' &&
    (expr.right.operator === '+' || expr.right.operator === '-');

  return leftIsSum || rightIsSum;
}

/**
 * Apply distributive law to an expression
 */
export function applyDistributiveLaw(node: ASTNode): ASTNode {
  if (node.type !== 'BinaryExpression') {
    return node;
  }

  const expr = node as BinaryExpression;

  // Handle exponentiation: expand (base)^n where base is a sum/difference
  if (expr.operator === '^') {
    const base = expr.left;
    const exponent = expr.right;

    // Check if exponent is a positive integer
    if (
      exponent.type === 'NumberLiteral' &&
      Number.isInteger(exponent.value) &&
      exponent.value > 0
    ) {
      // Check if base contains addition/subtraction
      if (base.type === 'BinaryExpression' && (base.operator === '+' || base.operator === '-')) {
        // Expand the power
        return expandPower(base, exponent.value);
      }
    }

    // Recursively process the base and exponent
    const processedBase = applyDistributiveLaw(base);
    const processedExponent = applyDistributiveLaw(exponent);

    if (processedBase !== base || processedExponent !== exponent) {
      return {
        type: 'BinaryExpression',
        operator: '^',
        left: processedBase,
        right: processedExponent,
      };
    }

    return node;
  }

  if (expr.operator === '*' && canDistribute(node)) {
    return distributeMultiplication(expr.left, expr.right);
  }

  // Recursively apply to child nodes
  const left = applyDistributiveLaw(expr.left);
  const right = applyDistributiveLaw(expr.right);

  if (left !== expr.left || right !== expr.right) {
    return {
      type: 'BinaryExpression',
      operator: expr.operator,
      left,
      right,
    };
  }

  return node;
}

/**
 * Expand all distributive operations in an expression
 */
export function expandExpression(node: ASTNode): ASTNode {
  return applyDistributiveLaw(node);
}

/**
 * Note: For factorization, use the factorExpression function from factorization.ts
 * This module is dedicated to expansion only.
 */

/**
 * Handle power expansion for simple cases like (a + b)^2
 */
export function expandPower(base: ASTNode, exponent: number): ASTNode {
  if (exponent === 0) {
    return { type: 'NumberLiteral', value: 1 };
  }

  if (exponent === 1) {
    return base;
  }

  if (exponent === 2) {
    // Special case for squared terms: (a + b)^2 = (a + b)(a + b)
    return distributeMultiplication(base, base);
  }

  if (exponent === 3) {
    // Special case for cubed terms: (a + b)^3 = (a + b)^2 * (a + b)
    const squared = distributeMultiplication(base, base);
    return distributeMultiplication(squared, base);
  }

  // For higher powers, we need to be careful about computational complexity
  // For very large exponents, we might want to keep it unexpanded
  if (exponent > MAX_EXPANSION_POWER) {
    // Keep large powers unexpanded to avoid excessive computation
    return {
      type: 'BinaryExpression',
      operator: '^',
      left: base,
      right: { type: 'NumberLiteral', value: exponent },
    };
  }

  // For moderate powers (4-20), use repeated multiplication
  let result = base;
  for (let i = 1; i < exponent; i++) {
    result = distributeMultiplication(result, base);
  }

  return result;
}
