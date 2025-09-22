import { FactorizationPattern, PatternUtils } from './pattern-utils';
import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

import { ASTNode } from '@/types';

export class QuadraticPattern implements FactorizationPattern, FactorizationStrategy {
  canApply(node: ASTNode, _context: FactorizationContext): boolean {
    return this.matches(node);
  }

  apply(node: ASTNode, _context: FactorizationContext): FactorizationResult {
    const factored = this.factor(node);
    return {
      success: !!factored,
      ast: factored ?? node,
      changed: !!factored,
      steps: factored ? [`[QuadraticPattern] Factored: ...`] : ['No quadratic factorization found'],
      strategyUsed: this.name,
      canContinue: true,
    };
  }
  name = 'quadratic-factorization';
  description = 'Factor quadratic expressions ax² + bx + c';
  priority = 30;

  matches(node: ASTNode): boolean {
    if (node.type === 'BinaryExpression') {
      const quadratic = this.extractQuadraticCoefficients(node);
      return quadratic !== null && quadratic.a !== 0 && (quadratic.b !== 0 || quadratic.c !== 0);
    }
    return false;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;
    const quadratic = this.extractQuadraticCoefficients(node);
    if (!quadratic) return null;
    const { a, b, c, variable } = quadratic;
    const factors = this.findQuadraticFactors(a, b, c);
    if (!factors) return null;
    const { p, q, r, s } = factors;
    const firstFactor = this.buildLinearFactor(p, q, variable);
    const secondFactor = this.buildLinearFactor(r, s, variable);
    const factored = PatternUtils.createBinaryExpression(firstFactor, '*', secondFactor);
    if (JSON.stringify(factored) === JSON.stringify(node)) {
      return null;
    }
    return factored;
  }

  private buildLinearFactor(coeff: number, constant: number, variable: string): ASTNode {
    const coeffTerm =
      coeff === 1
        ? PatternUtils.createIdentifier(variable)
        : PatternUtils.createBinaryExpression(
            PatternUtils.createNumber(coeff),
            '*',
            PatternUtils.createIdentifier(variable)
          );
    if (constant === 0) {
      return coeffTerm;
    } else if (constant > 0) {
      return PatternUtils.createBinaryExpression(
        coeffTerm,
        '+',
        PatternUtils.createNumber(constant)
      );
    } else {
      return PatternUtils.createBinaryExpression(
        coeffTerm,
        '-',
        PatternUtils.createNumber(-constant)
      );
    }
  }

  private extractQuadraticCoefficients(node: ASTNode): {
    a: number;
    b: number;
    c: number;
    variable: string;
  } | null {
    const terms = this.parsePolynomialTerms(node);
    if (terms.length === 0) return null;
    let a = 0,
      b = 0,
      c = 0;
    let variable = 'x';
    for (const term of terms) {
      if (term.degree === 2) {
        a = term.coefficient;
        variable = term.variable;
      } else if (term.degree === 1) {
        b = term.coefficient;
      } else if (term.degree === 0) {
        c = term.coefficient;
      }
    }
    return a !== 0 ? { a, b, c, variable } : null;
  }

  private parsePolynomialTerms(node: ASTNode): Array<{
    coefficient: number;
    degree: number;
    variable: string;
  }> {
    const terms: ASTNode[] = [];
    const collectTerms = (n: ASTNode): void => {
      if (n.type === 'BinaryExpression' && (n.operator === '+' || n.operator === '-')) {
        collectTerms(n.left);
        if (n.operator === '-') {
          terms.push({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: -1 },
            right: n.right,
          } as ASTNode);
        } else {
          terms.push(n.right);
        }
      } else {
        terms.push(n);
      }
    };
    collectTerms(node);
    const parsed = terms.map(term => {
      let coefficient = 1;
      let degree = 0;
      let variable = '';
      if (term.type === 'NumberLiteral') {
        coefficient = term.value;
        degree = 0;
        variable = 'x';
      } else if (term.type === 'Identifier') {
        coefficient = 1;
        degree = 1;
        variable = term.name;
      } else if (term.type === 'BinaryExpression') {
        if (term.operator === '*') {
          const left = term.left;
          const right = term.right;
          if (left.type === 'NumberLiteral' && right.type === 'Identifier') {
            coefficient = left.value;
            degree = 1;
            variable = right.name;
          } else if (left.type === 'Identifier' && right.type === 'NumberLiteral') {
            coefficient = right.value;
            degree = 1;
            variable = left.name;
          } else if (
            left.type === 'BinaryExpression' &&
            left.operator === '^' &&
            right.type === 'NumberLiteral'
          ) {
            if (left.left.type === 'Identifier' && left.right.type === 'NumberLiteral') {
              coefficient = right.value;
              degree = left.right.value;
              variable = left.left.name;
            }
          } else if (
            left.type === 'Identifier' &&
            right.type === 'BinaryExpression' &&
            right.operator === '^'
          ) {
            if (
              right.left.type === 'Identifier' &&
              right.right.type === 'NumberLiteral' &&
              left.name === right.left.name
            ) {
              coefficient = 1;
              degree = 1 + right.right.value;
              variable = left.name;
            }
          } else if (
            left.type === 'NumberLiteral' &&
            right.type === 'BinaryExpression' &&
            right.operator === '*'
          ) {
            coefficient = left.value;
            degree = 1;
            variable = '?';
          } else if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
            coefficient = left.value * right.value;
            degree = 0;
            variable = 'x';
          } else if (
            left.type === 'NumberLiteral' &&
            right.type === 'BinaryExpression' &&
            right.operator === '^'
          ) {
            if (right.left.type === 'Identifier' && right.right.type === 'NumberLiteral') {
              coefficient = left.value;
              degree = right.right.value;
              variable = right.left.name;
            }
          } else if (left.type === 'NumberLiteral' && right.type === 'BinaryExpression') {
            coefficient = left.value;
            degree = 1;
            variable = '?';
          } else if (left.type === 'NumberLiteral') {
            coefficient = left.value;
            degree = 0;
            variable = 'x';
          }
        } else if (term.operator === '^') {
          if (term.left.type === 'Identifier' && term.right.type === 'NumberLiteral') {
            coefficient = 1;
            degree = term.right.value;
            variable = term.left.name;
          }
        }
      }
      return { coefficient, degree, variable };
    });
    return parsed;
  }

  private findQuadraticFactors(
    a: number,
    b: number,
    c: number
  ): {
    p: number;
    q: number;
    r: number;
    s: number;
  } | null {
    if (a === 1) {
      for (let p = -20; p <= 20; p++) {
        for (let q = p; q <= 20; q++) {
          if (p * q === c && p + q === b) {
            return { p: 1, q: p, r: 1, s: q };
          }
          if (p !== q && q * p === c && q + p === b) {
            return { p: 1, q: q, r: 1, s: p };
          }
        }
      }
    }
    return null;
  }
}
