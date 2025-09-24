import { FactorizationPattern, PatternUtils } from './pattern-utils';
import { FactorizationContext, FactorizationResult } from '../framework';

import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '@/types';

export class CyclotomicPattern implements FactorizationPattern {
  name = 'cyclotomic';
  description = 'Factor x^n - 1, x^n + 1 into cyclotomic polynomials';
  priority = 90;

  canApply(node: ASTNode, _context: FactorizationContext): boolean {
    return this.matches(node);
  }

  apply(node: ASTNode, _context: FactorizationContext): FactorizationResult {
    const factored = this.factor(node);
    return {
      success: !!factored,
      ast: factored ?? node,
      changed: !!factored,
      steps: factored
        ? [`[CyclotomicPattern] Factored: ...`]
        : ['No cyclotomic factorization found'],
      strategyUsed: this.name,
      canContinue: true,
    };
  }

  matches(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression') return false;
    if (node.operator !== '-' && node.operator !== '+') return false;
    const left = node.left;
    const right = node.right;
    if (
      left.type === 'BinaryExpression' &&
      left.operator === '^' &&
      left.left.type === 'Identifier' &&
      left.right.type === 'NumberLiteral' &&
      right.type === 'NumberLiteral' &&
      right.value === 1
    ) {
      if (left.right.value >= 2) return true;
    }
    return false;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;
    const bin = node as BinaryExpression;
    const left = bin.left as BinaryExpression;
    const variable = (left.left as Identifier).name;
    const n = (left.right as NumberLiteral).value;
    const isMinus = bin.operator === '-';
    if (isMinus) {
      return this.factorXNMinus1(variable, n);
    } else {
      return this.factorXNPlus1(variable, n);
    }
  }

  private factorXNMinus1(variable: string, n: number): ASTNode {
    const x = PatternUtils.createIdentifier(variable);
    const one = PatternUtils.createNumber(1);
    const xMinus1 = PatternUtils.createBinaryExpression(x, '-', one);
    let sum: ASTNode = PatternUtils.createNumber(1);
    for (let k = n - 1; k >= 1; k--) {
      const term = PatternUtils.createBinaryExpression(
        PatternUtils.createIdentifier(variable),
        '^',
        PatternUtils.createNumber(k)
      );
      sum = PatternUtils.createBinaryExpression(sum, '+', term);
    }
    return PatternUtils.createBinaryExpression(xMinus1, '*', sum);
  }

  private factorXNPlus1(variable: string, n: number): ASTNode {
    const x = PatternUtils.createIdentifier(variable);
    const one = PatternUtils.createNumber(1);
    // n even: x^n + 1 = (x^{n/2} + sqrt(2)x^{n/4} + 1)(x^{n/2} - sqrt(2)x^{n/4} + 1)
    if (n % 2 === 0 && n >= 2) {
      const n2 = n / 2;
      const n4 = n / 4;
      // Only handle n divisible by 4 for sqrt(2)x^{n/4} form
      if (n4 === Math.floor(n4) && n4 >= 1) {
        // (x^{n/2} + sqrt(2)x^{n/4} + 1)(x^{n/2} - sqrt(2)x^{n/4} + 1)
        const x_n2 = PatternUtils.createBinaryExpression(x, '^', PatternUtils.createNumber(n2));
        const x_n4 = PatternUtils.createBinaryExpression(x, '^', PatternUtils.createNumber(n4));
        const sqrt2 = PatternUtils.createNumber(Math.SQRT2);
        const sqrt2_xn4 = PatternUtils.createBinaryExpression(sqrt2, '*', x_n4);
        const minus_sqrt2_xn4 = PatternUtils.createBinaryExpression(
          PatternUtils.createNumber(-Math.SQRT2),
          '*',
          x_n4
        );
        const left = PatternUtils.createBinaryExpression(
          PatternUtils.createBinaryExpression(x_n2, '+', sqrt2_xn4),
          '+',
          one
        );
        const right = PatternUtils.createBinaryExpression(
          PatternUtils.createBinaryExpression(x_n2, '+', minus_sqrt2_xn4),
          '+',
          one
        );
        return PatternUtils.createBinaryExpression(left, '*', right);
      }
    }
    // fallback: (x+1)(x^{n-1} - x^{n-2} + ... + 1)
    const xPlus1 = PatternUtils.createBinaryExpression(x, '+', one);
    let sum: ASTNode = PatternUtils.createNumber(1);
    for (let k = n - 1; k >= 1; k--) {
      const term = PatternUtils.createBinaryExpression(
        PatternUtils.createIdentifier(variable),
        '^',
        PatternUtils.createNumber(k)
      );
      const sign = (n - 1 - k) % 2 === 0 ? 1 : -1;
      const signedTerm =
        sign === 1
          ? term
          : PatternUtils.createBinaryExpression(PatternUtils.createNumber(-1), '*', term);
      sum = PatternUtils.createBinaryExpression(sum, '+', signedTerm);
    }
    return PatternUtils.createBinaryExpression(xPlus1, '*', sum);
  }
}
