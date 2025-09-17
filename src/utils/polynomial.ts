/**
 * Polynomial System for Advanced Factorization
 * Comprehensive polynomial manipulation, expansion, and factorization
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier, Fraction } from '../types';
import { gcd } from './simplification';

/**
 * Represents a polynomial term: coefficient * variable^power
 */
export interface PolynomialTerm {
  coefficient: number;
  variable: string;
  power: number;
}

/**
 * Represents a polynomial as a collection of terms
 */
export class Polynomial {
  terms: Map<string, number>; // key: "variable^power", value: coefficient
  variable: string;

  constructor(variable: string = 'x') {
    this.terms = new Map();
    this.variable = variable;
  }

  /**
   * Add a term to the polynomial
   */
  addTerm(coefficient: number, power: number): void {
    const key = power === 0 ? 'constant' : `${this.variable}^${power}`;
    const existing = this.terms.get(key) || 0;
    const newCoeff = existing + coefficient;

    if (Math.abs(newCoeff) < 1e-12) {
      this.terms.delete(key);
    } else {
      this.terms.set(key, newCoeff);
    }
  }

  /**
   * Get coefficient of a specific power
   */
  getCoefficient(power: number): number {
    const key = power === 0 ? 'constant' : `${this.variable}^${power}`;
    return this.terms.get(key) || 0;
  }

  /**
   * Get the degree of the polynomial
   */
  getDegree(): number {
    let maxDegree = 0;
    for (const key of this.terms.keys()) {
      if (key !== 'constant') {
        const power = parseInt(key.split('^')[1] || '1');
        maxDegree = Math.max(maxDegree, power);
      }
    }
    return maxDegree;
  }

  /**
   * Multiply this polynomial by another polynomial
   */
  multiply(other: Polynomial): Polynomial {
    const result = new Polynomial(this.variable);

    for (const [key1, coeff1] of this.terms) {
      const power1 = key1 === 'constant' ? 0 : parseInt(key1.split('^')[1] || '1');

      for (const [key2, coeff2] of other.terms) {
        const power2 = key2 === 'constant' ? 0 : parseInt(key2.split('^')[1] || '1');

        result.addTerm(coeff1 * coeff2, power1 + power2);
      }
    }

    return result;
  }

  /**
   * Add another polynomial to this one
   */
  add(other: Polynomial): Polynomial {
    const result = new Polynomial(this.variable);

    // Add all terms from this polynomial
    for (const [key, coeff] of this.terms) {
      const power = key === 'constant' ? 0 : parseInt(key.split('^')[1] || '1');
      result.addTerm(coeff, power);
    }

    // Add all terms from other polynomial
    for (const [key, coeff] of other.terms) {
      const power = key === 'constant' ? 0 : parseInt(key.split('^')[1] || '1');
      result.addTerm(coeff, power);
    }

    return result;
  }

  /**
   * Subtract another polynomial from this one
   */
  subtract(other: Polynomial): Polynomial {
    const result = new Polynomial(this.variable);

    // Add all terms from this polynomial
    for (const [key, coeff] of this.terms) {
      const power = key === 'constant' ? 0 : parseInt(key.split('^')[1] || '1');
      result.addTerm(coeff, power);
    }

    // Subtract all terms from other polynomial
    for (const [key, coeff] of other.terms) {
      const power = key === 'constant' ? 0 : parseInt(key.split('^')[1] || '1');
      result.addTerm(-coeff, power);
    }

    return result;
  }

  /**
   * Factor out the greatest common factor
   */
  factorGCF(): { factor: number; polynomial: Polynomial } {
    const coefficients = Array.from(this.terms.values()).map(Math.abs);

    if (coefficients.length === 0) {
      return { factor: 1, polynomial: new Polynomial(this.variable) };
    }

    const gcf = coefficients.reduce((a, b) => gcd(a, b));

    if (gcf <= 1) {
      return { factor: 1, polynomial: this };
    }

    const result = new Polynomial(this.variable);
    for (const [key, coeff] of this.terms) {
      const power = key === 'constant' ? 0 : parseInt(key.split('^')[1] || '1');
      result.addTerm(coeff / gcf, power);
    }

    return { factor: gcf, polynomial: result };
  }

  /**
   * Check if this is a zero polynomial
   */
  isZero(): boolean {
    return this.terms.size === 0;
  }

