/**
 * Advanced Simplification Utilities
 * Enhanced fraction reduction and factorization capabilities
 */

import { ASTNode, BinaryExpression, Fraction, NumberLiteral, Identifier } from '../types';

/**
 * Calculate Greatest Common Divisor using Euclidean algorithm
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }

  return a;
}

/**
 * Calculate Least Common Multiple
 */
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Check if a number is prime
 */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;

  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }

  return true;
}

/**
 * Find prime factorization of a number
 */
export function primeFactorization(n: number): number[] {
  const factors: number[] = [];
  let num = Math.abs(n);

  // Handle factor 2
  while (num % 2 === 0) {
    factors.push(2);
    num /= 2;
  }

  // Handle odd factors
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    while (num % i === 0) {
      factors.push(i);
      num /= i;
    }
  }

  // If num is still greater than 2, it's a prime
  if (num > 2) {
    factors.push(num);
  }

  return factors;
}

/**
 * Enhanced fraction reduction with prime factorization
 */
export function reduceFraction(
  numerator: number,
  denominator: number
): { num: number; den: number } {
  if (denominator === 0) {
    throw new Error('Division by zero');
  }

  // Handle negative signs
  const sign = numerator < 0 !== denominator < 0 ? -1 : 1;
  const absNum = Math.abs(numerator);
  const absDen = Math.abs(denominator);

  // Calculate GCD and reduce
  const commonDivisor = gcd(absNum, absDen);

  return {
    num: sign * (absNum / commonDivisor),
    den: absDen / commonDivisor,
  };
}

/**
 * Add fractions with automatic reduction
 */
export function addFractions(
  num1: number,
  den1: number,
  num2: number,
  den2: number
): { num: number; den: number } {
  const commonDen = lcm(den1, den2);
  const newNum1 = num1 * (commonDen / den1);
  const newNum2 = num2 * (commonDen / den2);

  return reduceFraction(newNum1 + newNum2, commonDen);
}

/**
 * Multiply fractions with automatic reduction
 */
export function multiplyFractions(
  num1: number,
  den1: number,
  num2: number,
  den2: number
): { num: number; den: number } {
  return reduceFraction(num1 * num2, den1 * den2);
}

/**
 * Divide fractions with automatic reduction
 */
export function divideFractions(
  num1: number,
  den1: number,
  num2: number,
  den2: number
): { num: number; den: number } {
  if (num2 === 0) {
    throw new Error('Division by zero');
  }
  return multiplyFractions(num1, den1, den2, num2);
}

/**
 * Check if two AST nodes represent the same expression
 */
export function areEquivalentExpressions(left: ASTNode, right: ASTNode): boolean {
  if (left.type !== right.type) return false;

  switch (left.type) {
    case 'NumberLiteral':
      return (left as NumberLiteral).value === (right as NumberLiteral).value;

    case 'Identifier':
      return (left as Identifier).name === (right as Identifier).name;

    case 'BinaryExpression': {
      const leftBin = left as BinaryExpression;
      const rightBin = right as BinaryExpression;

      if (leftBin.operator !== rightBin.operator) return false;

      // For commutative operators, check both orders
      if (leftBin.operator === '+' || leftBin.operator === '*') {
        return (
          (areEquivalentExpressions(leftBin.left, rightBin.left) &&
            areEquivalentExpressions(leftBin.right, rightBin.right)) ||
          (areEquivalentExpressions(leftBin.left, rightBin.right) &&
            areEquivalentExpressions(leftBin.right, rightBin.left))
        );
      }

      return (
        areEquivalentExpressions(leftBin.left, rightBin.left) &&
        areEquivalentExpressions(leftBin.right, rightBin.right)
      );
    }

    case 'Fraction': {
      const leftFrac = left as Fraction;
      const rightFrac = right as Fraction;

      return (
        areEquivalentExpressions(leftFrac.numerator, rightFrac.numerator) &&
        areEquivalentExpressions(leftFrac.denominator, rightFrac.denominator)
      );
    }

    default:
      return false;
  }
}

/**
 * Factor out common factors from a polynomial expression
 * Handles cases like: 6x + 9 → 3(2x + 3)
 */
export function factorCommonFactors(node: ASTNode): ASTNode {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') {
    return node;
  }

  const terms = extractAdditionTerms(node);

  // Extract coefficients and find GCD
  const coefficients: number[] = [];
  const hasVariableTerms = terms.some(term => containsVariable(term));

  if (!hasVariableTerms) {
    return node; // No factoring needed for pure constants
  }

  for (const term of terms) {
    const coeff = extractCoefficient(term);
    if (coeff !== null) {
      coefficients.push(Math.abs(coeff));
    }
  }

  if (coefficients.length < 2) {
    return node;
  }

  const commonFactor = coefficients.reduce((a, b) => gcd(a, b));

  if (commonFactor <= 1) {
    return node;
  }

  // Factor out the common coefficient
  const factoredTerms = terms.map(term => {
    const coeff = extractCoefficient(term);
    if (coeff !== null) {
      const newCoeff = Math.abs(coeff) / commonFactor;
      const sign = coeff < 0 ? -1 : 1;
      return multiplyByConstant(removeCoefficient(term), sign * newCoeff);
    }
    return term;
  });

  const factoredSum = buildAdditionFromTerms(factoredTerms);

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: { type: 'NumberLiteral', value: commonFactor },
    right: factoredSum,
  };
}

/**
 * Quadratic factorization: ax² + bx + c → (px + q)(rx + s)
 */
