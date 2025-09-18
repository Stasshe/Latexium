/**
 * Unified Mathematical Simplification System
 * Complete algebraic simplification with advanced term analysis
 */

import {
  ASTNode,
  BinaryExpression,
  NumberLiteral,
  Identifier,
  UnaryExpression,
  Fraction,
  Integral,
} from '../types';
import { AdvancedTermAnalyzer, AdvancedTermCombiner } from './commutative';
import { gcd, reduceFraction, areEquivalentExpressions } from './simplification';

/**
 * Comprehensive simplification options
 */
export interface SimplifyOptions {
  /** Combine like terms (default: true) */
  combineLikeTerms?: boolean;
  /** Expand products and powers (default: false) */
  expand?: boolean;
  /** Factor common terms (default: false) */
  factor?: boolean;
  /** Simplify fractions (default: true) */
  simplifyFractions?: boolean;
  /** Apply algebraic identities (default: true) */
  applyIdentities?: boolean;
  /** Maximum depth for recursive simplification (default: 10) */
  maxDepth?: number;
}

/**
 * Default simplification options
 */
const DEFAULT_SIMPLIFY_OPTIONS: Required<SimplifyOptions> = {
  combineLikeTerms: true,
  expand: false,
  factor: false,
  simplifyFractions: true,
  applyIdentities: true,
  maxDepth: 10,
};

/**
 * Main unified simplification function
 * Applies all mathematical simplifications in optimal order
 */
export function simplify(node: ASTNode, options: SimplifyOptions = {}): ASTNode {
  const opts = { ...DEFAULT_SIMPLIFY_OPTIONS, ...options };

  if (!node) return node;

  try {
    return deepSimplify(node, opts, 0);
  } catch (error) {
    // Fallback: return original node if simplification fails
    return node;
  }
}

/**
 * Deep recursive simplification with cycle detection
 */
function deepSimplify(node: ASTNode, options: Required<SimplifyOptions>, depth: number): ASTNode {
  // Prevent infinite recursion
  if (depth > options.maxDepth) {
    return node;
  }

  // Apply basic simplifications first
  const basicSimplified = applyBasicSimplifications(node, options, depth);

  // Apply structural simplifications
  const structuralSimplified = applyStructuralSimplifications(basicSimplified, options, depth);

  // Apply algebraic simplifications
  const algebraicSimplified = applyAlgebraicSimplifications(structuralSimplified, options, depth);

  // If no change occurred, return the result
  if (areEquivalentExpressions(node, algebraicSimplified)) {
    return algebraicSimplified;
  }

  // If changes occurred, apply one more round of simplification
  return deepSimplify(algebraicSimplified, options, depth + 1);
}

/**
 * Apply basic simplifications (constants, identities)
 */
function applyBasicSimplifications(
  node: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
    case 'Identifier':
      return node;

    case 'UnaryExpression':
      return simplifyUnaryExpression(node, options, depth);

    case 'BinaryExpression':
      return simplifyBinaryExpression(node, options, depth);

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => deepSimplify(arg, options, depth + 1)),
      };

    case 'Fraction':
      return simplifyFraction(node, options, depth);

    case 'Integral': {
      const result: Integral = {
        ...node,
        integrand: deepSimplify(node.integrand, options, depth + 1),
      };
      if (node.lowerBound) {
        result.lowerBound = deepSimplify(node.lowerBound, options, depth + 1);
      }
      if (node.upperBound) {
        result.upperBound = deepSimplify(node.upperBound, options, depth + 1);
      }
      return result;
    }

    case 'Sum':
    case 'Product':
      return {
        ...node,
        expression: deepSimplify(node.expression, options, depth + 1),
        lowerBound: deepSimplify(node.lowerBound, options, depth + 1),
        upperBound: deepSimplify(node.upperBound, options, depth + 1),
      };

    default:
      return node;
  }
}

/**
 * Simplify unary expressions
 */
function simplifyUnaryExpression(
  node: UnaryExpression,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  const operand = deepSimplify(node.operand, options, depth + 1);

  // Double negation: --x = x
  if (node.operator === '-' && operand.type === 'UnaryExpression' && operand.operator === '-') {
    return operand.operand;
  }

  // Negative number: -5 = -5 (combine into NumberLiteral)
  if (node.operator === '-' && operand.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: -operand.value };
  }

  // Positive unary: +x = x
  if (node.operator === '+') {
    return operand;
  }

  return { ...node, operand };
}

