/**
 * LLL Lattice Utilities for Polynomial Factorization
 * - Lattice basis construction from integer polynomial coefficients
 * - LLL lattice basis reduction (Lenstra–Lenstra–Lovász)
 * - Short vector extraction for factor candidate search
 */

// Lattice basis construction for a given polynomial
export function createLatticeBasis(coefficients: number[], bound: number = 1000): number[][] {
  // For degree n, construct (n+1)x(n+1) matrix
  // Diagonal: bound, last row: coefficients
  const n = coefficients.length - 1;
  const basis: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n + 1).fill(0);
    row[i] = bound;
    basis.push(row);
  }
  // Last row: polynomial coefficients
  const lastRow = coefficients.slice();
  while (lastRow.length < n + 1) lastRow.push(0);
  basis.push(lastRow);
  return basis;
}

// LLL lattice basis reduction (simplified, integer arithmetic)
export function lllReduce(basis: number[][], delta: number = 0.75): number[][] {
  // Gram-Schmidt orthogonalization and size reduction
  // This is a simplified version for small integer lattices
  const m = basis.length;
  const n = basis[0]?.length ?? 0;
  if (n === 0) return [];
  const B: number[][] = basis.map(row => row.slice());
  const mu: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const Bstar: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  const BstarNorm: number[] = new Array(m).fill(0);

  // Initialize Bstar[0]
  if (B[0] && Bstar[0]) {
    for (let j = 0; j < n; j++) Bstar[0][j] = B[0][j] ?? 0;
    BstarNorm[0] = dot(Bstar[0], Bstar[0]);
  }

  for (let i = 1; i < m; i++) {
    const Bi: number[] = Array.isArray(B[i])
      ? (B[i] as number[])
      : (new Array(n).fill(0) as number[]);
    const Bstari: number[] = Array.isArray(Bstar[i])
      ? (Bstar[i] as number[])
      : (new Array(n).fill(0) as number[]);
    for (let j = 0; j < n; j++) {
      Bstari[j] = Bi[j] ?? 0;
    }
    for (let k = 0; k < i; k++) {
      const Bstark: number[] = Array.isArray(Bstar[k])
        ? (Bstar[k] as number[])
        : (new Array(n).fill(0) as number[]);
      const mu_i: number[] = Array.isArray(mu[i])
        ? (mu[i] as number[])
        : (new Array(m).fill(0) as number[]);
      if (typeof BstarNorm[k] !== 'number' || BstarNorm[k] === 0) {
        mu_i[k] = 0;
        mu[i] = mu_i;
        continue;
      }
      // @ts-expect-error Bi, Bstark are always number[]
      mu_i[k] = dot(Bi, Bstark) / BstarNorm[k];
      mu[i] = mu_i;
      for (let j = 0; j < n; j++) {
        // @ts-expect-error Bstari, Bstark are always number[]
        Bstari[j] -= (mu_i[k] ?? 0) * (Bstark[j] ?? 0);
      }
    }
    BstarNorm[i] = dot(Bstari, Bstari);
    Bstar[i] = Bstari;
  }

  let k = 1;
  while (k < m) {
    // Size reduction
    for (let j = k - 1; j >= 0; j--) {
      const mu_k: number[] = Array.isArray(mu[k])
        ? (mu[k] as number[])
        : (new Array(m).fill(0) as number[]);
      const mu_j: number[] = Array.isArray(mu[j])
        ? (mu[j] as number[])
        : (new Array(m).fill(0) as number[]);
      const muKJ = typeof mu_k[j] === 'number' ? mu_k[j] : 0;
      const q = Math.round(muKJ ?? 0);
      if (q !== 0) {
        const Bk: number[] = Array.isArray(B[k])
          ? (B[k] as number[])
          : (new Array(n).fill(0) as number[]);
        const Bj: number[] = Array.isArray(B[j])
          ? (B[j] as number[])
          : (new Array(n).fill(0) as number[]);
        for (let l = 0; l < n; l++) {
          // @ts-expect-error Bk, Bj are always number[]
          Bk[l] -= (q ?? 0) * (Bj[l] ?? 0);
        }
        for (let i = 0; i < j; i++) {
          mu_k[i] = (mu_k[i] ?? 0) - (q ?? 0) * (mu_j[i] ?? 0);
        }
        mu_k[j] = (mu_k[j] ?? 0) - (q ?? 0);
        mu[k] = mu_k;
      }
    }
    // Lovász condition
    const lhs = typeof BstarNorm[k] === 'number' ? BstarNorm[k] : 0;
    const mu_k: number[] = Array.isArray(mu[k])
      ? (mu[k] as number[])
      : (new Array(m).fill(0) as number[]);
    const muKKm1 = typeof mu_k[k - 1] === 'number' ? mu_k[k - 1] : 0;

    let rhs = 0;
    if (BstarNorm[k - 1] !== undefined) {
      rhs = (delta - Number(muKKm1 ?? 0) ** 2) * (BstarNorm[k - 1] as number);
    }
    // @ts-expect-error lhs is always number here
    if (lhs < rhs) {
      // Swap B[k] and B[k-1]
      if (!Array.isArray(B[k]) || !Array.isArray(B[k - 1])) break;
      const temp = B[k];
      // @ts-expect-error B[k] and B[k-1] are always number[]
      B[k] = B[k - 1];
      // @ts-expect-error B[k] and B[k-1] are always number[]
      B[k - 1] = temp;
      k = Math.max(k - 1, 1);
      // Recompute Gram-Schmidt
      for (let i = 0; i < m; i++) {
        const Bi: number[] = Array.isArray(B[i])
          ? (B[i] as number[])
          : (new Array(n).fill(0) as number[]);
        const Bstari: number[] = Array.isArray(Bstar[i])
          ? (Bstar[i] as number[])
          : (new Array(n).fill(0) as number[]);
        for (let j = 0; j < n; j++) {
          Bstari[j] = Bi[j] ?? 0;
        }
        for (let l = 0; l < i; l++) {
          const Bstarl: number[] = Array.isArray(Bstar[l])
            ? (Bstar[l] as number[])
            : (new Array(n).fill(0) as number[]);
          const mu_i: number[] = Array.isArray(mu[i])
            ? (mu[i] as number[])
            : (new Array(m).fill(0) as number[]);
          if (typeof BstarNorm[l] !== 'number' || BstarNorm[l] === 0) {
            mu_i[l] = 0;
            mu[i] = mu_i;
            continue;
          }
          // @ts-expect-error Bi, Bstarl are always number[]
          mu_i[l] = dot(Bi, Bstarl) / BstarNorm[l];
          mu[i] = mu_i;
          for (let j = 0; j < n; j++) {
            // @ts-expect-error Bstari, Bstarl are always number[]
            Bstari[j] -= (mu_i[l] ?? 0) * (Bstarl[j] ?? 0);
          }
        }
        BstarNorm[i] = dot(Bstari, Bstari);
        Bstar[i] = Bstari;
      }
    } else {
      k++;
    }
  }
  return B;
}

// Extract short vectors as factor candidates
export function findShortVectors(basis: number[][], maxNorm: number = 10000): number[][] {
  // Return all nonzero vectors with norm below threshold
  return basis.filter(v => vectorNorm(v) > 0 && vectorNorm(v) < maxNorm);
}

// Utility: dot product
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    sum += ai * bi;
  }
  return sum;
}

// Utility: Euclidean norm
function vectorNorm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}
