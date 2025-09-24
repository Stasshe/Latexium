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

    // 逆元が求められない場合は別の素数で再試行
    const triedPrimes: number[] = [];
    let currentPrime = prime;
    let lastError: any = null;
    const primeCandidates = [2, 3, 5, 7, 11, 13]; //17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    // primeCandidatesからprimeを優先
    if (!primeCandidates.includes(prime)) primeCandidates.unshift(prime);

    for (const p of primeCandidates) {
      if (triedPrimes.includes(p)) continue;
      triedPrimes.push(p);
      currentPrime = p;
      try {
        // 多因子対応: すべての因子をリフト
        // モニック化: 各因子の最高次係数を1に正規化（mod currentPrime）
        const monicFactors = factorCoeffs.map(coeffs => {
          if (!coeffs || coeffs.length === 0) return [];
          const lastIdx = coeffs.length - 1;
          const lead = typeof coeffs[lastIdx] === 'number' ? coeffs[lastIdx] % currentPrime : 0;
          // 最高次係数の逆元をかける
          const inv = this.modInv(lead, currentPrime, steps);
          return coeffs.map(c => (((c * inv) % currentPrime) + currentPrime) % currentPrime);
        });
        const currentFactors = monicFactors.map(coeffs => [...coeffs]);
        const currentMod = currentPrime;
        if (steps)
          steps.push(
            `[Hensel] 初期因子(モニック化): ${JSON.stringify(currentFactors)}, mod ${currentMod}`
          );

        // 本格的な多因子Henselリフト（mod p^k で全因子同時補正）
        let m = currentPrime;
        while (m < targetPrecision) {
          const nextMod = Math.min(m * currentPrime, targetPrecision);
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
              throw new Error('Not coprime');
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
              if (steps)
                steps.push(`[Hensel] Invalid factor encountered during lifting, aborting.`);
              throw new Error('Invalid factor');
            }
            currentFactors[i] = updatedFactor;
          }
          m = nextMod;
          if (steps)
            (steps ?? []).push(`[Hensel] mod ${m} でリフト: ${JSON.stringify(currentFactors)}`);
        }
        // mod m の範囲 [0, m-1] で正規化
        const normalizedHensel = currentFactors.map(fac => (fac ?? []).map(c => ((c % m) + m) % m));
        if (steps)
          (steps ?? []).push(`[Hensel] 本格リフト昇格: ${JSON.stringify(normalizedHensel)}`);
        // mod m で積を比較（両方trimZerosしてからmod）
        const modArr = (arr: number[], mod: number): number[] =>
          arr.map(x => ((x % mod) + mod) % mod);
        const trimZeros = (arr: number[]): number[] => {
          const res = arr.slice();
          while (res.length > 1 && (res[res.length - 1] ?? 0) === 0) res.pop();
          return res;
        };
        const productHensel = trimZeros(this.multiplyPolyList(normalizedHensel));
        const originalTrim = trimZeros(originalCoeffs);
        const productHenselMod = modArr(productHensel, m);
        const originalMod = modArr(originalTrim, m);
        if (!this.arraysEqual(productHenselMod, originalMod)) {
          if (steps) (steps ?? []).push(`[Hensel] 本格リフト後の積が元多項式と一致しないため失敗`);
          throw new Error('Product mismatch');
        }
        // --- ここから因子組み合わせ探索 ---
        function* allSetPartitions<T>(arr: T[]): Generator<T[][]> {
          const n = arr.length;
          if (n < 2) return;
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

        // 係数配列の積が一致するか（両方trimZerosしてからmod m）
        const isEqual = (a: number[], b: number[]): boolean => {
          const aT = trimZeros(a);
          const bT = trimZeros(b);
          return this.arraysEqual(modArr(aT, m), modArr(bT, m));
        };

        // 定数項の約数（正負両方）を全て試す
        // まず元多項式の定数項を取得
        const constantTerm = originalCoeffs[0] ?? 0;
        // 約数列挙関数
        function divisors(n: number): number[] {
          n = Math.abs(n);
          if (n === 0) return [1, -1];
          const divs = new Set<number>();
          for (let i = 1; i <= Math.sqrt(n); i++) {
            if (n % i === 0) {
              divs.add(i);
              divs.add(n / i);
            }
          }
          return Array.from(divs).flatMap(d => [d, -d]);
        }
        // 各因子の定数倍候補: 全因子で全約数を許可
        const allDivs = divisors(constantTerm);
        const constChoices: number[][] = normalizedHensel.map(_ => allDivs);
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
        const foundModMatch: number[][][] = [];
        for (const constSet of allConstCombos) {
          const scaled = normalizedHensel.map((fac, i) =>
            fac.map(c => (((c * constSet[i]!) % m) + m) % m)
          );
          for (const perm of permute(scaled)) {
            for (const partition of allSetPartitions(perm)) {
              const prods = partition.map(g => this.multiplyPolyList(g as number[][]));
              if (
                prods.every(p => p.length > 1) &&
                isEqual(this.multiplyPolyList(prods), originalMod)
              ) {
                // mod m で一致した因子セットを記録
                foundModMatch.push(
                  (partition as any[]).map(g =>
                    Array.isArray(g) ? [...g] : []
                  ) as unknown as number[][]
                );
              }
            }
          }
        }
        // mod m で一致した因子セットがあれば、整数係数に戻して積が元多項式と一致するかも確認
        // 全因子の定数倍直積×全順列の全探索
        for (const match of foundModMatch) {
          // 各因子の係数をmod mから最も自然な整数（-m/2〜m/2）に戻す
          const toInt = (arr: number[]): number[] =>
            arr.map(c => {
              let v = c % m;
              if (v > m / 2) v -= m;
              if (v < -m / 2) v += m;
              return v;
            });
          // 全因子の定数倍直積
          const allConstCombosInt = cartesian(constChoices);
          for (const constSet of allConstCombosInt) {
            const scaled = match.map((fac, i) => fac.map(c => (((c * constSet[i]!) % m) + m) % m));
            for (const perm of permute(scaled)) {
              const intFactors = perm.map(fac => toInt(fac));
              const intProd = this.multiplyPolyList(intFactors);
              // 末尾0除去
              const trimZeros = (arr: number[]): number[] => {
                const res = arr.slice();
                while (res.length > 1 && (res[res.length - 1] ?? 0) === 0) res.pop();
                return res;
              };
              if (this.arraysEqual(trimZeros(intProd), trimZeros(originalCoeffs))) {
                if (steps)
                  steps.push(`[Hensel] 整数係数に戻して積が一致: ${JSON.stringify(intFactors)}`);
                return intFactors;
              }
            }
          }
        }
        if (steps && foundModMatch.length > 0)
          steps.push(`[Hensel] mod m で一致した因子セット: ${JSON.stringify(foundModMatch)}`);
        // 組み合わせが見つからなければ従来通り返す
        return normalizedHensel;
      } catch (error) {
        lastError = error;
        if (steps)
          (steps ?? []).push(
            `[Hensel] 例外発生: ${error instanceof Error ? error.message : String(error)} (prime=${currentPrime})`
          );
        // 逆元が求められない場合は次の素数で再試行
        continue;
      }
    }
    // すべての素数で失敗した場合は元の因子を返す
    if (steps)
      (steps ?? []).push(`[Hensel] 全ての素数でリフト失敗: ${lastError ? lastError.message : ''}`);
    return factorCoeffs;
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

  // mod n の範囲 [0, n-1] に正規化
  private normalizeCoeff(c: number, mod: number): number {
    return ((c % mod) + mod) % mod;
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
