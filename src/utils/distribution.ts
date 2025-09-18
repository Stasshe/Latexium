/**
 * Distribution and Expansion Utilities
 * Handles distributive law operations for algebraic expressions
 */

import { ASTNode, BinaryExpression, NumberLiteral } from '../types';
import { advancedSimplifyTerms } from './commutative';
import { simplify } from './unified-simplify';
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

  // Combine like terms with advanced algorithm
  const combinedTerms = advancedSimplifyTerms(terms);

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
      return simplify(term);
    }
    const result: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: -1 },
      right: term,
    };
    return simplify(result);
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

  // Apply simplification to the final result
  return simplify(result);
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

  // Create multiplication expression and simplify
  const result: BinaryExpression = {
    type: 'BinaryExpression',
    operator: '*',
    left,
    right,
  };

  return simplify(result);
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

  const result = buildExpressionFromTerms(expandedTerms);
  // Apply final simplification to the distributed result
  return simplify(result);
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
 * Handles complex multiplication chains and nested distributions
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
        // Expand the power and simplify
        const expanded = expandPower(base, exponent.value);
        return simplify(expanded);
      }
    }

    // Recursively process the base and exponent
    const processedBase = applyDistributiveLaw(base);
    const processedExponent = applyDistributiveLaw(exponent);

    if (processedBase !== base || processedExponent !== exponent) {
      const result: BinaryExpression = {
        type: 'BinaryExpression',
        operator: '^',
        left: processedBase,
        right: processedExponent,
      };
      return simplify(result);
    }

    return node;
  }

  // Handle multiplication with distribution
  if (expr.operator === '*') {
    // First, recursively process left and right
    const left = applyDistributiveLaw(expr.left);
    const right = applyDistributiveLaw(expr.right);

    // Check for distribution opportunities after recursive processing
    const currentNode: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '*',
      left,
      right,
    };

    if (canDistribute(currentNode)) {
      const distributed = distributeMultiplication(left, right);
      // Recursively apply distribution to the result and simplify
      const result = applyDistributiveLaw(distributed);
      return simplify(result);
    }

    // Check if this is part of a longer multiplication chain
    // Handle cases like ((x+1)(x+1)) * x * x where the left side was already distributed
    if (
      left.type === 'BinaryExpression' &&
      (left.operator === '+' || left.operator === '-') &&
      right.type === 'Identifier'
    ) {
      // Distribute the polynomial on the left with the variable on the right
      const distributed = distributeMultiplication(left, right);
      const result = applyDistributiveLaw(distributed);
      return simplify(result);
    }

    // Handle cases where right side has already been processed and left is distributable
    if (
      right.type === 'BinaryExpression' &&
      (right.operator === '+' || right.operator === '-') &&
      left.type === 'Identifier'
    ) {
      // Distribute the variable on the left with the polynomial on the right
      const distributed = distributeMultiplication(left, right);
      const result = applyDistributiveLaw(distributed);
      return simplify(result);
    }

    if (left !== expr.left || right !== expr.right) {
      return simplify(currentNode);
    }

    return node;
  }

  // Recursively apply to child nodes for other operators
  const left = applyDistributiveLaw(expr.left);
  const right = applyDistributiveLaw(expr.right);

  if (left !== expr.left || right !== expr.right) {
    const result: BinaryExpression = {
      type: 'BinaryExpression',
      operator: expr.operator,
      left,
      right,
    };
    return simplify(result);
  }

  return node;
}

/**
 * Expand all distributive operations in an expression
 */
export function expandExpression(node: ASTNode): ASTNode {
  const expanded = applyDistributiveLaw(node);
  return simplify(expanded);
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

  // For powers 2-5, use repeated multiplication with simplification at each step
  let result = base;
  for (let i = 1; i < exponent; i++) {
    result = distributeMultiplication(result, base);
    // Simplify at each step to keep expressions manageable
    result = simplify(result);
  }

  return result;
}