export function factorQuadratic(node: ASTNode, variable: string = 'x'): ASTNode | null {
  // Check if this is a quadratic expression
  const quadraticForm = analyzeQuadraticForm(node, variable);
  if (!quadraticForm) {
    return null;
  }

  const { a, b, c } = quadraticForm;

  // Try to factor using integer factorization
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return null; // No real factorization
  }

  if (discriminant === 0) {
    // Perfect square: a(x + p)²
    const p = -b / (2 * a);
    if (!Number.isInteger(p)) {
      return null;
    }

    const factor: ASTNode = {
      type: 'BinaryExpression',
      operator: p >= 0 ? '+' : '-',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: Math.abs(p) },
    };

    if (a === 1) {
      return {
        type: 'BinaryExpression',
        operator: '^',
        left: factor,
        right: { type: 'NumberLiteral', value: 2 },
      };
    } else {
      return {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'NumberLiteral', value: a },
        right: {
          type: 'BinaryExpression',
          operator: '^',
          left: factor,
          right: { type: 'NumberLiteral', value: 2 },
        },
      };
    }
  }

  // Try integer factorization for perfect discriminants
  const sqrtDiscriminant = Math.sqrt(discriminant);
  if (!Number.isInteger(sqrtDiscriminant)) {
    return null;
  }

  const root1 = (-b + sqrtDiscriminant) / (2 * a);
  const root2 = (-b - sqrtDiscriminant) / (2 * a);

  // Check if roots can be expressed as simple fractions
  if (!isSimpleFraction(root1) || !isSimpleFraction(root2)) {
    return null;
  }

  // Build factored form
  const factor1 = buildLinearFactor(variable, root1);
  const factor2 = buildLinearFactor(variable, root2);

  if (a === 1) {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: factor1,
      right: factor2,
    };
  } else {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: a },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: factor1,
        right: factor2,
      },
    };
  }
}

/**
 * Difference of squares factorization: a² - b² → (a + b)(a - b)
 */
export function factorDifferenceOfSquares(node: ASTNode): ASTNode | null {
  if (node.type !== 'BinaryExpression' || node.operator !== '-') {
    return null;
  }

  const leftSquare = isSquareExpression(node.left);
  const rightSquare = isSquareExpression(node.right);

  if (!leftSquare || !rightSquare) {
    return null;
  }

  const a = leftSquare;
  const b = rightSquare;

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: {
      type: 'BinaryExpression',
      operator: '+',
      left: a,
      right: b,
    },
    right: {
      type: 'BinaryExpression',
      operator: '-',
      left: a,
      right: b,
    },
  };
}

// Helper functions

function extractAdditionTerms(node: ASTNode): ASTNode[] {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') {
    return [node];
  }

  return [...extractAdditionTerms(node.left), ...extractAdditionTerms(node.right)];
}

function buildAdditionFromTerms(terms: ASTNode[]): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (terms.length === 1) {
    return terms[0]!;
  }

  return terms.reduce((acc, term) => ({
    type: 'BinaryExpression',
    operator: '+',
    left: acc,
    right: term,
  }));
}

function containsVariable(node: ASTNode): boolean {
  switch (node.type) {
    case 'Identifier':
      return true;
    case 'BinaryExpression':
      return containsVariable(node.left) || containsVariable(node.right);
    case 'FunctionCall':
      return node.args.some(arg => containsVariable(arg));
    default:
      return false;
  }
}

function extractCoefficient(node: ASTNode): number | null {
  if (node.type === 'NumberLiteral') {
    return node.value;
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (node.left.type === 'NumberLiteral') {
      return node.left.value;
    }
    if (node.right.type === 'NumberLiteral') {
      return node.right.value;
    }
  }

  if (node.type === 'Identifier') {
    return 1;
  }

  return null;
}

function removeCoefficient(node: ASTNode): ASTNode {
  if (node.type === 'NumberLiteral') {
    // For pure numbers, removing coefficient means returning 1
    return { type: 'NumberLiteral', value: 1 };
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (node.left.type === 'NumberLiteral') {
      return node.right;
    }
    if (node.right.type === 'NumberLiteral') {
      return node.left;
    }
  }

  return node;
}

function multiplyByConstant(node: ASTNode, constant: number): ASTNode {
  if (constant === 1) {
    return node;
  }

  if (constant === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: { type: 'NumberLiteral', value: constant },
    right: node,
  };
}

function analyzeQuadraticForm(
  node: ASTNode,
  variable: string
): { a: number; b: number; c: number } | null {
  // This is a simplified implementation - would need more sophisticated polynomial analysis
  // For now, return null to indicate no quadratic form detected
  return null;
}

function isSimpleFraction(num: number): boolean {
  // Check if the number can be expressed as a simple fraction with small denominators
  const tolerance = 1e-10;

  for (let den = 1; den <= 10; den++) {
    const numerator = Math.round(num * den);
    if (Math.abs(num - numerator / den) < tolerance) {
      return true;
    }
  }

  return false;
}

function buildLinearFactor(variable: string, root: number): ASTNode {
  // Build (x - root) or (x + |root|) if root is negative
  if (root === 0) {
    return { type: 'Identifier', name: variable };
  }

  if (root > 0) {
    return {
      type: 'BinaryExpression',
      operator: '-',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: root },
    };
  } else {
    return {
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: -root },
    };
  }
}

function isSquareExpression(node: ASTNode): ASTNode | null {
  if (node.type === 'BinaryExpression' && node.operator === '^') {
    if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
      return node.left;
    }
  }

  // Check for implicit squares like x*x
  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (areEquivalentExpressions(node.left, node.right)) {
      return node.left;
    }
  }

  return null;
}
