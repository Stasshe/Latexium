/**
 * Perfect Power Strategy
 * x^n + ... の形で、(ax+b)^k の展開形を検出し、(ax+b)^k へ変換する
 * 例: x^4 + 4x^3 + 6x^2 + 4x + 1 → (x+1)^4
 */
import { ASTNode, BinaryExpression } from '../../../types/ast';
import { simplify as middleSimplify } from '../../middle-simplify';
import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';

export class PerfectPowerStrategy implements FactorizationStrategy {
  name = 'perfect-power';
  description = 'Detects and converts perfect power polynomials (e.g. (x+a)^k)';
  priority = 100;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // x以外の変数が含まれていれば適用不可
    if (this.hasOtherVariables(node, context.variable)) {
      return false;
    }
    const result = this.detectPerfectPower(node, context.variable);
    return result !== null;
  }
  // nodeにx以外の変数が含まれていればtrue
  private hasOtherVariables(node: ASTNode, variable: string): boolean {
    // 再帰的に探索
    if (node.type === 'Identifier') {
      return node.name !== variable;
    }
    if (node.type === 'BinaryExpression') {
      return (
        this.hasOtherVariables(node.left, variable) || this.hasOtherVariables(node.right, variable)
      );
    }
    if (node.type === 'UnaryExpression') {
      return this.hasOtherVariables(node.operand, variable);
    }
    if (node.type === 'FunctionCall') {
      return node.args.some(arg => this.hasOtherVariables(arg, variable));
    }
    // Fraction, Integral, Sum, Productなど他のAST型も必要なら追加
    return false;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const result = this.detectPerfectPower(node, context.variable);
    if (!result) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    const { a, b, k } = result;
    // (a x + b)^k
    const axb: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '+',
      left:
        a === 1
          ? {
              type: 'Identifier',
              name: context.variable,
              scope: 'free',
              uniqueId: `free_${context.variable}`,
            }
          : {
              type: 'BinaryExpression',
              operator: '*',
              left: { type: 'NumberLiteral', value: a },
              right: {
                type: 'Identifier',
                name: context.variable,
                scope: 'free',
                uniqueId: `free_${context.variable}`,
              },
            },
      right: { type: 'NumberLiteral', value: b },
    };
    const resultAst: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '^',
      left: axb,
      right: { type: 'NumberLiteral', value: k },
    };
    // Apply middle-simplify (expand: false) to combine like terms in the output
    const simplifiedAst = middleSimplify(resultAst, { expand: false });
    return {
      success: true,
      ast: simplifiedAst,
      changed: true,
      steps: [
        `Detected perfect power: (${a === 1 ? context.variable : a + context.variable} + ${b})^${k}`,
      ],
      strategyUsed: this.name,
      canContinue: false,
    };
  }

  // --- ユーティリティ ---
  // (ax+b)^k の展開形か判定し、a, b, kを返す
  private detectPerfectPower(
    node: ASTNode,
    variable: string
  ): { a: number; b: number; k: number } | null {
    // まず次数を取得
    const terms = this.extractTerms(node);
    const deg = Math.max(...terms.map(term => this.getPower(term, variable)));
    if (deg < 2 || deg > 8) return null; // 高次は計算コスト高
    // 係数配列を取得
    const coeffs: number[] = Array(deg + 1).fill(0);
    for (const term of terms) {
      const p = this.getPower(term, variable);
      const c = this.getCoefficient(term, variable);
      const idx = deg - p;
      if (
        typeof p === 'number' &&
        typeof c === 'number' &&
        p >= 0 &&
        p <= deg &&
        idx >= 0 &&
        idx < coeffs.length &&
        typeof coeffs[idx] === 'number'
      ) {
        coeffs[idx] += c;
      }
    }
    // k=2〜degで試す
    for (let k = 2; k <= deg; ++k) {
      // a,bを-10〜10で全探索
      for (let a = 1; a <= 3; ++a) {
        for (let b = -10; b <= 10; ++b) {
          const binom = this.expandBinomial(a, b, k, deg);
          if (binom.length !== coeffs.length) continue;
          let match = true;
          for (let i = 0; i < coeffs.length; ++i) {
            if (
              typeof binom[i] !== 'number' ||
              typeof coeffs[i] !== 'number' ||
              Math.abs(binom[i]! - coeffs[i]!) > 1e-8
            ) {
              match = false;
              break;
            }
          }
          if (match) return { a, b, k };
        }
      }
    }
    return null;
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
  // (ax+b)^k の展開係数
  private expandBinomial(a: number, b: number, k: number, deg: number): number[] {
    // (ax+b)^k = sum_{i=0}^k binom(k,i) * a^i * b^{k-i} * x^i
    const coeffs: number[] = Array(deg + 1).fill(0);
    for (let i = 0; i <= k; ++i) {
      coeffs[deg - i] = this.binom(k, i) * Math.pow(a, i) * Math.pow(b, k - i);
    }
    return coeffs;
  }
  private binom(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    let res = 1;
    for (let i = 1; i <= k; ++i) {
      res *= n - (k - i);
      res /= i;
    }
    return res;
  }
}
