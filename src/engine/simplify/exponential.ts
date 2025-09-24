/**
 * Advanced Exponential Form Simplification
 * Comprehensive solution for handling exponential expressions including sqrt conversions
 * Focuses on converting all root expressions to exponential form and advanced simplification
 */

import { basicSimplify } from './basic-simplify';
import { reduceFraction, areEquivalentExpressions } from './simplification';

import {
  ASTNode,
  BinaryExpression,
  FunctionCall,
  Fraction,
  NumberLiteral,
  UnaryExpression,
} from '@/types';

/**
 * Configuration for exponential simplification
 */
export interface ExponentialOptions {
  /** Convert sqrt and root functions to exponential form (default: true) */
  convertRootsToExponential?: boolean;
  /** Simplify exponential operations (default: true) */
  simplifyExponentials?: boolean;
  /** Maximum depth for recursive simplification (default: 15) */
  maxDepth?: number;
  /** Apply advanced exponential identities (default: true) */
  applyAdvancedIdentities?: boolean;
}

const DEFAULT_EXPONENTIAL_OPTIONS: Required<ExponentialOptions> = {
  convertRootsToExponential: true,
  simplifyExponentials: true,
  maxDepth: 15,
  applyAdvancedIdentities: true,
};

/**
 * Main function to apply exponential form simplification
 */
export function simplifyExponentialForm(node: ASTNode, options: ExponentialOptions = {}): ASTNode {
  const opts = { ...DEFAULT_EXPONENTIAL_OPTIONS, ...options };
  return applyExponentialSimplification(node, opts, 0);
}

/**
 * Convert sqrt and root functions to exponential form
 */
export function convertRootsToExponential(node: ASTNode): ASTNode {
  if (!node) return node;

  switch (node.type) {
    case 'FunctionCall':
      return convertFunctionToExponential(node as FunctionCall);

    case 'BinaryExpression': {
      const expr = node as BinaryExpression;
      return {
        ...expr,
        left: convertRootsToExponential(expr.left),
        right: convertRootsToExponential(expr.right),
      };
    }

    case 'UnaryExpression': {
      const expr = node as UnaryExpression;
      return {
        ...expr,
        operand: convertRootsToExponential(expr.operand),
      };
    }

    case 'Fraction': {
      const frac = node as Fraction;
      return {
        ...frac,
        numerator: convertRootsToExponential(frac.numerator),
        denominator: convertRootsToExponential(frac.denominator),
      };
    }

    default:
      return node;
  }
}

/**
 * Convert function calls (sqrt, cbrt, etc.) to exponential form
 */
function convertFunctionToExponential(func: FunctionCall): ASTNode {
  switch (func.name) {
    case 'sqrt':
      // sqrt(x) → x^(1/2)
      if (func.args.length === 1 && func.args[0]) {
        const base = convertRootsToExponential(func.args[0]);
        return createPowerExpression(base, createFraction(1, 2));
      }
      break;

    case 'cbrt':
      // cbrt(x) → x^(1/3)
      if (func.args.length === 1 && func.args[0]) {
        const base = convertRootsToExponential(func.args[0]);
        return createPowerExpression(base, createFraction(1, 3));
      }
      break;

    case 'root':
      // root(x, n) → x^(1/n)
      if (func.args.length === 2 && func.args[0] && func.args[1]) {
        const base = convertRootsToExponential(func.args[0]);
        const rootOrder = func.args[1];
        if (rootOrder.type === 'NumberLiteral') {
          const exponent = createFraction(1, (rootOrder as NumberLiteral).value);
          return createPowerExpression(base, exponent);
        }
        // For non-numeric root orders, create 1/n as a fraction
        const exponent: Fraction = {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: 1 },
          denominator: convertRootsToExponential(rootOrder),
        };
        return createPowerExpression(base, exponent);
      }
      break;

    default:
      // Recursively process function arguments
      return {
        ...func,
        args: func.args.map(arg => (arg ? convertRootsToExponential(arg) : arg)).filter(Boolean),
      };
  }

  // If conversion failed, return the original function with processed args
  return {
    ...func,
    args: func.args.map(arg => (arg ? convertRootsToExponential(arg) : arg)).filter(Boolean),
  };
}

