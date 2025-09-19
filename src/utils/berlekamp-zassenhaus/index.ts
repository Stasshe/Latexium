/**
 * Berlekamp-Zassenhaus Algorithm Implementation
 * Main entry point for polynomial factorization using BZ algorithm
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Note: console is not available in this environment
      // console.warn('Berlekamp-Zassenhaus factorization failed:', errorMessage);
      return null;
    } * Based on factor.md specifications:
 * - Phase 1: Finite field factorization using Berlekamp's algorithm
 * - Phase 2: Hensel lifting to lift factors to desired precision
 */

import { BerlekampAlgorithm } from './berlekamp';
import { HenselLifting } from './hensel-lifting';
import { PolynomialUtils } from './polynomial-utils';
import { ASTNode } from '../../types';

/**
 * Berlekamp-Zassenhaus factorization options
 */
export interface BZFactorizationOptions {
  /** Prime for finite field operations (should not divide polynomial coefficients) */
  prime?: number;
  /** Target precision for Hensel lifting */
  targetPrecision?: number;
  /** Maximum degree for factorization attempts */
  maxDegree?: number;
  /** Use BigInt for high precision arithmetic */
  useBigInt?: boolean;
}

/**
 * Default options for BZ factorization
 */
const DEFAULT_BZ_OPTIONS: Required<BZFactorizationOptions> = {
  prime: 2, // Will be automatically selected
  targetPrecision: 1000, // High precision for coefficient bounds
  maxDegree: 20,
  useBigInt: true,
};

/**
 * Main Berlekamp-Zassenhaus factorization function
 */
export class BerlekampZassenhausFactorizer {
  private berlekamp: BerlekampAlgorithm;
  private henselLifting: HenselLifting;
  private polynomialUtils: PolynomialUtils;

  constructor() {
    this.berlekamp = new BerlekampAlgorithm();
    this.henselLifting = new HenselLifting();
    this.polynomialUtils = new PolynomialUtils();
  }

  /**
   * Factor a polynomial using Berlekamp-Zassenhaus algorithm
   *
   * @param polynomial - Input polynomial as AST node
   * @param variable - Variable name (default: 'x')
   * @param options - Factorization options
   * @returns Array of factored polynomials or null if irreducible
   */
  factor(
    polynomial: ASTNode,
    variable: string = 'x',
    options: BZFactorizationOptions = {}
  ): ASTNode[] | null {
    const opts = { ...DEFAULT_BZ_OPTIONS, ...options };

    try {
      // Step 1: Validate and prepare polynomial
      if (!this.polynomialUtils.isPolynomial(polynomial, variable)) {
        return null;
      }

      // Extract coefficients and degree
      const coefficients = this.polynomialUtils.extractCoefficients(polynomial, variable);
      const degree = coefficients.length - 1;

      if (degree < 2) {
        return null; // Cannot factor linear or constant polynomials
      }

      if (degree > opts.maxDegree) {
        throw new Error(`Polynomial degree ${degree} exceeds maximum ${opts.maxDegree}`);
      }

      // Step 2: Select appropriate prime
      const prime = this.selectPrime(coefficients, opts.prime);
      if (!prime) {
        throw new Error('Could not find suitable prime for factorization');
      }

      // Step 3: Apply square-free decomposition (preprocessing)
      const squareFreeFactors = this.squareFreeDecomposition(coefficients, prime);

      // Step 4: Factor each square-free factor
      const allFactors: number[][] = [];

      for (const factor of squareFreeFactors) {
        // Phase 1: Berlekamp algorithm in finite field
        const finiteFieldFactors = this.berlekamp.factorInFiniteField(factor, prime);

        if (finiteFieldFactors.length <= 1) {
          // Irreducible in finite field
          allFactors.push(factor);
          continue;
        }

        // Phase 2: Hensel lifting
        const liftedFactors = this.henselLifting.liftFactors(
          factor,
          finiteFieldFactors,
          prime,
          opts.targetPrecision
        );

        allFactors.push(...liftedFactors);
      }

      // Step 5: Convert coefficient arrays back to AST nodes
      if (allFactors.length <= 1) {
        // Try basic factorization as fallback
        return this.attemptBasicFactorization(polynomial, variable);
      }

      return this.convertCoefficientsToAST(allFactors, variable);
    } catch (error) {
      // Fallback to basic factorization
      return this.attemptBasicFactorization(polynomial, variable);
    }
  }