/**
 * Simplify binary expressions with comprehensive pattern matching
 */
function simplifyBinaryExpression(
  node: BinaryExpression,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  const left = deepSimplify(node.left, options, depth + 1);
  const right = deepSimplify(node.right, options, depth + 1);

  // Apply operator-specific simplifications
  switch (node.operator) {
    case '+':
      return simplifyAddition(left, right, options, depth);
    case '-':
      return simplifySubtraction(left, right, options, depth);
    case '*':
      return simplifyMultiplication(left, right, options, depth);
    case '/':
      return simplifyDivision(left, right, options, depth);
    case '^':
      return simplifyPower(left, right, options, depth);
    default:
      return { type: 'BinaryExpression', operator: node.operator, left, right };
  }
}

/**
 * Simplify addition with like terms combination
 */
function simplifyAddition(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // 0 + x = x
  if (left.type === 'NumberLiteral' && left.value === 0) return right;
  if (right.type === 'NumberLiteral' && right.value === 0) return left;

  // Number + Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value + right.value };
  }

  // Like terms combination
  if (options.combineLikeTerms) {
    const terms = extractAdditionTerms({ type: 'BinaryExpression', operator: '+', left, right });

    // Convert to AdvancedTermCombiner format
    const advancedTerms = terms.map(t => ({
      term: t.term,
      sign: t.sign,
    }));

    const simplified = AdvancedTermCombiner.combineTerms(advancedTerms);

    if (simplified.length === 0) {
      return { type: 'NumberLiteral', value: 0 };
    }

    if (simplified.length === 1) {
      const term = simplified[0];
      if (term && term.sign === 1) {
        return term.term;
      } else if (term && term.sign === -1) {
        return { type: 'UnaryExpression', operator: '-', operand: term.term };
      }
    }

    return buildAdditionFromTerms(simplified);
  }

  return { type: 'BinaryExpression', operator: '+', left, right };
}

/**
 * Simplify subtraction by converting to addition and processing like terms
 */
function simplifySubtraction(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // x - 0 = x
  if (right.type === 'NumberLiteral' && right.value === 0) return left;

  // 0 - x = -x
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'UnaryExpression', operator: '-', operand: right };
  }

  // Number - Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value - right.value };
  }

  // x - x = 0
  if (areEquivalentExpressions(left, right)) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Convert subtraction to addition with negative term
  // a - b becomes a + (-b)
  const negativeRight: ASTNode = {
    type: 'UnaryExpression',
    operator: '-',
    operand: right,
  };

  // Use addition simplification logic
  return simplifyAddition(left, negativeRight, options, depth);
}

/**
 * Simplify multiplication with advanced coefficient handling
 */
function simplifyMultiplication(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
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

  // Number * Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: left.value * right.value };
  }

  // Apply advanced term analysis for complex multiplications
  if (options.combineLikeTerms) {
    const analyzed = AdvancedTermAnalyzer.analyze({
      type: 'BinaryExpression',
      operator: '*',
      left,
      right,
    });
    if (analyzed.coefficient !== 1 || analyzed.variables.size > 0) {
      const reconstructed = AdvancedTermCombiner['reconstructTerm'](analyzed, analyzed.coefficient);
      if (reconstructed) {
        return reconstructed;
      }
    }
  }

  return { type: 'BinaryExpression', operator: '*', left, right };
}

/**
 * Simplify division
 */