  /**
   * Convert back to AST representation
   */
  toAST(): ASTNode {
    if (this.terms.size === 0) {
      return { type: 'NumberLiteral', value: 0 };
    }

    const sortedTerms = Array.from(this.terms.entries()).sort((a, b) => {
      const powerA = a[0] === 'constant' ? 0 : parseInt(a[0].split('^')[1] || '1');
      const powerB = b[0] === 'constant' ? 0 : parseInt(b[0].split('^')[1] || '1');
      return powerB - powerA; // Descending order
    });

    let result: ASTNode = this.termToAST(sortedTerms[0]![0], sortedTerms[0]![1]);

    for (let i = 1; i < sortedTerms.length; i++) {
      const [key, coeff] = sortedTerms[i]!;
      const termAST = this.termToAST(key, Math.abs(coeff));

      result = {
        type: 'BinaryExpression',
        operator: coeff >= 0 ? '+' : '-',
        left: result,
        right: termAST,
      };
    }

    return result;
  }

  private termToAST(key: string, coefficient: number): ASTNode {
    if (key === 'constant') {
      return { type: 'NumberLiteral', value: coefficient };
    }

    const power = parseInt(key.split('^')[1] || '1');

    let variablePart: ASTNode = { type: 'Identifier', name: this.variable };
    if (power !== 1) {
      variablePart = {
        type: 'BinaryExpression',
        operator: '^',
        left: variablePart,
        right: { type: 'NumberLiteral', value: power },
      };
    }

    if (Math.abs(coefficient - 1) < 1e-12) {
      return variablePart;
    }

    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: coefficient },
      right: variablePart,
    };
  }
}

/**
 * Convert AST to polynomial representation
 */
export function astToPolynomial(node: ASTNode, variable: string = 'x'): Polynomial {
  const poly = new Polynomial(variable);

  switch (node.type) {
    case 'NumberLiteral':
      poly.addTerm(node.value, 0);
      break;

    case 'Identifier':
      if (node.name === variable) {
        poly.addTerm(1, 1);
      } else {
        // Treat as constant
        poly.addTerm(1, 0); // This is simplified - should handle other variables
      }
      break;

    case 'BinaryExpression':
      handleBinaryExpression(node, poly, variable);
      break;

    default:
      // Fallback: treat as constant 1
      poly.addTerm(1, 0);
  }

  return poly;
}

function handleBinaryExpression(node: BinaryExpression, poly: Polynomial, variable: string): void {
  switch (node.operator) {
    case '+': {
      const leftPoly = astToPolynomial(node.left, variable);
      const rightPoly = astToPolynomial(node.right, variable);
      const result = leftPoly.add(rightPoly);

      // Copy result to poly
      poly.terms.clear();
      for (const [key, coeff] of result.terms) {
        poly.terms.set(key, coeff);
      }
      break;
    }

    case '-': {
      const leftPoly = astToPolynomial(node.left, variable);
      const rightPoly = astToPolynomial(node.right, variable);
      const result = leftPoly.subtract(rightPoly);

      // Copy result to poly
      poly.terms.clear();
      for (const [key, coeff] of result.terms) {
        poly.terms.set(key, coeff);
      }
      break;
    }

    case '*': {
      const leftPoly = astToPolynomial(node.left, variable);
      const rightPoly = astToPolynomial(node.right, variable);
      const result = leftPoly.multiply(rightPoly);

      // Copy result to poly
      poly.terms.clear();
      for (const [key, coeff] of result.terms) {
        poly.terms.set(key, coeff);
      }
      break;
    }

    case '^': {
      if (
        node.right.type === 'NumberLiteral' &&
        Number.isInteger(node.right.value) &&
        node.right.value >= 0
      ) {
        const basePoly = astToPolynomial(node.left, variable);
        let result = new Polynomial(variable);
        result.addTerm(1, 0); // Start with 1

        for (let i = 0; i < node.right.value; i++) {
          result = result.multiply(basePoly);
        }

        // Copy result to poly
        poly.terms.clear();
        for (const [key, coeff] of result.terms) {
          poly.terms.set(key, coeff);
        }
      } else {
        // Non-integer or negative power - treat as single term
        if (
          node.left.type === 'Identifier' &&
          node.left.name === variable &&
          node.right.type === 'NumberLiteral'
        ) {
          poly.addTerm(1, node.right.value);
        } else {
          poly.addTerm(1, 0); // Fallback
        }
      }
      break;
    }

    default:
      // Fallback: treat as constant
      poly.addTerm(1, 0);
  }
}