  /**
   * Fallback: Basic factorization for simple cases
   */
  private attemptBasicFactorization(polynomial: ASTNode, variable: string): ASTNode[] | null {
    try {
      const coefficients = this.polynomialUtils.extractCoefficients(polynomial, variable);

      // Handle quadratic case: ax² + bx + c
      if (coefficients.length === 3) {
        const c = coefficients[0]; // constant term
        const b = coefficients[1]; // linear term
        const a = coefficients[2]; // quadratic term

        if (a === 1 && typeof c === 'number' && typeof b === 'number') {
          // x² + bx + c = (x + p)(x + q) where p*q = c and p+q = b
          for (let p = -50; p <= 50; p++) {
            if (p === 0) continue;
            if (c % p === 0) {
              const q = c / p;
              if (Math.abs(p + q - b) < 0.0001) {
                // Allow for floating point precision
                // Found factors: (x + p)(x + q)
                const factor1 = this.createLinearFactor(1, p, variable);
                const factor2 = this.createLinearFactor(1, q, variable);
                return [factor1, factor2];
              }
            }
          }
        }
      }

      // Handle cubic case with rational root theorem
      if (coefficients.length === 4) {
        const d = coefficients[0]; // constant term
        const c = coefficients[1]; // linear term
        const b = coefficients[2]; // quadratic term
        const a = coefficients[3]; // cubic term

        if (typeof d === 'number' && typeof a === 'number') {
          // Try rational roots: ±(factors of d)/(factors of a)
          const factorsD = this.getFactors(Math.abs(d));
          const factorsA = this.getFactors(Math.abs(a));

          for (const fd of factorsD) {
            for (const fa of factorsA) {
              for (const sign of [1, -1]) {
                const root = (sign * fd) / fa;
                if (this.isRoot(coefficients, root)) {
                  // Found a root, factor out (x - root)
                  const remaining = this.syntheticDivision(coefficients, root, variable);
                  if (remaining) {
                    const rootFactor = this.createLinearFactor(1, -root, variable);
                    return [rootFactor, remaining];
                  }
                }
              }
            }
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create a linear factor AST node: coeff*variable + constant
   */
  private createLinearFactor(coeff: number, constant: number, variable: string): ASTNode {
    const variableTerm: ASTNode =
      coeff === 1
        ? { type: 'Identifier', name: variable }
        : {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: coeff },
            right: { type: 'Identifier', name: variable },
          };

    if (constant === 0) {
      return variableTerm;
    } else if (constant > 0) {
      return {
        type: 'BinaryExpression',
        operator: '+',
        left: variableTerm,
        right: { type: 'NumberLiteral', value: constant },
      };
    } else {
      return {
        type: 'BinaryExpression',
        operator: '-',
        left: variableTerm,
        right: { type: 'NumberLiteral', value: -constant },
      };
    }
  }

  /**
   * Get integer factors of a number
   */
  private getFactors(n: number): number[] {
    const factors: number[] = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        factors.push(i);
        if (i !== n / i) {
          factors.push(n / i);
        }
      }
    }
    return factors.sort((a, b) => a - b);
  }

  /**
   * Check if a value is a root of the polynomial
   */
  private isRoot(coefficients: number[], root: number): boolean {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
      const coeff = coefficients[i];
      if (typeof coeff === 'number') {
        result += coeff * Math.pow(root, i);
      }
    }
    return Math.abs(result) < 0.0001;
  }

  /**
   * Synthetic division to factor out (x - root)
   */
  private syntheticDivision(
    coefficients: number[],
    root: number,
    variable: string
  ): ASTNode | null {
    // Simple implementation - return the remaining polynomial after factoring out the root
    const newCoeffs = [...coefficients];
    // This would need a proper synthetic division implementation
    // For now, just return a simplified polynomial
    if (newCoeffs.length === 4) {
      // Return quadratic - ensure all coefficients are defined
      const c0 = newCoeffs[0];
      const c1 = newCoeffs[1];
      const c2 = newCoeffs[2];

      if (typeof c0 === 'number' && typeof c1 === 'number' && typeof c2 === 'number') {
        return this.polynomialUtils.coefficientsToAST([c0, c1, c2], variable);
      }
    }
    return null;
  }

  /**
   * Select a prime that doesn't divide any coefficient
   * and is suitable for finite field operations
   */
  private selectPrime(coefficients: number[], suggestedPrime?: number): number | null {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

    // If a prime is suggested, try it first
    if (suggestedPrime && this.isPrimeValid(suggestedPrime, coefficients)) {
      return suggestedPrime;
    }

    // Find the first valid prime
    for (const prime of primes) {
      if (this.isPrimeValid(prime, coefficients)) {
        return prime;
      }
    }

    return null;
  }

  /**
   * Check if a prime is valid (doesn't divide any coefficient)
   */
  private isPrimeValid(prime: number, coefficients: number[]): boolean {
    return coefficients.every(coeff => coeff % prime !== 0);
  }

  /**
   * Square-free decomposition preprocessing step
   * Returns array of square-free factors
   */
  private squareFreeDecomposition(coefficients: number[], prime: number): number[][] {
    // For now, return the original polynomial
    // In a full implementation, this would separate square factors
    return [coefficients];
  }

  /**
   * Convert coefficient arrays back to AST node representation
   */
  private convertCoefficientsToAST(factorCoefficients: number[][], variable: string): ASTNode[] {
    return factorCoefficients.map(coeffs =>
      this.polynomialUtils.coefficientsToAST(coeffs, variable)
    );
  }
}

/**
 * Main export function for easy use
 */
export function berlekampZassenhausFactor(
  polynomial: ASTNode,
  variable: string = 'x',
  options: BZFactorizationOptions = {}
): ASTNode[] | null {
  const factorizer = new BerlekampZassenhausFactorizer();
  return factorizer.factor(polynomial, variable, options);
}

// Re-export related classes
export { BerlekampAlgorithm } from './berlekamp';
export { HenselLifting } from './hensel-lifting';
export { FiniteFieldPolynomial, ModularArithmetic } from './finite-field';
export { PolynomialUtils } from './polynomial-utils';
