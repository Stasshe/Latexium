import { FactorizationPattern, PatternUtils } from './pattern-utils';
import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

import { ASTNode, BinaryExpression } from '@/types';

export class ConcreteCommonFactorPattern implements FactorizationPattern, FactorizationStrategy {
  name = 'common-factor';
  description = 'Extract common factors from polynomial terms';
  priority = 20;
  factor(node: ASTNode): ASTNode | null {
    throw new Error('Method not implemented.');
  }

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

  canApply(node: ASTNode, _context: FactorizationContext): boolean {
    return this.matches(node);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps = context.steps || [];
    if (!this.matches(node)) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor found'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    const terms = this.extractTerms(node as BinaryExpression);
    if (terms.length < 2 || terms.every(term => term.type === 'NumberLiteral')) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor found'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    const coefficients = terms.map(term => PatternUtils.getCoefficient(term));
    const gcd = PatternUtils.gcdArray(coefficients);
    if (gcd <= 1) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor found'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
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
    if (simplifiedTerms.length === 0) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor found'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    let simplified = simplifiedTerms[0];
    if (!simplified) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor found'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
    for (let i = 1; i < simplifiedTerms.length; i++) {
      const term = simplifiedTerms[i];
      if (!term) continue;
      simplified = PatternUtils.createBinaryExpression(simplified, '+', term);
    }
    const resultAst = PatternUtils.createBinaryExpression(factorNode, '*', simplified);
    return {
      success: true,
      ast: resultAst,
      changed: true,
      steps: [...steps, 'Extracted common factor'],
      strategyUsed: this.name,
      canContinue: true,
    };
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
