/**
 * LLL (Lenstra-Lenstra-Lovász) Algorithm Implementation
 * Advanced polynomial factorization using lattice basis reduction
 */

import { createLatticeBasis, lllReduce, findShortVectors } from './lll-lattice';
import { ASTNode } from '../../types';
import { PolynomialUtils } from '../berlekamp-zassenhaus/polynomial-utils';
import { FactorizationContext } from '../factorization/framework';
import { simplify as middleSimplify } from '../middle-simplify';

/**
 * LLL Algorithm options
 */
export interface LLLOptions {
  /** LLL reduction parameter (typically 3/4) */
  delta?: number;
  /** Maximum degree for factorization attempts */
  maxDegree?: number;
  /** Precision for numerical calculations */
  precision?: number;
}

/**
 * Default LLL options
 */
const DEFAULT_LLL_OPTIONS: Required<LLLOptions> = {
  delta: 0.75,
  maxDegree: 15,
  precision: 1000,
};

/**
 * LLL Factorization Algorithm
 */
export class LLLFactorizer {
  private polynomialUtils: PolynomialUtils;

  constructor() {
    this.polynomialUtils = new PolynomialUtils();
  }

  /**
   * Factor a polynomial using LLL algorithm
   *
   * @param polynomial - Input polynomial as AST node
   * @param variable - Variable name (default: 'x')
   * @param options - LLL options
   * @returns Array of factored polynomials or null if irreducible
   */
  factor(
    polynomial: ASTNode,
    variable: string = 'x',
    options: LLLOptions = {},
    context?: FactorizationContext
  ): ASTNode | null {
    const opts = { ...DEFAULT_LLL_OPTIONS, ...options };

    try {
      // Step 1: Validate and prepare polynomial
      if (!this.polynomialUtils.isPolynomial(polynomial, variable)) {
        return polynomial;
      }

      const coefficients = this.polynomialUtils.extractCoefficients(polynomial, variable);
      const degree = coefficients.length - 1;

      if (degree < 2) {
        return polynomial; // Cannot factor linear or constant polynomials
      }

      if (degree > opts.maxDegree) {
        return polynomial; // Degree too high for LLL
      }

      // Step 2: Try different factorization approaches
      const ctx: FactorizationContext = context ?? {
        variable,
        maxIterations: 1,
        currentIteration: 1,
        steps: [],
        preferences: {
          preferCompleteFactorization: true,
          allowIrrationalFactors: false,
          allowComplexFactors: false,
          simplifyCoefficients: true,
          extractCommonFactors: false,
        },
      };
      const factors = this.attemptLLLFactorization(coefficients, ctx, opts);

      if (!factors || factors.length === 0) {
        return polynomial;
      }

      // 1つも因数がなければoriginal
      // 1つだけならそれを返す
      // 2つ以上なら掛け算ASTにまとめる
      let result: ASTNode;
      if (factors.length === 1) {
        result = factors[0]!;
      } else {
        result = factors.reduce((acc, f) => ({
          type: 'BinaryExpression',
          operator: '*',
          left: acc,
          right: f,
        }));
      }
      // 必ずmiddle-simplify（expand: false）で整形して返す
      return middleSimplify(result, { expand: false });
    } catch (error) {
      return polynomial;
    }
  }