/**
 * Create a power expression (base^exponent)
 */
function createPowerExpression(base: ASTNode, exponent: ASTNode): BinaryExpression {
  return {
    type: 'BinaryExpression',
    operator: '^',
    left: base,
    right: exponent,
  };
}

/**
 * Create a fraction node
 */
function createFraction(numerator: number, denominator: number): Fraction {
  const reduced = reduceFraction(numerator, denominator);
  return {
    type: 'Fraction',
    numerator: { type: 'NumberLiteral', value: reduced.num },
    denominator: { type: 'NumberLiteral', value: reduced.den },
  };
}

/**
 * Apply comprehensive exponential simplification
 */
function applyExponentialSimplification(
  node: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  if (depth > options.maxDepth) {
    return node;
  }

  // First, convert all roots to exponential form
  let result = options.convertRootsToExponential ? convertRootsToExponential(node) : node;

  // Apply basic simplification first
  result = basicSimplify(result);

  // Apply exponential-specific simplifications
  if (options.simplifyExponentials) {
    result = simplifyExponentialExpressions(result, options, depth);
  }

  // Apply advanced identities if enabled
  if (options.applyAdvancedIdentities) {
    result = applyAdvancedExponentialIdentities(result, options, depth);
  }

  // Check for convergence
  if (areEquivalentExpressions(node, result)) {
    return result;
  }

  // Recursively apply if changes were made
  return applyExponentialSimplification(result, options, depth + 1);
}

/**
 * Simplify exponential expressions with comprehensive rules
 */
function simplifyExponentialExpressions(
  node: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  if (!node) return node;

  switch (node.type) {
    case 'BinaryExpression':
      return simplifyExponentialBinaryExpression(node as BinaryExpression, options, depth);

    case 'UnaryExpression': {
      const expr = node as UnaryExpression;
      const operand = applyExponentialSimplification(expr.operand, options, depth + 1);
      return { ...expr, operand };
    }

    case 'Fraction': {
      const frac = node as Fraction;
      const numerator = applyExponentialSimplification(frac.numerator, options, depth + 1);
      const denominator = applyExponentialSimplification(frac.denominator, options, depth + 1);
      return simplifyExponentialFraction({ type: 'Fraction', numerator, denominator });
    }

    default:
      return node;
  }
}

/**
 * Simplify binary expressions with exponential focus
 */
function simplifyExponentialBinaryExpression(
  expr: BinaryExpression,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  const left = applyExponentialSimplification(expr.left, options, depth + 1);
  const right = applyExponentialSimplification(expr.right, options, depth + 1);

  if (expr.operator === '^') {
    return simplifyPowerExpression(left, right, options, depth);
  }

  if (expr.operator === '*') {
    return simplifyExponentialMultiplication(left, right, options, depth);
  }

  if (expr.operator === '/') {
    return simplifyExponentialDivision(left, right, options, depth);
  }

  // For other operators, return with simplified operands
  return { ...expr, left, right };
}

/**
 * Advanced power expression simplification
 */