function simplifyDivision(
  left: ASTNode,
  right: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // 0 / x = 0 (x ≠ 0)
  if (left.type === 'NumberLiteral' && left.value === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // x / 1 = x
  if (right.type === 'NumberLiteral' && right.value === 1) return left;

  // Number / Number
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral' && right.value !== 0) {
    return { type: 'NumberLiteral', value: left.value / right.value };
  }

  // x / x = 1
  if (areEquivalentExpressions(left, right)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // Convert to fraction for better handling
  return { type: 'Fraction', numerator: left, denominator: right };
}

/**
 * Simplify power expressions
 */
function simplifyPower(
  base: ASTNode,
  exponent: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // x^0 = 1
  if (exponent.type === 'NumberLiteral' && exponent.value === 0) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // x^1 = x
  if (exponent.type === 'NumberLiteral' && exponent.value === 1) return base;

  // Number^Number
  if (base.type === 'NumberLiteral' && exponent.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: Math.pow(base.value, exponent.value) };
  }

  // (x^a)^b = x^(a*b)
  if (
    base.type === 'BinaryExpression' &&
    base.operator === '^' &&
    base.right.type === 'NumberLiteral' &&
    exponent.type === 'NumberLiteral'
  ) {
    const newExponent = base.right.value * exponent.value;
    return {
      type: 'BinaryExpression',
      operator: '^',
      left: base.left,
      right: { type: 'NumberLiteral', value: newExponent },
    };
  }

  return { type: 'BinaryExpression', operator: '^', left: base, right: exponent };
}

/**
 * Simplify fractions
 */
function simplifyFraction(
  node: Fraction,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  const numerator = deepSimplify(node.numerator, options, depth + 1);
  const denominator = deepSimplify(node.denominator, options, depth + 1);

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
    denominator.value !== 0 &&
    options.simplifyFractions
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
 * Apply structural simplifications (flattening, reordering)
 */
function applyStructuralSimplifications(
  node: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  // This can be extended for more structural optimizations
  return node;
}

/**
 * Apply algebraic simplifications (identities, factoring)
 */
function applyAlgebraicSimplifications(
  node: ASTNode,
  options: Required<SimplifyOptions>,
  depth: number
): ASTNode {
  if (!options.applyIdentities) return node;

  // Apply algebraic identities like (a+b)^2 = a^2 + 2ab + b^2
  // This can be extended based on specific needs

  return node;
}

/**
 * Extract terms from an addition expression
 */
function extractAdditionTerms(node: ASTNode): Array<{ term: ASTNode; sign: number }> {
  // Handle UnaryExpression with negative operator
  if (node.type === 'UnaryExpression' && node.operator === '-') {
    const innerTerms = extractAdditionTerms(node.operand);
    return innerTerms.map(t => ({ term: t.term, sign: -t.sign }));
  }

  // Handle UnaryExpression with positive operator
  if (node.type === 'UnaryExpression' && node.operator === '+') {
    return extractAdditionTerms(node.operand);
  }

  if (node.type !== 'BinaryExpression') {
    return [{ term: node, sign: 1 }];
  }

  const expr = node as BinaryExpression;

  if (expr.operator === '+') {
    return [...extractAdditionTerms(expr.left), ...extractAdditionTerms(expr.right)];
  }

  if (expr.operator === '-') {
    const leftTerms = extractAdditionTerms(expr.left);
    const rightTerms = extractAdditionTerms(expr.right).map(t => ({
      term: t.term,
      sign: -t.sign,
    }));
    return [...leftTerms, ...rightTerms];
  }

  return [{ term: node, sign: 1 }];
}

/**
 * Build addition expression from terms with signs
 */
function buildAdditionFromTerms(terms: Array<{ term: ASTNode; sign: number }>): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (terms.length === 1) {
    const term = terms[0];
    if (term && term.sign === 1) {
      return term.term;
    } else if (term && term.sign === -1) {
      return { type: 'UnaryExpression', operator: '-', operand: term.term };
    }
  }

  let result = terms[0]?.term;
  if (!result) return { type: 'NumberLiteral', value: 0 };

  if (terms[0]?.sign === -1) {
    result = { type: 'UnaryExpression', operator: '-', operand: result };
  }

  for (let i = 1; i < terms.length; i++) {
    const term = terms[i];
    if (!term) continue;

    if (term.sign === 1) {
      result = {
        type: 'BinaryExpression',
        operator: '+',
        left: result,
        right: term.term,
      };
    } else {
      result = {
        type: 'BinaryExpression',
        operator: '-',
        left: result,
        right: term.term,
      };
    }
  }

  return result;
}

/**
 * Legacy compatibility function
 */
export function simplifyAST(node: ASTNode): ASTNode {
  return simplify(node);
}
