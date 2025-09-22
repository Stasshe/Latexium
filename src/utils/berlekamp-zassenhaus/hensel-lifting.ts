/**
 * Hensel Lifting Implementation
 * Phase 2 of Berlekamp-Zassenhaus: Lift factors from finite field to higher precision
 */

import { StepTree } from '@/types';

/**
// import { FiniteFieldPolynomial } from './finite-field';
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
    steps: StepTree[]
  ): number[][] {
    if (factorCoeffs.length <= 1) {
      if (steps) steps.push(`[Hensel] 1因子なのでリフト不要`);
      return factorCoeffs;
    }

    try {
      // 多因子対応: すべての因子をリフト
      const currentFactors = factorCoeffs.map(coeffs => [...coeffs]);
      const currentMod = prime;
      if (steps)
        steps.push(`[Hensel] 初期因子: ${JSON.stringify(currentFactors)}, mod ${currentMod}`);

      // 本格的な多因子Henselリフト（mod p^k で全因子同時補正）
      let m = prime;
      while (m < targetPrecision) {
        const nextMod = Math.min(m * prime, targetPrecision);
        const prod = this.multiplyPolyList(currentFactors);
        const h = this.modPoly(this.subtractPolynomials(originalCoeffs, prod), nextMod);
        for (let i = 0; i < currentFactors.length; i++) {
          const Q = this.multiplyPolyList(currentFactors.filter((_, idx) => idx !== i));
          const [d, s, t] = this.extendedEuclidean(currentFactors[i] ?? [], Q, nextMod, steps);
          if (!d || d.length !== 1 || d[0] !== 1) {
            if (steps) (steps ?? []).push(`[Hensel] f_i, Qが互いに素でないためリフト失敗`);
            return factorCoeffs;
          }
          const s_h = this.multiplyPolynomials(s, h);
          const s_h_modQ = this.polyMod(s_h, Q, nextMod);
          const updatedFactor = this.modPoly(
            this.addPolynomials(currentFactors[i] ?? [], s_h_modQ),
            nextMod
          );

          // Check if the updated factor is valid
          if (updatedFactor.some(coeff => isNaN(coeff))) {
            if (steps) steps.push(`[Hensel] Invalid factor encountered during lifting, aborting.`);
            return factorCoeffs;
          }

          currentFactors[i] = updatedFactor;
        }
        m = nextMod;
        if (steps)
          (steps ?? []).push(`[Hensel] mod ${m} でリフト: ${JSON.stringify(currentFactors)}`);
      }
      const normalizedHensel = currentFactors.map(fac =>
        (fac ?? []).map(c => this.normalizeCoeff(c, m))
      );
      if (steps) (steps ?? []).push(`[Hensel] 本格リフト昇格: ${JSON.stringify(normalizedHensel)}`);
      const productHensel = this.multiplyPolyList(normalizedHensel);
      if (!this.arraysEqual(this.trimZeros(productHensel), this.trimZeros(originalCoeffs))) {
        if (steps) (steps ?? []).push(`[Hensel] 本格リフト後の積が元多項式と一致しないため失敗`);
        return factorCoeffs;
      }
      return normalizedHensel;
    } catch (error) {
      if (steps)
        (steps ?? []).push(
          `[Hensel] 例外発生: ${error instanceof Error ? error.message : String(error)}`
        );
      // Fallback: return original factors if lifting fails
      return factorCoeffs;
    }
  }

  // 多項式の各係数をmodで正規化
  private modPoly(a: number[], mod: number): number[] {
    return a.map(x => ((x % mod) + mod) % mod);
  }

  // 多項式配列の積
  private multiplyPolyList(list: (number[] | undefined)[]): number[] {
    return list.reduce(
      (acc: number[], arr: number[] | undefined) => this.multiplyPolynomials(acc, arr ?? []),
      [1]
    );
  }

  // 多項式のユークリッド拡張（a, b, mod）: [gcd, s, t] で a*s + b*t = gcd (mod mod)
  private extendedEuclidean(
    a: number[],
    b: number[],
    mod: number,
    steps: StepTree[]
  ): [number[], number[], number[]] {
    // a, b: 係数配列, mod: 法
    let old_r = a.slice();
    let r = b.slice();
    let old_s = [1],
      s = [0];
    let old_t = [0],
      t = [1];
    while (r.length > 0 && !(r.length === 1 && r[0] === 0)) {
      const [q, rem] = this.polyDivMod(old_r, r, mod);
      const new_r = rem;
      const new_s = this.subtractPolynomials(old_s, this.multiplyPolynomials(q, s)).map(
        x => ((x % mod) + mod) % mod
      );
      const new_t = this.subtractPolynomials(old_t, this.multiplyPolynomials(q, t)).map(
        x => ((x % mod) + mod) % mod
      );
      old_r = r;
      r = new_r;
      old_s = s;
      s = new_s;
      old_t = t;
      t = new_t;
    }
    // 正規化
    try {
      const inv = this.modInv(old_r[0] !== undefined ? old_r[0] : 1, mod, steps);
      const gcd = old_r.map(x => (x * inv) % mod);
      const sNorm = old_s.map(x => (x * inv) % mod);
      const tNorm = old_t.map(x => (x * inv) % mod);
      return [gcd, sNorm, tNorm];
    } catch (error) {
      if (steps && error instanceof Error) {
        steps.push(`[Hensel] modInv failed: ${error.message}`);
      }
      throw new Error(
        `Hensel lifting failed at mod ${mod}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // 多項式の割り算（商と余り、mod付き）
  private polyDivMod(a: number[], b: number[], mod: number): [number[], number[]] {
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
      const coeff = this.modDiv(leadDiv, leadDivisor, mod);
      const deg = dividend.length - divisor.length;
      result[deg] = coeff;
      for (let i = 0; i < divisor.length; i++) {
        dividend[deg + i] = dividend[deg + i] ?? 0;
        dividend[deg + i] = ((dividend[deg + i] ?? 0) - coeff * (divisor[i] ?? 0)) % mod;
        if ((dividend[deg + i] ?? 0) < 0) dividend[deg + i] = (dividend[deg + i] ?? 0) + mod;
      }
      while (dividend.length > 0 && (dividend[dividend.length - 1] ?? 0) === 0) dividend.pop();
    }
    return [result.map(x => ((x % mod) + mod) % mod), dividend.map(x => ((x % mod) + mod) % mod)];
  }

  // 多項式の剰余（a mod b, mod付き）
  private polyMod(a: number[], b: number[], mod: number): number[] {
    const [, rem] = this.polyDivMod(a, b, mod);
    return rem;
  }

  // modでの逆元
  private modInv(a: number, mod: number, steps?: StepTree[]): number {
    // Check if gcd(a, mod) is 1
    const gcd = this.gcd(a, mod);
    if (gcd !== 1) {
      // Log the issue and return a fallback value
      if (steps) steps.push(`Value ${a} is not invertible under mod ${mod} (gcd = ${gcd})`);
      throw new Error(`Value ${a} is not invertible under mod ${mod} (gcd = ${gcd})`);
    }

    let t = 0,
      newt = 1;
    let r = mod,
      newr = a % mod;

    while (newr !== 0) {
      const quotient = Math.floor(r / newr);
      [t, newt] = [newt, t - quotient * newt];
      [r, newr] = [newr, r - quotient * newr];
    }

    if (t < 0) {
      t += mod;
    }

    return t;
  }

  // Helper method to calculate gcd
  private gcd(a: number, b: number): number {
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return Math.abs(a);
  }

  // modでの割り算
  private modDiv(a: number, b: number, mod: number): number {
    return (a * this.modInv(b, mod)) % mod;
  }

  // mod n で最も自然な整数係数に正規化
  private normalizeCoeff(c: number, mod: number): number {
    let v = c % mod;
    if (v > mod / 2) v -= mod;
    if (v < -mod / 2) v += mod;
    return v;
  }

  // 多項式の減算
  private subtractPolynomials(a: number[], b: number[]): number[] {
    const maxLength = Math.max(a.length, b.length);
    const result: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const aCoeff = i < a.length ? (a[i] ?? 0) : 0;
      const bCoeff = i < b.length ? (b[i] ?? 0) : 0;
      result.push(aCoeff - bCoeff);
    }
    return result;
  }

  // 多項式の加算
  private addPolynomials(a: number[], b: number[]): number[] {
    const maxLength = Math.max(a.length, b.length);
    const result: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const aCoeff = i < a.length ? (a[i] ?? 0) : 0;
      const bCoeff = i < b.length ? (b[i] ?? 0) : 0;
      result.push(aCoeff + bCoeff);
    }
    return result;
  }

  // 多項式の乗算
  private multiplyPolynomials(a: number[], b: number[]): number[] {
    if (a.length === 0 || b.length === 0) return [0];
    const result = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        result[i + j] += (a[i] ?? 0) * (b[j] ?? 0);
      }
    }
    return result;
  }

  // 配列が等しいか
  private arraysEqual(a: number[], b: number[]): boolean {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      if ((a[i] ?? 0) !== (b[i] ?? 0)) return false;
    }
    return true;
  }

  // 末尾の0を除去
  private trimZeros(arr: number[]): number[] {
    const res = arr.slice();
    while (res.length > 1 && (res[res.length - 1] ?? 0) === 0) res.pop();
    return res;
  }
}
