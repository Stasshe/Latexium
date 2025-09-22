import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';
import { FactorizationPattern, PatternUtils } from './pattern-utils';

import { ASTNode, BinaryExpression } from '@/types';

export class ConcreteDifferenceOfSquaresPattern
  implements FactorizationPattern, FactorizationStrategy
{
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
        ? [`[DifferenceOfSquaresPattern] Factored: ...`]
        : ['No difference of squares found'],
      strategyUsed: this.name,
      canContinue: true,
    };
  }
  name = 'difference-of-squares';
  description = 'Factor expressions of the form a² - b²';
  priority = 10;

  matches(node: ASTNode): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '-') {
      return this.isDifferenceOfSquares(node);
    }
    return false;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;
    const binNode = node as BinaryExpression;
    if (binNode.operator !== '-') return null;
    const aSquared = this.extractSquareRoot(binNode.left);
    const bSquared = this.extractSquareRoot(binNode.right);
    if (!aSquared || !bSquared) return null;
    const firstFactor = PatternUtils.createBinaryExpression(aSquared, '-', bSquared);
    const secondFactor = PatternUtils.createBinaryExpression(aSquared, '+', bSquared);
    return PatternUtils.createBinaryExpression(firstFactor, '*', secondFactor);
  }

  private isDifferenceOfSquares(node: BinaryExpression): boolean {
    return this.isPerfectSquare(node.left) && this.isPerfectSquare(node.right);
  }

  private isPerfectSquare(node: ASTNode): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return true;
      }
    }
    return false;
  }

  private extractSquareRoot(node: ASTNode): ASTNode | null {
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return node.left;
      }
    }
    return null;
  }
}
