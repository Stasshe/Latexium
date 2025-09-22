/**
 * Berlekamp Algorithm Implementation
 * Phase 1 of Berlekamp-Zassenhaus: Factorization in finite fields
 */

import { FiniteFieldPolynomial, ModularArithmetic } from './finite-field';

import { StepTree } from '@/types';

/**
 * Berlekamp algorithm for polynomial factorization in finite fields
 */
export class BerlekampAlgorithm {
  /**
   * Factor a square-free polynomial in a finite field
   *
   * @param coefficients - Polynomial coefficients (constant term first)
   * @param prime - Prime for finite field
   * @returns Array of irreducible factor polynomials
   */
  factorInFiniteField(coefficients: number[], prime: number, steps?: StepTree[]): number[][] {
    const polynomial = new FiniteFieldPolynomial(coefficients, prime);

    if (polynomial.degree <= 1) {
      return [coefficients];
    }

    try {
      // Step 1: Construct Berlekamp matrix Q
      const Q = this.constructBerlekampMatrix(polynomial, prime);
      if (steps) steps.push(`[BZ:FF] Berlekamp行列Q: ${JSON.stringify(Q)}`);

      // Step 2: Find null space of (Q - I)
      const nullSpace = this.findNullSpace(Q, prime);
      // if (steps) steps.push(`[BZ:FF] Null空間ベクトル: ${JSON.stringify(nullSpace)}`);

      // Step 3: If nullity = 1, polynomial is irreducible
      if (nullSpace.length <= 1) {
        if (steps) steps.push(`[BZ:FF] Null空間次元1→既約`);
        return [coefficients];
      }

      // Step 4: Use null space vectors to find factors
      // 定数多項式でないベクトルのみ使う
      const nonConstNulls = nullSpace.filter(v => v.some((c, i) => i > 0 && c !== 0));
      // if (steps) steps.push(`[BZ:FF] 定数多項式でないNull空間ベクトル: ${JSON.stringify(nonConstNulls)}`);
      const factors = this.extractFactors(polynomial, nonConstNulls, prime, steps);
      if (steps)
        steps.push(
          `[BZ:FF] 有限体因数分解結果: ${JSON.stringify(factors.map(f => f.coefficients))}`
        );
      return factors.map(factor => factor.coefficients);
    } catch (error) {
      if (steps)
        steps.push(`[BZ:FF] 例外発生: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: return original polynomial if algorithm fails
      return [coefficients];
    }
  }

  /**
   * Construct the Berlekamp matrix Q
   * Q[i,j] = coefficient of x^j in x^(p*i) mod f(x)
   */
  private constructBerlekampMatrix(polynomial: FiniteFieldPolynomial, prime: number): number[][] {
    const n = polynomial.degree;
    // Use Array.from to avoid shared references between rows
    const Q: Array<number[]> = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      // Compute x^(p*i) mod f(x)
      const powerPoly = this.computeXPowerMod(prime * i, polynomial, prime);
      // Extract coefficients for Q matrix, default to 0 if undefined/null/NaN
      for (let j = 0; j < n; j++) {
        let val = 0;
        if (powerPoly.coefficients && Array.isArray(powerPoly.coefficients)) {
          const v = powerPoly.coefficients[j];
          val = typeof v === 'number' && Number.isFinite(v) ? v : 0;
        }
        if (!Q[i]) Q[i] = Array(n).fill(0);
        Q[i]![j] = val;
      }
    }
    return Q;
  }

  /**
   * Compute x^exp mod polynomial in finite field
   */
  private computeXPowerMod(
    exp: number,
    polynomial: FiniteFieldPolynomial,
    prime: number
  ): FiniteFieldPolynomial {
    // Computes x^exp mod polynomial over F_p
    let result = new FiniteFieldPolynomial([1], prime); // x^0 = 1
    let base = new FiniteFieldPolynomial([0, 1], prime); // x
    let e = exp;
    while (e > 0) {
      if (e % 2 === 1) {
        result = result.multiply(base);
        const [, remainder] = result.divmod(polynomial);
        result = remainder;
      }
      e = Math.floor(e / 2);
      if (e > 0) {
        base = base.multiply(base);
        const [, remainder] = base.divmod(polynomial);
        base = remainder;
      }
    }
    return result;
  }

  /**
   * Find null space of (Q - I) matrix over finite field
   */
  private findNullSpace(Q: number[][], prime: number): number[][] {
    const n = Q.length;
    // Use Array.from to avoid shared references between rows
    const QMinusI: Array<number[]> = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const qVal = Q[i]![j];
        QMinusI[i]![j] = Number(qVal);
        if (i === j) {
          QMinusI[i]![j] = ModularArithmetic.subtract(Number(QMinusI[i]![j]), 1, prime);
        }
      }
    }

    // Gaussian elimination to find null space
    return this.gaussianEliminationNullSpace(QMinusI, prime);
  }

  /**
   * Gaussian elimination to find null space over finite field
   */
  private gaussianEliminationNullSpace(matrix: number[][], prime: number): number[][] {
    const m = matrix.length;
    const n = matrix[0]?.length ?? 0;
    const augmented: Array<number[]> = matrix.map(row => [...row]);

    // Forward elimination
    let rank = 0;
    const pivotCols: number[] = [];

    for (let col = 0; col < n && rank < m; col++) {
      // Find pivot
      let pivotRow = -1;
      for (let row = rank; row < m; row++) {
        if ((augmented[row]?.[col] ?? 0) !== 0) {
          pivotRow = row;
          break;
        }
      }

      if (pivotRow === -1) continue;

      // Swap rows if needed
      if (pivotRow !== rank) {
        const temp = augmented[rank];
        augmented[rank] = augmented[pivotRow] ?? [];
        augmented[pivotRow] = temp ?? [];
      }

      pivotCols.push(col);
      const pivotElement = augmented[rank]?.[col] ?? 0;
      const pivotInverse = ModularArithmetic.inverse(pivotElement, prime);

      if (pivotInverse === null) continue;

      // Normalize pivot row
      for (let j = 0; j < n; j++) {
        augmented[rank]![j] = ModularArithmetic.multiply(
          Number(augmented[rank]![j]),
          pivotInverse,
          prime
        );
      }

      // Eliminate column
      for (let i = 0; i < m; i++) {
        if (i !== rank && (augmented[i]?.[col] ?? 0) !== 0) {
          const factor = augmented[i]?.[col] ?? 0;
          for (let j = 0; j < n; j++) {
            const subtract = ModularArithmetic.multiply(factor, augmented[rank]?.[j] ?? 0, prime);
            augmented[i]![j] = ModularArithmetic.subtract(
              Number(augmented[i]![j]),
              subtract,
              prime
            );
          }
        }
      }

      rank++;
    }

    // Construct null space basis
    const nullSpace: number[][] = [];
    const freeCols: number[] = [];

    for (let col = 0; col < n; col++) {
      if (!pivotCols.includes(col)) {
        freeCols.push(col);
      }
    }

    // For each free variable, create a basis vector
    for (const freeCol of freeCols) {
      const vector = new Array(n).fill(0);
      vector[freeCol] = 1;

      // Express other variables in terms of free variable
      for (let i = rank - 1; i >= 0; i--) {
        const pivotCol = pivotCols[i];
        if (pivotCol !== undefined && pivotCol < n) {
          vector[pivotCol] = ModularArithmetic.subtract(0, augmented[i]?.[freeCol] ?? 0, prime);
        }
      }

      nullSpace.push(vector);
    }

    return nullSpace;
  }

  /**
   * Extract factors using null space vectors
   */
  private extractFactors(
    polynomial: FiniteFieldPolynomial,
    nullSpace: number[][],
    prime: number,
    steps?: import('../../types/ast').StepTree[]
  ): FiniteFieldPolynomial[] {
    const factors: FiniteFieldPolynomial[] = [polynomial.clone()];

    for (const nullVector of nullSpace) {
      const newFactors: FiniteFieldPolynomial[] = [];
      for (const factor of factors) {
        if (factor.degree <= 1) {
          newFactors.push(factor);
          continue;
        }
        // Try to split the factor using this null vector
        const subFactors = this.splitUsingNullVector(factor, nullVector, prime, steps);
        if (steps)
          steps.push(
            `[BZ:FF] nullVector=${JSON.stringify(nullVector)}で分割: ${subFactors.map(f => JSON.stringify(f.coefficients)).join(' | ')}`
          );
        newFactors.push(...subFactors);
      }
      factors.length = 0;
      factors.push(...newFactors);
    }
    return factors;
  }

  /**
   * Split a polynomial using a null space vector
   */
  private splitUsingNullVector(
    factor: FiniteFieldPolynomial,
    nullVector: number[],
    prime: number,
    steps?: import('../../types/ast').StepTree[]
  ): FiniteFieldPolynomial[] {
    // Create polynomial from null vector
    const nullPoly = new FiniteFieldPolynomial(nullVector, prime);
    for (let a = 0; a < prime; a++) {
      const constantPoly = new FiniteFieldPolynomial([a], prime);
      const testPoly = nullPoly.subtract(constantPoly);
      const gcdResult = factor.gcd(testPoly);
      if (steps) steps.push(`[BZ:FF] split: a=${a}, gcd=${JSON.stringify(gcdResult.coefficients)}`);
      if (!gcdResult.isZero && gcdResult.degree > 0 && gcdResult.degree < factor.degree) {
        // Found a non-trivial factor
        const [quotient] = factor.divmod(gcdResult);
        if (steps)
          steps.push(
            `[BZ:FF] 分割成功: gcd=${JSON.stringify(gcdResult.coefficients)}, quotient=${JSON.stringify(quotient.coefficients)}`
          );
        return [gcdResult, quotient];
      }
    }
    // No split found
    if (steps) steps.push(`[BZ:FF] 分割失敗: ${JSON.stringify(factor.coefficients)}`);
    return [factor];
  }
}
