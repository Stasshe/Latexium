/**
 * Power Substitution Strategy (汎用置換型因数分解)
 * x^{nk} + ... の形を t = x^k で置換し、多項式因数分解を行う
 * 例: x^6 - 13x^3 + 36 = (x^3)^2 - 13(x^3) + 36 = (x^3 - 4)(x^3 - 9)
 */
import { ASTNode, BinaryExpression } from '../../../types/ast';
import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';

export class PowerSubstitutionStrategy implements FactorizationStrategy {
  name = 'power-substitution';
  description = 'Factors polynomials by substitution t = x^k (k >= 2)';
  priority = 86;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const detected = this.detectPowerSubstitution(node, context.variable);
    if (!detected) return false;
    const { k, coeffs } = detected;
    return k >= 2 && coeffs.length >= 3 && this.canFactorAsPolynomial(coeffs);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const detected = this.detectPowerSubstitution(node, context.variable);
    if (!detected) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    const { k, coeffs } = detected;
    if (k < 2 || coeffs.length < 3) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    // 置換多項式の因数分解
    const roots = this.solvePolynomial(coeffs);
    if (!roots || roots.length === 0) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    // (x^k - root1)(x^k - root2)... の形に構成
    let factored: ASTNode = this.buildPowerFactor(roots[0] ?? 0, context.variable, k);
    for (let i = 1; i < roots.length; ++i) {
      factored = {
        type: 'BinaryExpression',
        operator: '*',
        left: factored,
        right: this.buildPowerFactor(roots[i] ?? 0, context.variable, k),
      };
    }
    return {
      success: true,
      ast: factored,
      changed: true,
      steps: [`Applied power substitution: t = ${context.variable}^${k}`],
      strategyUsed: this.name,
      canContinue: false,
    };
  }

  // --- ユーティリティ ---
  // x^{nk} + ... の形か判定し、kと係数配列を返す
  private detectPowerSubstitution(
    node: ASTNode,
    variable: string
  ): { k: number; coeffs: number[] } | null {
    // まず全項の次数を列挙
    const terms = this.extractTerms(node).filter(Boolean);
    if (terms.length === 0) return null;
    const powers = terms
      .map(term => this.getPower(term, variable))
      .filter((p): p is number => typeof p === 'number');
    if (powers.length === 0) return null;
    // すべての次数の最大公約数を求める
    const k = powers.reduce((a, b) => this.gcd(a, b));
    if (!k || k < 1) return null;
    // kで割った次数ごとに係数を集計
    const maxN = Math.max(...powers.map(p => p / k));
    if (!Number.isFinite(maxN) || maxN < 0) return null;
    const coeffs: number[] = Array(Math.floor(maxN) + 1).fill(0);
    for (let i = 0; i < terms.length; ++i) {
      const p = powers[i];
      const term = terms[i];
      if (typeof p !== 'number' || typeof term === 'undefined') continue;
      const n = p / k;
      const idx = Math.floor(maxN - n);
      if (
        Number.isInteger(n) &&
        n >= 0 &&
        n <= maxN &&
        idx >= 0 &&
        idx < coeffs.length &&
        typeof coeffs[idx] === 'number'
      ) {
        coeffs[idx] += this.getCoefficient(term, variable);
      }
    }
    return { k, coeffs };
  }
  private extractTerms(node: ASTNode): ASTNode[] {
    if (node.type === 'BinaryExpression') {
      const expr = node as BinaryExpression;
      if (expr.operator === '+') {
        return [...this.extractTerms(expr.left), ...this.extractTerms(expr.right)];
      } else if (expr.operator === '-') {
        return [
          ...this.extractTerms(expr.left),
          ...this.extractTerms(expr.right).map(t => this.negateTerm(t)),
        ];
      }
    }
    return [node];
  }
  private negateTerm(term: ASTNode): ASTNode {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: -1 },
      right: term,
    };
  }
  private getPower(term: ASTNode, variable: string): number {
    if (term.type === 'NumberLiteral') return 0;
    if (term.type === 'Identifier') return term.name === variable ? 1 : 0;
    if (term.type === 'BinaryExpression') {
      const expr = term as BinaryExpression;
      if (
        expr.operator === '^' &&
        expr.left.type === 'Identifier' &&
        expr.left.name === variable &&
        expr.right.type === 'NumberLiteral'
      ) {
        return expr.right.value;
      }
      if (expr.operator === '*') {
        return this.getPower(expr.left, variable) + this.getPower(expr.right, variable);
      }
    }
    return 0;
  }
  private getCoefficient(term: ASTNode, variable: string): number {
    if (term.type === 'NumberLiteral') return term.value;
    if (term.type === 'Identifier') return term.name === variable ? 1 : 0;
    if (term.type === 'BinaryExpression') {
      const expr = term as BinaryExpression;
      if (expr.operator === '^') {
        return this.getCoefficient(expr.left, variable);
      }
      if (expr.operator === '*') {
        return this.getCoefficient(expr.left, variable) * this.getCoefficient(expr.right, variable);
      }
    }
    return 1;
  }
  private gcd(a: number, b: number): number {
    if (!b) return Math.abs(a);
    return this.gcd(b, a % b);
  }
  // 係数配列が因数分解可能か（判定は簡易）
  private canFactorAsPolynomial(coeffs: number[]): boolean {
    // 判別式が完全平方数なら2次、3次はCardanoで判定、4次以上はfalse
    if (coeffs.length === 3) {
      const [a, b, c] = coeffs;
      if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return false;
      const D = b * b - 4 * a * c;
      return D >= 0 && Number.isInteger(Math.sqrt(D));
    }
    if (coeffs.length === 4) {
      // 3次: Cardanoの公式または根の存在判定（簡易: 有理根定理）
      // ここでは有理根定理で整数根があればtrue
      for (let r = -20; r <= 20; ++r) {
        if (aPolyEval(coeffs, r) === 0) return true;
      }
      return false;
    }
    return false;
  }
  // 2次・3次のみサポート
  private solvePolynomial(coeffs: number[]): number[] | null {
    if (coeffs.length === 3) {
      const [a, b, c] = coeffs;
      if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return null;
      const D = b * b - 4 * a * c;
      if (D < 0) return null;
      const sqrtD = Math.sqrt(D);
      return [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)];
    }
    if (coeffs.length === 4) {
      // 3次: 有理根定理で整数根のみサポート
      const roots: number[] = [];
      let poly = coeffs.slice();
      for (let r = -20; r <= 20; ++r) {
        while (poly.length > 1 && aPolyEval(poly, r) === 0) {
          roots.push(r);
          poly = aPolyDiv(poly, r);
        }
      }
      if (roots.length === 3) return roots;
      return null;
    }
    return null;
  }
  private buildPowerFactor(root: number, variable: string, k: number): ASTNode {
    const powerExpr: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '^',
      left: { type: 'Identifier', name: variable, scope: 'free', uniqueId: `free_${variable}` },
      right: { type: 'NumberLiteral', value: k },
    };
    if (root === 0) return powerExpr;
    const operator = root > 0 ? '-' : '+';

    // Helper: convert decimal to fraction if possible
    function decimalToFraction(x: number, tol = 1e-10): { num: number; den: number } | null {
      // Only handle finite decimals
      if (Number.isInteger(x)) return { num: x, den: 1 };
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);
      let denominator = 1;
      while (Math.abs(x * denominator - Math.round(x * denominator)) > tol && denominator < 10000) {
        denominator *= 10;
      }
      const numerator = Math.round(x * denominator);
      // Reduce fraction
      function gcd(a: number, b: number): number {
        return b ? gcd(b, a % b) : Math.abs(a);
      }
      const g = gcd(numerator, denominator);
      return { num: (sign * numerator) / g, den: denominator / g };
    }

    let rightNode: ASTNode;
    const absRoot = Math.abs(root);
    if (Number.isInteger(absRoot)) {
      rightNode = { type: 'NumberLiteral', value: absRoot };
    } else {
      const frac = decimalToFraction(absRoot);
      if (frac && frac.den !== 1) {
        rightNode = {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: frac.num },
          denominator: { type: 'NumberLiteral', value: frac.den },
        };
      } else {
        rightNode = { type: 'NumberLiteral', value: absRoot };
      }
    }
    return {
      type: 'BinaryExpression',
      operator,
      left: powerExpr,
      right: rightNode,
    };
  }
}
// 多項式評価
function aPolyEval(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}
// 多項式割り算（(x - r)で割る）
function aPolyDiv(coeffs: number[], r: number): number[] {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < coeffs.length; ++i) {
    if (typeof coeffs[i] !== 'number') continue;
    acc = acc * r + coeffs[i]!;
    if (i < coeffs.length - 1) out.push(acc);
  }
  return out;
}
