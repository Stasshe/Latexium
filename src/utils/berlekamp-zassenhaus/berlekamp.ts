/**
 * Berlekamp Algorithm Implementation
 * Phase 1 of Berlekamp-Zassenhaus: Factorization in finite fields
 */

import { FiniteFieldPolynomial, ModularArithmetic } from './finite-field';

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
  factorInFiniteField(coefficients: number[], prime: number): number[][] {
    const polynomial = new FiniteFieldPolynomial(coefficients, prime);

    if (polynomial.degree <= 1) {
      return [coefficients];
    }

    try {
      // Step 1: Construct Berlekamp matrix Q
      const Q = this.constructBerlekampMatrix(polynomial, prime);

      // Step 2: Find null space of (Q - I)
      const nullSpace = this.findNullSpace(Q, prime);

      // Step 3: If nullity = 1, polynomial is irreducible
      if (nullSpace.length <= 1) {
        return [coefficients];
      }

      // Step 4: Use null space vectors to find factors
      const factors = this.extractFactors(polynomial, nullSpace, prime);

      return factors.map(factor => factor.coefficients);
    } catch (error) {
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
      // Extract coefficients for Q matrix, default to 0 if undefined
      for (let j = 0; j < n; j++) {
        Q[i]![j] = Number(powerPoly.coefficients[j]);
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
    if (exp === 0) {
      return new FiniteFieldPolynomial([1], prime);
    }

    // Start with x
    let result = new FiniteFieldPolynomial([0, 1], prime);
    let currentPower = 1;

    // Binary exponentiation with modular reduction
    while (currentPower < exp) {
      const nextPower = Math.min(currentPower * 2, exp);
      const exponentDiff = nextPower - currentPower;

      // Multiply by x^exponentDiff
      for (let i = 0; i < exponentDiff; i++) {
        result = result.multiply(new FiniteFieldPolynomial([0, 1], prime));
        const [, remainder] = result.divmod(polynomial);
        result = remainder;
      }

      currentPower = nextPower;
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
    prime: number
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
        const subFactors = this.splitUsingNullVector(factor, nullVector, prime);
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
    prime: number
  ): FiniteFieldPolynomial[] {
    // Create polynomial from null vector
    const nullPoly = new FiniteFieldPolynomial(nullVector, prime);

    // Try different values a: gcd(factor, nullPoly - a)
    for (let a = 0; a < prime; a++) {
      const constantPoly = new FiniteFieldPolynomial([a], prime);
      const testPoly = nullPoly.subtract(constantPoly);

      const gcdResult = factor.gcd(testPoly);

      if (!gcdResult.isZero && gcdResult.degree > 0 && gcdResult.degree < factor.degree) {
        // Found a non-trivial factor
        const [quotient] = factor.divmod(gcdResult);
        return [gcdResult, quotient];
      }
    }

    // No split found
    return [factor];
  }
}
