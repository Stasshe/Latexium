/**
 * Hensel Lifting Implementation
 * Phase 2 of Berlekamp-Zassenhaus: Lift factors from finite field to higher precision
 */

import { FiniteFieldPolynomial } from './finite-field';

/**
 * Hensel lifting for polynomial factorization
 */
export class HenselLifting {
  /**
   * Lift factors from mod p to mod p^k using Hensel's lemma
   *
   * @param originalCoeffs - Original polynomial coefficients
   * @param factorCoeffs - Factor coefficients in finite field
   * @param prime - Prime used in finite field
   * @param targetPrecision - Target precision (p^k)
   * @returns Array of lifted factor coefficients
   */
  liftFactors(
    originalCoeffs: number[],
    factorCoeffs: number[][],
    prime: number,
    targetPrecision: number,
    steps?: string[]
  ): number[][] {
    if (factorCoeffs.length <= 1) {
      if (steps) steps.push(`[Hensel] 1因子なのでリフト不要`);
      return factorCoeffs;
    }

    try {
      // 多因子対応: すべての因子をリフト
      const currentFactors = factorCoeffs.map(coeffs => [...coeffs]);
      let currentMod = prime;
      if (steps)
        steps.push(`[Hensel] 初期因子: ${JSON.stringify(currentFactors)}, mod ${currentMod}`);

      // 多段階リフト
      while (currentMod < targetPrecision) {
        const nextMod = Math.min(currentMod * prime, targetPrecision);
        // 多因子リフト: 各ペアで順次リフト
        for (let i = 0; i < currentFactors.length - 1; i++) {
          const f1 = currentFactors[i] ?? [];
          const f2 = currentFactors[i + 1] ?? [];
          const productOthers = currentFactors
            .filter((_, idx) => idx !== i && idx !== i + 1)
            .reduce((acc, arr) => this.multiplyPolynomials(acc, arr), [1]);
          // 元多項式を他因子で割ったものをリフト対象に
          const target = this.dividePolynomials(originalCoeffs, productOthers);
          const liftedPair = this.liftStep(target, [f1, f2], currentMod, nextMod, prime);
          currentFactors[i] = liftedPair[0] ?? f1;
          currentFactors[i + 1] = liftedPair[1] ?? f2;
        }
        currentMod = nextMod;
        if (steps)
          steps.push(`[Hensel] mod ${currentMod} でリフト: ${JSON.stringify(currentFactors)}`);
      }

      // mod p^k から整数係数へ昇格
      // 係数が負の場合も考慮し、最も自然な整数係数に正規化
      const normalized = currentFactors.map(fac =>
        fac.map(c => this.normalizeCoeff(c, currentMod))
      );
      if (steps) steps.push(`[Hensel] 整数係数へ昇格: ${JSON.stringify(normalized)}`);

      // 全因子の積が元多項式になるかチェックし、ならない場合は元の因子を返す
      const product = normalized.reduce((acc, arr) => this.multiplyPolynomials(acc, arr), [1]);
      if (!this.arraysEqual(this.trimZeros(product), this.trimZeros(originalCoeffs))) {
        if (steps) steps.push(`[Hensel] 昇格後の積が元多項式と一致しないためリフト失敗`);
        return factorCoeffs;
      }
      return normalized;
    } catch (error) {
      if (steps)
        steps.push(`[Hensel] 例外発生: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: return original factors if lifting fails
      return factorCoeffs;
    }
  }

  // mod n で最も自然な整数係数に正規化
  private normalizeCoeff(c: number, mod: number): number {
    let v = c % mod;
    if (v > mod / 2) v -= mod;
    if (v < -mod / 2) v += mod;
    return v;
  }

  // 配列が等しいか
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // 末尾の0を除去
  private trimZeros(arr: number[]): number[] {
    const res = arr.slice();
    while (res.length > 1 && (res[res.length - 1] ?? 0) === 0) res.pop();
    return res;
  }

  // 多項式の割り算（余り無視、割り切れない場合はそのまま返す）
  private dividePolynomials(a: number[], b: number[]): number[] {
    const dividend = a.slice();
    const divisor = b.slice();
    const result: number[] = [];
    while (
      dividend.length >= divisor.length &&
      divisor.length > 0 &&
      (divisor[divisor.length - 1] ?? 0) !== 0
    ) {
      const leadDiv = dividend[dividend.length - 1] ?? 0;
      const leadDivisor = divisor[divisor.length - 1] ?? 1;
      const coeff = leadDiv / leadDivisor;
      const deg = dividend.length - divisor.length;
      result[deg] = coeff;
      for (let i = 0; i < divisor.length; i++) {
        dividend[deg + i] = (dividend[deg + i] ?? 0) - coeff * (divisor[i] ?? 0);
      }
      while (dividend.length > 0 && Math.abs(dividend[dividend.length - 1] ?? 0) < 1e-10)
        dividend.pop();
    }
    return result.length ? result : a;
  }

  /**
   * Single lifting step: mod p^k → mod p^(k+1)
   */
  private liftStep(
    originalCoeffs: number[],
    factors: number[][],
    currentMod: number,
    nextMod: number,
    prime: number
  ): number[][] {
    if (factors.length !== 2) {
      // For simplicity, only handle binary factorizations
      // In a full implementation, this would use multivariate lifting
      return factors;
    }

    const [f1Raw, f2Raw] = factors;
    const f1 = f1Raw ?? [];
    const f2 = f2Raw ?? [];

    // Compute current product mod nextMod
    const currentProduct = this.multiplyPolynomials(f1, f2);

    // Compute error: original - currentProduct
    const error = this.subtractPolynomials(originalCoeffs, currentProduct);

    // Check if error is divisible by currentMod
    const errorQuotient: number[] = [];
    let hasError = false;

    for (let i = 0; i < error.length; i++) {
      const errVal = error[i] ?? 0;
      if (errVal % currentMod !== 0) {
        hasError = true;
        break;
      }
      errorQuotient.push(errVal / currentMod);
    }

    if (!hasError) {
      // No lifting needed
      return factors;
    }

    // Use extended Euclidean algorithm to find correction
    const corrections = this.computeCorrections(f1, f2, errorQuotient, prime);

    if (!corrections) {
      return factors;
    }

    const [delta1Raw, delta2Raw] = corrections;
    const delta1 = delta1Raw ?? [];
    const delta2 = delta2Raw ?? [];

    // Apply corrections
    const newF1 = this.addPolynomials(
      f1,
      delta1.map(c => (c ?? 0) * currentMod)
    );
    const newF2 = this.addPolynomials(
      f2,
      delta2.map(c => (c ?? 0) * currentMod)
    );

    return [newF1, newF2];
  }

  /**
   * Compute corrections using extended Euclidean algorithm
   */
  private computeCorrections(
    f1: number[],
    f2: number[],
    errorQuotient: number[],
    prime: number
  ): [number[], number[]] | null {
    try {
      // Create finite field polynomials
      const poly1 = new FiniteFieldPolynomial(f1, prime);
      const poly2 = new FiniteFieldPolynomial(f2, prime);
      const error = new FiniteFieldPolynomial(errorQuotient, prime);

      // Extended GCD to find u, v such that u*f1 + v*f2 = gcd(f1, f2)
      const [gcd, u, v] = this.extendedGcdPolynomial(poly1, poly2, prime);

      if (gcd.degree > 0) {
        // Factors are not coprime, cannot lift
        return null;
      }

      // Compute corrections: delta1 = (u * error) mod f2, delta2 = (v * error) mod f1
      const delta1Poly = u.multiply(error);
      const delta2Poly = v.multiply(error);

      const [, delta1Mod] = delta1Poly.divmod(poly2);
      const [, delta2Mod] = delta2Poly.divmod(poly1);

      return [delta1Mod.coefficients, delta2Mod.coefficients];
    } catch (error) {
      return null;
    }
  }

  /**
   * Extended GCD for polynomials in finite field
   */
  private extendedGcdPolynomial(
    a: FiniteFieldPolynomial,
    b: FiniteFieldPolynomial,
    prime: number
  ): [FiniteFieldPolynomial, FiniteFieldPolynomial, FiniteFieldPolynomial] {
    if (b.isZero) {
      return [a, new FiniteFieldPolynomial([1], prime), new FiniteFieldPolynomial([0], prime)];
    }

    const [quotient, remainder] = a.divmod(b);
    const [gcd, x1, y1] = this.extendedGcdPolynomial(b, remainder, prime);

    const x = y1;
    const y = x1.subtract(quotient.multiply(y1));

    return [gcd, x, y];
  }

  /**
   * Multiply two polynomials (coefficient arrays)
   */
  private multiplyPolynomials(a: number[], b: number[]): number[] {
    if (a.length === 0 || b.length === 0) return [0];

    const result = new Array(a.length + b.length - 1).fill(0);

    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const aVal = a[i] ?? 0;
        const bVal = b[j] ?? 0;
        result[i + j] += aVal * bVal;
      }
    }

    return result;
  }

  /**
   * Add two polynomials (coefficient arrays)
   */
  private addPolynomials(a: number[], b: number[]): number[] {
    const maxLength = Math.max(a.length, b.length);
    const result: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const aCoeff = i < a.length && a[i] !== undefined ? a[i]! : 0;
      const bCoeff = i < b.length && b[i] !== undefined ? b[i]! : 0;
      result.push(aCoeff + bCoeff);
    }

    return result;
  }

  /**
   * Subtract two polynomials (coefficient arrays)
   */
  private subtractPolynomials(a: number[], b: number[]): number[] {
    const maxLength = Math.max(a.length, b.length);
    const result: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const aCoeff = i < a.length && a[i] !== undefined ? a[i]! : 0;
      const bCoeff = i < b.length && b[i] !== undefined ? b[i]! : 0;
      result.push(aCoeff - bCoeff);
    }

    return result;
  }
}
