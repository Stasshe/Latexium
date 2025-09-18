/**
 * Mathematical Helper Functions
 * Basic mathematical utilities for simplification and factorization
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
      return Math.abs((left as NumberLiteral).value - (right as NumberLiteral).value) < 1e-10;

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