/**
 * Advanced polynomial factorization
 */
export function factorPolynomial(poly: Polynomial): ASTNode {
  // First, factor out GCF
  const { factor, polynomial } = poly.factorGCF();

  if (polynomial.isZero()) {
    return { type: 'NumberLiteral', value: 0 };
  }

  // Try different factorization strategies
  let factored = tryQuadraticFactorization(polynomial);
  if (!factored) {
    factored = tryDifferenceOfSquares(polynomial);
  }
  if (!factored) {
    factored = polynomial.toAST();
  }

  // Apply GCF if necessary
  if (Math.abs(factor - 1) > 1e-12) {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: factor },
      right: factored,
    };
  }

  return factored;
}

function tryQuadraticFactorization(poly: Polynomial): ASTNode | null {
  if (poly.getDegree() !== 2) return null;

  const a = poly.getCoefficient(2);
  const b = poly.getCoefficient(1);
  const c = poly.getCoefficient(0);

  if (Math.abs(a) < 1e-12) return null;

  // Try to factor ax² + bx + c
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  if (Math.abs(discriminant) < 1e-12) {
    // Perfect square: a(x + p)²
    const p = -b / (2 * a);
    if (!Number.isInteger(p * 1000)) return null; // Only simple fractions

    const factor: ASTNode = {
      type: 'BinaryExpression',
      operator: p >= 0 ? '+' : '-',
      left: { type: 'Identifier', name: poly.variable },
      right: { type: 'NumberLiteral', value: Math.abs(p) },
    };

    const squared: ASTNode = {
      type: 'BinaryExpression',
      operator: '^',
      left: factor,
      right: { type: 'NumberLiteral', value: 2 },
    };

    if (Math.abs(a - 1) < 1e-12) {
      return squared;
    }

    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: a },
      right: squared,
    };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  if (!Number.isInteger(sqrtDisc)) return null;

  const root1 = (-b + sqrtDisc) / (2 * a);
  const root2 = (-b - sqrtDisc) / (2 * a);

  // Check if roots are simple
  if (!isSimpleNumber(root1) || !isSimpleNumber(root2)) return null;

  const factor1 = buildLinearFactor(poly.variable, root1);
  const factor2 = buildLinearFactor(poly.variable, root2);

  const factored: ASTNode = {
    type: 'BinaryExpression',
    operator: '*',
    left: factor1,
    right: factor2,
  };

  if (Math.abs(a - 1) < 1e-12) {
    return factored;
  }

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: { type: 'NumberLiteral', value: a },
    right: factored,
  };
}

function tryDifferenceOfSquares(poly: Polynomial): ASTNode | null {
  if (poly.getDegree() !== 2) return null;

  const a = poly.getCoefficient(2);
  const b = poly.getCoefficient(1);
  const c = poly.getCoefficient(0);

  // Check for pattern: ax² + 0x + c where a and c have opposite signs
  if (Math.abs(b) > 1e-12) return null;
  if (a * c >= 0) return null;

  const sqrtA = Math.sqrt(Math.abs(a));
  const sqrtC = Math.sqrt(Math.abs(c));

  if (!Number.isInteger(sqrtA) || !Number.isInteger(sqrtC)) return null;

  // a = sqrtA², c = -sqrtC² (or vice versa)
  const term1: ASTNode =
    sqrtA === 1
      ? { type: 'Identifier', name: poly.variable }
      : {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: sqrtA },
          right: { type: 'Identifier', name: poly.variable },
        };

  const term2: ASTNode = { type: 'NumberLiteral', value: sqrtC };

  const factor1: ASTNode = {
    type: 'BinaryExpression',
    operator: '+',
    left: term1,
    right: term2,
  };

  const factor2: ASTNode = {
    type: 'BinaryExpression',
    operator: '-',
    left: term1,
    right: term2,
  };

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: factor1,
    right: factor2,
  };
}

function isSimpleNumber(num: number): boolean {
  // Check if it's an integer or simple fraction
  if (Number.isInteger(num)) return true;

  // Check small denominators
  for (let den = 2; den <= 10; den++) {
    if (Math.abs(num * den - Math.round(num * den)) < 1e-12) {
      return true;
    }
  }

  return false;
}

function buildLinearFactor(variable: string, root: number): ASTNode {
  if (Math.abs(root) < 1e-12) {
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
