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
      // モニック化: 各因子の最高次係数を1に正規化（mod prime）
      const monicFactors = factorCoeffs.map(coeffs => {
        if (!coeffs || coeffs.length === 0) return [];
        const lastIdx = coeffs.length - 1;
        const lead = typeof coeffs[lastIdx] === 'number' ? coeffs[lastIdx] % prime : 0;
        // 最高次係数の逆元をかける
        const inv = this.modInv(lead, prime, steps);
        return coeffs.map(c => (((c * inv) % prime) + prime) % prime);
      });
      const currentFactors = monicFactors.map(coeffs => [...coeffs]);
      const currentMod = prime;
      if (steps)
        steps.push(
          `[Hensel] 初期因子(モニック化): ${JSON.stringify(currentFactors)}, mod ${currentMod}`
        );

      // 本格的な多因子Henselリフト（mod p^k で全因子同時補正）
      let m = prime;
      while (m < targetPrecision) {
        const nextMod = Math.min(m * prime, targetPrecision);
        const prod = this.multiplyPolyList(currentFactors);
        const h = this.modPoly(this.subtractPolynomials(originalCoeffs, prod), nextMod);
        // 追加: 各因子の最高次係数とgcdをログ出力
        if (steps) {
          const leadCoeffs = currentFactors.map(fac =>
            Array.isArray(fac) && fac.length > 0 ? Number(fac[fac.length - 1]) : 0
          );
          // undefinedや非数を除外
          const safeCoeffs = leadCoeffs.filter(x => typeof x === 'number' && Number.isFinite(x));
          let gcdAll = 0;
          if (safeCoeffs.length > 0) {
            gcdAll = safeCoeffs.reduce((acc, v) => this.gcd(acc, v));
          }
          steps.push(
            `[Hensel-DEBUG] mod ${m} 各因子の最高次係数: ${JSON.stringify(leadCoeffs)}, gcd: ${gcdAll}`
          );
        }
        // --- 多因子同時補正 ---
        // 1. 各因子以外の積Q_iを計算
        const Qs = currentFactors.map((_, i) =>
          this.multiplyPolyList(currentFactors.filter((_, idx) => idx !== i))
        );
        // 2. 各因子ごとに extendedEuclidean で補正多項式s_iを計算
        const Ss = [];
        for (let i = 0; i < currentFactors.length; i++) {
          const cf = currentFactors[i] as number[];
          const qf = Qs[i] as number[];
          const [d, s, t] = this.extendedEuclidean(cf, qf, nextMod, steps);
          if (!d || d.length !== 1 || d[0] !== 1) {
            if (steps) (steps ?? []).push(`[Hensel] f_i, Qが互いに素でないためリフト失敗`);
            return factorCoeffs;
          }
          Ss.push(s);
        }
        // 3. 各因子の補正量 delta_i = s_i * h mod Q_i, Q_i = prod(他因子)
        const deltas = Ss.map((s, i) =>
          this.polyMod(this.multiplyPolynomials(s, h), Array.isArray(Qs[i]) ? Qs[i] : [], nextMod)
        );
        // 4. 全因子を同時に補正
        for (let i = 0; i < currentFactors.length; i++) {
          const cf2 = currentFactors[i] as number[];
          const delta = deltas[i] as number[];
          let updatedFactor = this.modPoly(this.addPolynomials(cf2, delta), nextMod);
          // --- ここでモニック化 ---
          if (updatedFactor.length > 0) {
            const lead = updatedFactor[updatedFactor.length - 1];
            const safeLead = typeof lead === 'number' && Number.isFinite(lead) ? lead : 1;
            const inv = this.modInv(safeLead, nextMod, steps);
            updatedFactor = updatedFactor.map(c => (((c * inv) % nextMod) + nextMod) % nextMod);
          }
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
      // --- ここから因子組み合わせ探索 ---
      // normalizedHenselの全部分割（2つ以上のグループ）を列挙し、各グループの積が元多項式になるものを返す
      // 全ての部分集合分割（空集合・全体集合以外）を列挙
      function* allSetPartitions<T>(arr: T[]): Generator<T[][]> {
        const n = arr.length;
        if (n < 2) return;
        // 再帰的に全分割を生成
        function* helper(idx: number, groups: T[][]): Generator<T[][]> {
          if (idx === n) {
            if (groups.length > 1) yield groups.map(g => [...g]);
            return;
          }
          for (let i = 0; i < groups.length; ++i) {
            const group = groups[i];
            if (!group) continue;
            group.push(arr[idx]!);
            yield* helper(idx + 1, groups);
            group.pop();
          }
          groups.push([arr[idx]!]);
          yield* helper(idx + 1, groups);
          groups.pop();
        }
        yield* helper(0, []);
      }

      // 係数配列の積が一致するか
      const isEqual = (a: number[], b: number[]): boolean =>
        this.arraysEqual(this.trimZeros(a), this.trimZeros(b));

      // --- 各因子を最大公約数で割って正規化し、全ての定数倍・順列の組み合わせで積が元多項式と一致するものを探索 ---
      // --- ユーティリティ関数を外に出してthis参照を排除 ---
      const gcdArray = (arr: number[]): number => {
        let g = 0;
        for (const v of arr) g = this.gcd(g, v);
        return Math.abs(g);
      };
      const normalizeFactors = (factors: number[][]): number[][] => {
        return factors.map(fac => {
          const g = gcdArray(fac);
          if (g > 1) return fac.map(c => c / g);
          if (g < 0) return fac.map(c => -c / Math.abs(g));
          return fac;
        });
      };
      const maxAbsLead = 8;
      const constChoices: number[][] = normalizedHensel.map(fac => {
        const lead = fac[fac.length - 1] ?? 1;
        const absLead = Math.abs(lead);
        const choices: number[] = [];
        for (let c = 1; c <= Math.max(absLead, maxAbsLead); ++c) {
          choices.push(c);
          choices.push(-c);
        }
        return choices;
      });
      const cartesian = (arr: number[][]): number[][] => {
        return arr.reduce<number[][]>(
          (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
          [[]]
        );
      };
      const permute = <T>(arr: T[]): T[][] => {
        if (arr.length <= 1) return [arr];
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i++) {
          const rest = arr.slice(0, i).concat(arr.slice(i + 1));
          for (const p of permute(rest)) {
            result.push([arr[i] as T, ...p]);
          }
        }
        return result;
      };
      const allConstCombos = cartesian(constChoices);
      for (const constSet of allConstCombos) {
        const scaled = normalizedHensel.map((fac, i) => fac.map(c => c * constSet[i]!));
        const normed = normalizeFactors(scaled);
        for (const perm of permute(normed)) {
          for (const partition of allSetPartitions(perm)) {
            const prods = partition.map(g => this.multiplyPolyList(g as number[][]));
            if (
              prods.every(p => p.length > 1) &&
              isEqual(this.multiplyPolyList(prods), this.trimZeros(originalCoeffs))
            ) {
              return prods;
            }
          }
        }
      }
      // 組み合わせが見つからなければ従来通り返す
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

  // 与えられた因子配列の定数倍（1〜p-1）と順列の全組み合わせを生成
  private allFactorCombinations(factorCoeffs: number[][], prime: number): number[][][] {
    const constMults = factorCoeffs.map(fac => {
      const arr: number[][] = [];
      for (let c = 1; c < prime; ++c) {
        arr.push(fac.map(x => (((x * c) % prime) + prime) % prime));
      }
      return arr;
    });
    function permute<T>(arr: T[]): T[][] {
      if (arr.length <= 1) return [arr];
      const result: T[][] = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === undefined) continue;
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const p of permute(rest)) {
          result.push([arr[i] as T, ...p]);
        }
      }
      return result;
    }
    function cartesian<T>(arr: T[][]): T[][] {
      return arr.reduce<T[][]>((acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])), [[]]);
    }
    const allConstMults = cartesian(constMults);
    const allCombos: number[][][] = [];
    for (const constSet of allConstMults) {
      for (const perm of permute(constSet)) {
        allCombos.push(perm);
      }
    }
    return allCombos;
  }
}
