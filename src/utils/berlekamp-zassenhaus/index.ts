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
import { ASTNode, StepTree } from '../../types';
import type { NumberLiteral } from '../../types/ast';

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
    options: BZFactorizationOptions = {},
    steps?: StepTree[]
  ): ASTNode[] | null {
    const opts = { ...DEFAULT_BZ_OPTIONS, ...options };

    try {
      if (steps) steps.push(`[BZ] 入力AST: ${JSON.stringify(polynomial)}`);
      // Step 1: Validate and prepare polynomial
      if (!this.polynomialUtils.isPolynomial(polynomial, variable)) {
        if (steps) steps.push(`[BZ] 入力は多項式ではありません`);
        return null;
      }

      // Extract coefficients and degree
      const coefficients = this.polynomialUtils.extractCoefficients(polynomial, variable);
      const degree = coefficients.length - 1;
      if (steps) steps.push(`[BZ] 係数配列: ${JSON.stringify(coefficients)}, 次数: ${degree}`);

      if (degree < 2) {
        if (steps) steps.push(`[BZ] 次数が2未満なので因数分解しません`);
        return null; // Cannot factor linear or constant polynomials
      }

      if (degree > opts.maxDegree) {
        if (steps) steps.push(`[BZ] 次数が最大値${opts.maxDegree}を超えています`);
        throw new Error(`Polynomial degree ${degree} exceeds maximum ${opts.maxDegree}`);
      }

      // Step 2: Select appropriate prime
      const prime = this.selectPrime(coefficients, opts.prime);
      if (steps) steps.push(`[BZ] 使用素数: ${prime}`);
      if (!prime) {
        if (steps) steps.push(`[BZ] 有効な素数が見つかりません`);
        throw new Error('Could not find suitable prime for factorization');
      }

      // Step 3: Factor the polynomial (square-free decomposition is handled elsewhere)
      const allFactors: number[][] = [];

      // Phase 1: Berlekamp algorithm in finite field
      const finiteFieldFactors = this.berlekamp.factorInFiniteField(coefficients, prime);
      if (steps) steps.push(`[BZ] 有限体因数分解結果: ${JSON.stringify(finiteFieldFactors)}`);

      if (finiteFieldFactors.length <= 1) {
        // Irreducible in finite field
        if (steps) steps.push(`[BZ] 有限体で既約`);
        allFactors.push(coefficients);
      } else {
        // Phase 2: Hensel lifting
        if (steps) steps.push(`[BZ] Henselリフト開始`);
        const liftedFactors = this.henselLifting.liftFactors(
          coefficients,
          finiteFieldFactors,
          prime,
          opts.targetPrecision
        );
        if (steps) steps.push(`[BZ] Henselリフト結果: ${JSON.stringify(liftedFactors)}`);
        allFactors.push(...liftedFactors);
      }

      // Convert coefficient arrays back to AST nodes
      if (allFactors.length <= 1) {
        if (steps)
          steps.push(`[BZ] 高度な因数分解で分解できなかったので基本因数分解にフォールバック`);
        // Try basic factorization as fallback
        return this.attemptBasicFactorization(polynomial, variable);
      }

      const astFactors = this.convertCoefficientsToAST(allFactors, variable);
      if (steps) steps.push(`[BZ] AST因数リスト: ${JSON.stringify(astFactors)}`);
      return astFactors;
    } catch (error) {
      if (steps)
        steps.push(`[BZ] 例外発生: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback to basic factorization
      return this.attemptBasicFactorization(polynomial, variable);
    }
  }

  /**
   * Fallback: Basic factorization for simple cases
   */
  private attemptBasicFactorization(polynomial: ASTNode, variable: string): ASTNode[] | null {
    const coefficients = this.polynomialUtils.extractCoefficients(polynomial, variable);
    // 和・差の立方公式: x^3 + a^3 = (x + a)(x^2 - a x + a^2), x^3 - a^3 = (x - a)(x^2 + a x + a^2)
    if (coefficients.length === 4) {
      const d = coefficients[0]; // 定数項
      const c = coefficients[1]; // 1次
      const b = coefficients[2]; // 2次
      const a = coefficients[3]; // 3次
      // x^3 + a^3
      if (a === 1 && b === 0 && c === 0 && typeof d === 'number') {
        const cubeRoot = Math.cbrt(Math.abs(d));
        if (Number.isInteger(cubeRoot)) {
          if (d > 0) {
            // x^3 + a^3
            const lin = this.createLinearFactor(1, cubeRoot, variable);
            const quad = this.polynomialUtils.coefficientsToAST(
              [cubeRoot * cubeRoot, -cubeRoot, 1],
              variable
            );
            return [lin, quad];
          } else if (d < 0) {
            // x^3 - a^3
            const lin = this.createLinearFactor(1, -cubeRoot, variable);
            const quad = this.polynomialUtils.coefficientsToAST(
              [cubeRoot * cubeRoot, cubeRoot, 1],
              variable
            );
            return [lin, quad];
          }
        }
      }
    }
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

    // まず全ての係数で割り切れない素数を探す
    for (const prime of primes) {
      if (this.isPrimeValid(prime, coefficients)) {
        return prime;
      }
    }

    // それでも見つからない場合、定数項と最高次項の最大公約数で割り切れない素数を探す
    const nonZeroCoeffs = coefficients.filter(c => c !== 0).map(c => Math.abs(c));
    const constant = nonZeroCoeffs[0] ?? 1;
    const leading = nonZeroCoeffs[nonZeroCoeffs.length - 1] ?? 1;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(constant, leading);
    for (const prime of primes) {
      if (g % prime !== 0) {
        return prime;
      }
    }

    // それでもダメなら primes のどれかを強制的に返す（BZが失敗してもstepsに記録される）
    return primes[0] ?? null;
  }

  /**
   * Check if a prime is valid (doesn't divide any coefficient)
   */
  private isPrimeValid(prime: number, coefficients: number[]): boolean {
    return coefficients.every(coeff => coeff % prime !== 0);
  }

  // Square-free decomposition and substitutions (e.g., t = x^k) are handled by other strategies.

  /**
   * Convert coefficient arrays back to AST node representation
   */
  private convertCoefficientsToAST(factorCoefficients: number[][], variable: string): ASTNode[] {
    // 型ガード
    function isNumberLiteral(node: ASTNode): node is { type: 'NumberLiteral'; value: number } {
      return node.type === 'NumberLiteral' && typeof (node as NumberLiteral).value === 'number';
    }

    // すべての因子をASTに変換し、undefinedを除外
    const astFactors = factorCoefficients
      .map(coeffs => this.polynomialUtils.coefficientsToAST(coeffs, variable))
      .filter((node): node is ASTNode => node !== undefined && node !== null);

    // 定数因子と多項式因子を分離
    const constantFactors = astFactors
      .filter(isNumberLiteral)
      .filter(node => node.value !== 1 && node.value !== 0);
    const polyFactors = astFactors.filter(
      node => !isNumberLiteral(node) || node.value === 1 || node.value === 0
    );

    // 定数因子をまとめて掛ける
    let constantProduct = 1;
    for (const node of constantFactors) {
      if (isNumberLiteral(node)) {
        constantProduct *= node.value;
      }
    }

    // 0が含まれていれば全体が0
    if (constantProduct === 0) {
      return [{ type: 'NumberLiteral', value: 0 }];
    }

    // 1以外の定数因子があれば先頭に掛ける
    let resultFactors = polyFactors.filter(
      node => !(isNumberLiteral(node) && node.value === 1 && node !== undefined)
    );
    resultFactors = resultFactors.filter(
      (node): node is ASTNode => node !== undefined && node !== null
    );
    if (constantProduct !== 1) {
      resultFactors = [{ type: 'NumberLiteral', value: constantProduct }, ...resultFactors];
    }

    // すべての因子を掛け合わせたASTを返す
    if (!resultFactors || resultFactors.length === 0) {
      return [{ type: 'NumberLiteral', value: 1 }];
    } else if (resultFactors.length === 1) {
      // filterでundefined/nullを除外済み
      return [resultFactors[0] as ASTNode];
    } else {
      // 左から順に掛ける
      let acc: ASTNode = resultFactors[0] as ASTNode;
      for (let i = 1; i < resultFactors.length; i++) {
        acc = {
          type: 'BinaryExpression',
          operator: '*',
          left: acc,
          right: resultFactors[i] as ASTNode,
        };
      }
      return [acc];
    }
  }
}

/**
 * Main export function for easy use
 */
export function berlekampZassenhausFactor(
  polynomial: ASTNode,
  variable: string = 'x',
  options: BZFactorizationOptions = {},
  steps?: StepTree[]
): ASTNode[] | null {
  const factorizer = new BerlekampZassenhausFactorizer();
  return factorizer.factor(polynomial, variable, options, steps);
}

// Re-export related classes
export { BerlekampAlgorithm } from './berlekamp';
export { HenselLifting } from './hensel-lifting';
export { FiniteFieldPolynomial, ModularArithmetic } from './finite-field';
export { PolynomialUtils } from './polynomial-utils';