function simplifyPowerExpression(
  base: ASTNode,
  exponent: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  // x^0 = 1
  if (isZero(exponent)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // x^1 = x
  if (isOne(exponent)) {
    return base;
  }

  // 0^x = 0 (for x > 0)
  if (isZero(base) && isPositive(exponent)) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // 1^x = 1
  if (isOne(base)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // (x^a)^b = x^(a*b)
  if (base.type === 'BinaryExpression' && base.operator === '^') {
    const innerBase = base.left;
    const innerExponent = base.right;
    const newExponent = simplifyExponentialMultiplication(innerExponent, exponent, options, depth);
    return createPowerExpression(innerBase, newExponent);
  }

  // x^(a/b) where a and b are numbers
  if (exponent.type === 'Fraction') {
    return simplifyFractionalPower(base, exponent as Fraction, options, depth);
  }

  // (a*b)^c = a^c * b^c (when appropriate)
  if (base.type === 'BinaryExpression' && base.operator === '*') {
    if (canDistributePower(exponent)) {
      const leftPower = createPowerExpression(base.left, exponent);
      const rightPower = createPowerExpression(base.right, exponent);
      return simplifyExponentialMultiplication(leftPower, rightPower, options, depth);
    }
  }

  // Number^Number
  if (base.type === 'NumberLiteral' && exponent.type === 'NumberLiteral') {
    const baseVal = (base as NumberLiteral).value;
    const expVal = (exponent as NumberLiteral).value;

    // Handle special cases for exact arithmetic
    if (Number.isInteger(expVal)) {
      return { type: 'NumberLiteral', value: Math.pow(baseVal, expVal) };
    }

    // For fractional exponents, check if result is exact
    if (expVal === 0.5 && baseVal >= 0) {
      const sqrt = Math.sqrt(baseVal);
      if (Number.isInteger(sqrt)) {
        return { type: 'NumberLiteral', value: sqrt };
      }
    }
  }

  return createPowerExpression(base, exponent);
}

/**
 * Simplify fractional powers like x^(a/b)
 */
function simplifyFractionalPower(
  base: ASTNode,
  exponent: Fraction,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  const num = exponent.numerator;
  const den = exponent.denominator;

  // x^(1/n) - nth root
  if (isOne(num)) {
    if (den.type === 'NumberLiteral') {
      const rootOrder = (den as NumberLiteral).value;

      // Special handling for common roots
      if (rootOrder === 2) {
        // Square root: x^(1/2)
        if (base.type === 'NumberLiteral') {
          const baseVal = (base as NumberLiteral).value;
          if (baseVal >= 0) {
            const sqrt = Math.sqrt(baseVal);
            if (Number.isInteger(sqrt)) {
              return { type: 'NumberLiteral', value: sqrt };
            }
          }
        }
      }

      if (rootOrder === 3) {
        // Cube root: x^(1/3)
        if (base.type === 'NumberLiteral') {
          const baseVal = (base as NumberLiteral).value;
          const cbrt = Math.cbrt(baseVal);
          if (Math.abs(cbrt - Math.round(cbrt)) < 1e-10) {
            return { type: 'NumberLiteral', value: Math.round(cbrt) };
          }
        }
      }
    }
  }

  // x^(a/1) = x^a
  if (isOne(den)) {
    return createPowerExpression(base, num);
  }

  // Simplify the fraction exponent
  const simplifiedExponent = simplifyExponentialFraction(exponent);

  if (simplifiedExponent.type !== 'Fraction') {
    return createPowerExpression(base, simplifiedExponent);
  }

  return createPowerExpression(base, simplifiedExponent);
}

/**
 * Simplify exponential multiplication: x^a * x^b = x^(a+b)
 */
function simplifyExponentialMultiplication(
  left: ASTNode,
  right: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  // x^a * x^b = x^(a+b)
  if (
    left.type === 'BinaryExpression' &&
    left.operator === '^' &&
    right.type === 'BinaryExpression' &&
    right.operator === '^'
  ) {
    const leftBase = left.left;
    const leftExp = left.right;
    const rightBase = right.left;
    const rightExp = right.right;

    if (areEquivalentExpressions(leftBase, rightBase)) {
      const sumExponent = addExponents(leftExp, rightExp);
      return createPowerExpression(leftBase, sumExponent);
    }
  }

  // x * x^a = x^(1+a)
  if (right.type === 'BinaryExpression' && right.operator === '^') {
    const rightBase = right.left;
    const rightExp = right.right;

    if (areEquivalentExpressions(left, rightBase)) {
      const newExponent = addExponents({ type: 'NumberLiteral', value: 1 }, rightExp);
      return createPowerExpression(left, newExponent);
    }
  }

  // x^a * x = x^(a+1)
  if (left.type === 'BinaryExpression' && left.operator === '^') {
    const leftBase = left.left;
    const leftExp = left.right;

    if (areEquivalentExpressions(leftBase, right)) {
      const newExponent = addExponents(leftExp, { type: 'NumberLiteral', value: 1 });
      return createPowerExpression(leftBase, newExponent);
    }
  }

  // Default multiplication
  return {
    type: 'BinaryExpression',
    operator: '*',
    left,
    right,
  };
}

/**
 * Simplify exponential division: x^a / x^b = x^(a-b)
 */
function simplifyExponentialDivision(
  left: ASTNode,
  right: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  // x^a / x^b = x^(a-b)
  if (
    left.type === 'BinaryExpression' &&
    left.operator === '^' &&
    right.type === 'BinaryExpression' &&
    right.operator === '^'
  ) {
    const leftBase = left.left;
    const leftExp = left.right;
    const rightBase = right.left;
    const rightExp = right.right;

    if (areEquivalentExpressions(leftBase, rightBase)) {
      const diffExponent = subtractExponents(leftExp, rightExp);
      return createPowerExpression(leftBase, diffExponent);
    }
  }

  // x / x^a = x^(1-a)
  if (right.type === 'BinaryExpression' && right.operator === '^') {
    const rightBase = right.left;
    const rightExp = right.right;

    if (areEquivalentExpressions(left, rightBase)) {
      const newExponent = subtractExponents({ type: 'NumberLiteral', value: 1 }, rightExp);
      return createPowerExpression(left, newExponent);
    }
  }

  // x^a / x = x^(a-1)
  if (left.type === 'BinaryExpression' && left.operator === '^') {
    const leftBase = left.left;
    const leftExp = left.right;

    if (areEquivalentExpressions(leftBase, right)) {
      const newExponent = subtractExponents(leftExp, { type: 'NumberLiteral', value: 1 });
      return createPowerExpression(leftBase, newExponent);
    }
  }

  // Convert to fraction for further processing
  return {
    type: 'Fraction',
    numerator: left,
    denominator: right,
  };
}

/**
 * Simplify fractions containing exponential expressions
 */
function simplifyExponentialFraction(frac: Fraction): ASTNode {
  const numerator = frac.numerator;
  const denominator = frac.denominator;

  // 1 / x^a = x^(-a)
  if (isOne(numerator) && denominator.type === 'BinaryExpression' && denominator.operator === '^') {
    const base = denominator.left;
    const exp = denominator.right;
    const negativeExp = negateExponent(exp);
    return createPowerExpression(base, negativeExp);
  }

  // x^a / x^b = x^(a-b)
  if (
    numerator.type === 'BinaryExpression' &&
    numerator.operator === '^' &&
    denominator.type === 'BinaryExpression' &&
    denominator.operator === '^'
  ) {
    const numBase = numerator.left;
    const numExp = numerator.right;
    const denBase = denominator.left;
    const denExp = denominator.right;

    if (areEquivalentExpressions(numBase, denBase)) {
      const diffExponent = subtractExponents(numExp, denExp);
      return createPowerExpression(numBase, diffExponent);
    }
  }

  return frac;
}

/**
 * Apply advanced exponential identities
 */
function applyAdvancedExponentialIdentities(
  node: ASTNode,
  options: Required<ExponentialOptions>,
  depth: number
): ASTNode {
  if (!node) return node;

  switch (node.type) {
    case 'BinaryExpression': {
      const expr = node as BinaryExpression;
      const left = applyAdvancedExponentialIdentities(expr.left, options, depth + 1);
      const right = applyAdvancedExponentialIdentities(expr.right, options, depth + 1);

      // Apply identity: (a^m)^n = a^(mn)
      if (expr.operator === '^' && left.type === 'BinaryExpression' && left.operator === '^') {
        const base = left.left;
        const innerExp = left.right;
        const outerExp = right;
        const newExp = multiplyExponents(innerExp, outerExp);
        return createPowerExpression(base, newExp);
      }

      return { ...expr, left, right };
    }

    case 'Fraction': {
      const frac = node as Fraction;
      const numerator = applyAdvancedExponentialIdentities(frac.numerator, options, depth + 1);
      const denominator = applyAdvancedExponentialIdentities(frac.denominator, options, depth + 1);
      return { type: 'Fraction', numerator, denominator };
    }

    default:
      return node;
  }
}

/**
 * Utility functions for exponent arithmetic
 */
function addExponents(left: ASTNode, right: ASTNode): ASTNode {
  return basicSimplify({
    type: 'BinaryExpression',
    operator: '+',
    left,
    right,
  });
}

function subtractExponents(left: ASTNode, right: ASTNode): ASTNode {
  return basicSimplify({
    type: 'BinaryExpression',
    operator: '-',
    left,
    right,
  });
}

function multiplyExponents(left: ASTNode, right: ASTNode): ASTNode {
  return basicSimplify({
    type: 'BinaryExpression',
    operator: '*',
    left,
    right,
  });
}

function negateExponent(exp: ASTNode): ASTNode {
  return basicSimplify({
    type: 'UnaryExpression',
    operator: '-',
    operand: exp,
  });
}

/**
 * Utility predicates
 */
function isZero(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && (node as NumberLiteral).value === 0;
}

function isOne(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && (node as NumberLiteral).value === 1;
}

function isPositive(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && (node as NumberLiteral).value > 0;
}

function canDistributePower(exponent: ASTNode): boolean {
  // Only distribute integer exponents for safety
  return exponent.type === 'NumberLiteral' && Number.isInteger((exponent as NumberLiteral).value);
}

/**
 * Export main conversion function for external use
 */
export function convertSqrtToExponential(node: ASTNode): ASTNode {
  return convertRootsToExponential(node);
}

/**
 * Advanced exponential term combination
 * Combines like exponential terms: x^a * x^b = x^(a+b)
 */
export function combineExponentialTerms(node: ASTNode): ASTNode {
  if (!node) return node;

  // Extract all terms from multiplication chains
  const terms = extractMultiplicationTerms(node);
  if (terms.length <= 1) {
    return node;
  }

  // Group terms by structural equivalence (not just atomic base)
  // Map: baseKey -> { base, exponentSum, count, coefficient }
  const groups = new Map<
    string,
    {
      base: ASTNode;
      exponentSum: ASTNode;
      count: number;
      coefficient: number;
    }
  >();
  const otherTerms: ASTNode[] = [];

  for (const term of terms) {
    // Try to extract as exponential (base^exp or base)

    let base: ASTNode = { type: 'NumberLiteral', value: 1 },
      exponent: ASTNode = { type: 'NumberLiteral', value: 1 },
      coefficient = 1;
    if (term.type === 'BinaryExpression' && term.operator === '^') {
      base = term.left;
      exponent = term.right;
    } else if (
      term.type === 'Identifier' ||
      term.type === 'BinaryExpression' ||
      term.type === 'FunctionCall'
    ) {
      // treat as base^1
      base = term;
      exponent = { type: 'NumberLiteral', value: 1 };
    } else if (term.type === 'NumberLiteral') {
      // treat as coefficient only, skip exponentiation logic
      coefficient = (term as NumberLiteral).value;
      otherTerms.push(term);
      continue;
    } else {
      // fallback: treat as other
      otherTerms.push(term);
      continue;
    }

    // Use JSON.stringify for structural key
    const baseKey = JSON.stringify(base);
    if (groups.has(baseKey)) {
      const group = groups.get(baseKey)!;
      group.exponentSum = addExponents(group.exponentSum, exponent);
      group.count++;
      group.coefficient *= coefficient;
    } else {
      groups.set(baseKey, {
        base,
        exponentSum: exponent,
        count: 1,
        coefficient,
      });
    }
  }

  // Reconstruct combined exponential terms
  const combinedTerms: ASTNode[] = [];
  for (const group of groups.values()) {
    // If repeated, exponent = count if all exponents were 1, else sum
    let result: ASTNode;
    if (
      group.count > 1 &&
      group.exponentSum.type === 'NumberLiteral' &&
      (group.exponentSum as NumberLiteral).value === group.count
    ) {
      // e.g. (x-1)(x-1)(x-1) => (x-1)^3
      result = createPowerExpression(group.base, { type: 'NumberLiteral', value: group.count });
    } else {
      result = createPowerExpression(group.base, group.exponentSum);
    }
    if (group.coefficient !== 1) {
      result = multiplyByCoefficient(result, group.coefficient);
    }
    combinedTerms.push(result);
  }

  // Add other terms
  combinedTerms.push(...otherTerms);

  // Reconstruct multiplication
  return reconstructMultiplication(combinedTerms);
}

/**
 * Extract all terms from a multiplication chain
 */
function extractMultiplicationTerms(node: ASTNode): ASTNode[] {
  if (node.type !== 'BinaryExpression' || node.operator !== '*') {
    return [node];
  }

  const expr = node as BinaryExpression;
  return [...extractMultiplicationTerms(expr.left), ...extractMultiplicationTerms(expr.right)];
}

/**
 * Analyze a term to extract exponential information
 */
function analyzeExponentialTerm(node: ASTNode): {
  isExponential: boolean;
  base: ASTNode;
  exponent: ASTNode;
  coefficient: number;
} {
  // Handle coefficient multiplication: n * x^a
  if (node.type === 'BinaryExpression' && node.operator === '*') {
    const expr = node as BinaryExpression;

    // Check if left is coefficient and right is exponential
    if (expr.left.type === 'NumberLiteral' && isExponentialExpression(expr.right)) {
      const rightAnalysis = analyzeExponentialTerm(expr.right);
      return {
        ...rightAnalysis,
        coefficient: rightAnalysis.coefficient * (expr.left as NumberLiteral).value,
      };
    }

    // Check if right is coefficient and left is exponential
    if (expr.right.type === 'NumberLiteral' && isExponentialExpression(expr.left)) {
      const leftAnalysis = analyzeExponentialTerm(expr.left);
      return {
        ...leftAnalysis,
        coefficient: leftAnalysis.coefficient * (expr.right as NumberLiteral).value,
      };
    }
  }

  // Direct exponential expression: x^a
  if (node.type === 'BinaryExpression' && node.operator === '^') {
    const expr = node as BinaryExpression;
    return {
      isExponential: true,
      base: expr.left,
      exponent: expr.right,
      coefficient: 1,
    };
  }

  // Variable without explicit exponent: x (treated as x^1)
  if (node.type === 'Identifier') {
    return {
      isExponential: true,
      base: node,
      exponent: { type: 'NumberLiteral', value: 1 },
      coefficient: 1,
    };
  }

  // Not exponential
  return {
    isExponential: false,
    base: node,
    exponent: { type: 'NumberLiteral', value: 1 },
    coefficient: 1,
  };
}

/**
 * Check if a node is an exponential expression
 */
function isExponentialExpression(node: ASTNode): boolean {
  if (node.type === 'BinaryExpression' && node.operator === '^') {
    return true;
  }
  if (node.type === 'Identifier') {
    return true;
  }
  return false;
}

/**
 * Combine multiple exponents by addition
 */
function combineExponents(exponents: ASTNode[]): ASTNode {
  if (exponents.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (exponents.length === 1) {
    const firstExponent = exponents[0];
    return firstExponent || { type: 'NumberLiteral', value: 0 };
  }

  let result = exponents[0] || { type: 'NumberLiteral', value: 0 };
  for (let i = 1; i < exponents.length; i++) {
    const currentExponent = exponents[i];
    if (currentExponent) {
      result = addExponents(result, currentExponent);
    }
  }

  return result;
}

/**
 * Multiply a term by a coefficient
 */
function multiplyByCoefficient(term: ASTNode, coefficient: number): ASTNode {
  if (coefficient === 1) {
    return term;
  }

  if (coefficient === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: { type: 'NumberLiteral', value: coefficient },
    right: term,
  };
}

/**
 * Reconstruct multiplication from terms
 */
function reconstructMultiplication(terms: ASTNode[]): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 1 };
  }

  if (terms.length === 1) {
    const firstTerm = terms[0];
    return firstTerm || { type: 'NumberLiteral', value: 1 };
  }

  let result = terms[0] || { type: 'NumberLiteral', value: 1 };
  for (let i = 1; i < terms.length; i++) {
    const currentTerm = terms[i];
    if (currentTerm) {
      result = {
        type: 'BinaryExpression',
        operator: '*',
        left: result,
        right: currentTerm,
      };
    }
  }

  return result;
}

/**
 * Enhanced exponential simplification that includes term combination
 */
export function enhancedExponentialSimplification(node: ASTNode): ASTNode {
  // First apply standard exponential simplification
  let result = fullExponentialSimplification(node);

  // Then apply exponential term combination
  result = combineExponentialTerms(result);

  // Apply basic simplification to clean up
  result = basicSimplify(result);

  return result;
}

/**
 * Full exponential simplification pipeline
 */
export function fullExponentialSimplification(node: ASTNode): ASTNode {
  return simplifyExponentialForm(node, {
    convertRootsToExponential: true,
    simplifyExponentials: true,
    applyAdvancedIdentities: true,
    maxDepth: 15,
  });
}
