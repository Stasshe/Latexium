import { FactorizationPattern, PatternUtils } from './pattern-utils';

import { ASTNode, BinaryExpression } from '@/types';

export class ConcreteCommonFactorPattern implements FactorizationPattern {
  name = 'common-factor';
  description = 'Extract common factors from polynomial terms';

  matches(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression') return false;
    if (node.operator !== '+' && node.operator !== '-') return false;
    const terms = this.extractTerms(node);
    if (terms.length < 2) return false;
    if (terms.every(term => term.type === 'NumberLiteral')) return false;
    const coefficients = terms.map(term => PatternUtils.getCoefficient(term));
    const gcd = PatternUtils.gcdArray(coefficients);
    return gcd > 1;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;
    const terms = this.extractTerms(node as BinaryExpression);
    if (terms.length < 2) return null;
    if (terms.every(term => term.type === 'NumberLiteral')) return null;
    const coefficients = terms.map(term => PatternUtils.getCoefficient(term));
    const gcd = PatternUtils.gcdArray(coefficients);
    if (gcd <= 1) return null;
    const factorNode = PatternUtils.createNumber(gcd);
    const simplifiedTerms = terms.map(term => {
      const coeff = PatternUtils.getCoefficient(term);
      const varPart = PatternUtils.getVariablePart(term);
      const newCoeff = coeff / gcd;
      if (newCoeff === 1 && varPart) {
        return varPart;
      } else if (varPart) {
        return PatternUtils.createBinaryExpression(
          PatternUtils.createNumber(newCoeff),
          '*',
          varPart
        );
      } else {
        return PatternUtils.createNumber(newCoeff);
      }
    });
    if (simplifiedTerms.length === 0) return null;
    let simplified = simplifiedTerms[0];
    if (!simplified) return null;
    for (let i = 1; i < simplifiedTerms.length; i++) {
      const term = simplifiedTerms[i];
      if (!term) continue;
      simplified = PatternUtils.createBinaryExpression(simplified, '+', term);
    }
    return PatternUtils.createBinaryExpression(factorNode, '*', simplified);
  }

  private extractTerms(node: BinaryExpression): ASTNode[] {
    const terms: ASTNode[] = [];
    if (node.operator === '+' || node.operator === '-') {
      if (
        node.left.type === 'BinaryExpression' &&
        (node.left.operator === '+' || node.left.operator === '-')
      ) {
        terms.push(...this.extractTerms(node.left));
      } else {
        terms.push(node.left);
      }
      terms.push(node.right);
    } else {
      terms.push(node);
    }
    return terms;
  }
}