  /**
   * Attempt LLL-based factorization
   *
   * Note: This is called only after all simpler strategies (common-factor, difference-of-squares, etc.) have failed.
   *       No pattern検出や共通因数除去はここでは行わない。
   */
  private attemptLLLFactorization(
    coefficients: number[],
    context: FactorizationContext,
    options: Required<LLLOptions>
  ): ASTNode[] | null {
    const degree = coefficients.length - 1;
    if (degree < 3) return null;

    // --- Step 1: 格子基底生成 ---
    const bound = 1000;
    const basis = createLatticeBasis(coefficients, bound);
    if (!basis || basis.length === 0) return null;

    // --- Step 2: LLL還元 ---
    const reduced = lllReduce(basis);
    if (!reduced || reduced.length === 0) return null;

    // --- Step 3: 短ベクトル抽出（因数候補）---
    const shortVecs: number[][] = findShortVectors(reduced, 10000);
    if (!shortVecs || shortVecs.length === 0) return null;

    // --- Step 4: 短ベクトル→多項式係数→因数性検証 ---
    const candidates: number[][] = shortVecs
      .map((v: number[]) => v.map((x: number) => Math.round(x)))
      .filter((v: number[]) => v.length > 1 && v.some((x: number) => x !== 0));

    const variable = context.variable || 'x';
    const utils = this.polynomialUtils;
    const factors: ASTNode[] = [];
    let remaining = coefficients.slice();
    for (const cand of candidates) {
      if (cand[0] === 0 || cand[cand.length - 1] === 0) continue;
      const div = tryPolyDivide(remaining, cand);
      if (div && div.remainder.every((x: number | undefined) => Math.abs(x ?? 0) < 1e-8)) {
        factors.push(utils.coefficientsToAST(cand, variable));
        remaining = div.quotient;
      }
    }
    if (factors.length > 0) {
      if (remaining.length > 1 || (remaining.length === 1 && Math.abs(remaining[0] ?? 0) > 1e-8)) {
        factors.push(utils.coefficientsToAST(remaining, variable));
      }
      return factors;
    }
    return null;
  }
}

// 多項式の整数係数除算（剰余も返す）

function tryPolyDivide(
  dividend: number[],
  divisor: number[]
): { quotient: number[]; remainder: number[] } | null {
  const n = dividend.length - 1;
  const m = divisor.length - 1;
  if (m < 0 || n < m) return null;
  const quotient = new Array(n - m + 1).fill(0);
  const remainder = dividend.slice();
  for (let k = n - m; k >= 0; k--) {
    if (typeof divisor[m] !== 'number' || Math.abs(divisor[m] ?? 0) < 1e-8) return null;
    if (typeof remainder[m + k] !== 'number') return null;
    const q = remainder[m + k]! / divisor[m]!;
    quotient[k] = q;
    for (let j = 0; j <= m; j++) {
      if (typeof divisor[j] !== 'number') return null;
      remainder[j + k] = (remainder[j + k] ?? 0) - q * divisor[j]!;
    }
  }
  return { quotient, remainder };
}

// enhancedCubicFactorizationは他戦略で実装されているため削除

// advancedHighDegreeFactorization, recognizeSpecialPatterns, isDifferenceOfPowers, etc. are not needed here.

// quadraticFactorizationは他戦略で実装されているため削除

// recognizeSpecialPatterns, isDifferenceOfPowers, factorDifferenceOfPowers, etc. are intentionally omitted in LLL strategy.

/**
 * Check if polynomial is of form x^n - a^n
 */

// isDifferenceOfPowers, factorDifferenceOfPowers, buildCyclotomicQuotient などはLLL戦略では不要。

// findRationalRootsは他戦略で実装されているため削除

// getFactorsは他戦略で実装されているため削除

// isRootは他戦略で実装されているため削除

// syntheticDivisionは他戦略で実装されているため削除

// cardanoMethod, cubicSubstitutionMethods, numericalLLLApproximation も他戦略で実装されているため削除

// isSumOfPowers, factorSumOfPowers, isPalindromic, factorPalindromic, isReciprocal, factorReciprocal なども不要。

/**
 * Convert coefficient arrays back to AST representation
 */

/**
 * Main export function for LLL factorization
 *
 * Note: This is called only after all simpler strategies (common-factor, difference-of-squares, etc.) have failed.
 *       No pattern detection or common factor removal is performed here.
 */
export function lllFactor(
  polynomial: ASTNode,
  variable: string = 'x',
  options: LLLOptions = {}
): ASTNode | null {
  const factorizer = new LLLFactorizer();
  return factorizer.factor(polynomial, variable, options);
}
