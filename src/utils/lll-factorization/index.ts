/**
 * LLL (Lenstra-Lenstra-Lovász) Algorithm Implementation
 * Advanced polynomial factorization using lattice basis reduction
 */

import { createLatticeBases, lllReduce, findShortVectors } from './lll-lattice';
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

    // --- Step 1: 複数基底生成（全因数次数m=1..n-1） ---
    const bound = 1000;
    const bases = createLatticeBases(coefficients, bound);
    if (!bases || bases.length === 0) return null;

    // --- Step 2: 各基底でLLL還元・短ベクトル抽出 ---
    const allCandidates: number[][] = [];
    for (let m = 1; m <= bases.length; m++) {
      const basis = bases[m - 1];
      if (!basis) continue;
      const reduced = lllReduce(basis);
      if (!reduced || reduced.length === 0) continue;
      const shortVecs: number[][] = findShortVectors(reduced, 10000);
      if (!shortVecs || shortVecs.length === 0) continue;
      // m+1次の短ベクトルのみを因数候補とする
      for (const v of shortVecs) {
        const coeffs = v.map(x => Math.round(x));
        // 先頭係数が0や次数がm+1でないものは除外
        const deg = coeffs.findIndex(x => Math.abs(x) > 1e-8);
        const actualDegree = coeffs.length - 1 - deg;
        if (deg < 0) continue;
        if (actualDegree !== m) continue;
        // 先頭係数は±1のみ許可
        const lead = coeffs[deg];
        if (typeof lead !== 'number' || Math.abs(lead) !== 1) continue;
        // 定数多項式は除外
        if (coeffs.length <= 1) continue;
        // 0多項式除外
        if (!coeffs.some(x => Math.abs(x) > 1e-8)) continue;
        // 多項式除算で割り切れるか厳密判定
        const div = tryPolyDivide(coefficients, coeffs.slice(deg));
        if (
          div &&
          div.remainder.every((x: number | undefined) => Math.abs(x ?? 0) < 1e-8) &&
          div.quotient.length > 0
        ) {
          allCandidates.push(coeffs.slice(deg));
        }
      }
    }
    if (allCandidates.length === 0) return null;

    // --- Step 3: 短ベクトル→多項式係数→因数性検証 ---
    const variable = context.variable || 'x';
    const utils = this.polynomialUtils;

    // 再帰的に全ての因数候補の組み合わせを探索
    function recursiveFactor(
      coeffs: number[],
      remainingCandidates: number[][],
      used: boolean[]
    ): ASTNode[] | null {
      // 既に定数または1次以下なら終了
      if (coeffs.length <= 1 || (coeffs.length === 2 && Math.abs(coeffs[0] ?? 0) < 1e-8)) {
        return [utils.coefficientsToAST(coeffs, variable)];
      }
      for (let i = 0; i < remainingCandidates.length; i++) {
        if (used[i]) continue;
        const cand = remainingCandidates[i];
        if (!cand || cand[0] === 0 || cand[cand.length - 1] === 0) continue;
        const div = tryPolyDivide(coeffs, cand);
        if (
          div &&
          div.remainder.every((x: number | undefined) => Math.abs(x ?? 0) < 1e-8) &&
          div.quotient.length > 0
        ) {
          used[i] = true;
          const subfactors = recursiveFactor(div.quotient, remainingCandidates, used);
          used[i] = false;
          if (subfactors) {
            return [utils.coefficientsToAST(cand, variable), ...subfactors];
          }
        }
      }
      // どの因数候補でも割り切れなければ元の多項式を返す
      return null;
    }

    // まず全候補で再帰的に探索
    const used = new Array(allCandidates.length).fill(false);
    const result = recursiveFactor(coefficients, allCandidates, used);
    if (result && result.length > 0) {
      return result;
    }
    // 失敗した場合は元の多項式のみ返す
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
