/**
 * Difference of Squares Strategy
 * Factors expressions of the form a² - b² into (a + b)(a - b)
 */

import {
  ASTNode,
  BinaryExpression,
  NumberLiteral,
  Identifier,
  UnaryExpression,
} from '../../../types';
import { astToLatex } from '../../ast';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  ASTBuilder,
} from '../framework';

export class DifferenceOfSquaresStrategy implements FactorizationStrategy {
  name = 'Difference of Squares';
  description = 'Factor expressions of the form a² - b² into (a + b)(a - b)';
  priority = 90;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    return this.isDifferenceOfSquares(node);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      if (!this.isDifferenceOfSquares(node)) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Not a difference of squares'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      const binaryNode = node as BinaryExpression;

      // Extract the square roots
      const leftSquareRoot = this.extractSquareRoot(binaryNode.left);
      const rightSquareRoot = this.extractSquareRoot(binaryNode.right);

      if (!leftSquareRoot || !rightSquareRoot) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Could not extract square roots'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      steps.push(
        `Identified difference of squares: (${astToLatex(leftSquareRoot)})² - (${astToLatex(rightSquareRoot)})²`
      );
      steps.push('Applying formula: a² - b² = (a + b)(a - b)');

      // Build the factored form: (a + b)(a - b)
      const sumFactor = ASTBuilder.add(leftSquareRoot, rightSquareRoot);
      const differenceFactor = ASTBuilder.subtract(leftSquareRoot, rightSquareRoot);
      const result = ASTBuilder.multiply(sumFactor, differenceFactor);

      steps.push(
        `Result: (${astToLatex(leftSquareRoot)} + ${astToLatex(rightSquareRoot)})(${astToLatex(leftSquareRoot)} - ${astToLatex(rightSquareRoot)})`
      );

      return {
        success: true,
        ast: result,
        changed: true,
        steps,
        strategyUsed: this.name,
        canContinue: true,
      };
    } catch (error) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        strategyUsed: this.name,
        canContinue: false,
      };
    }
  }

  /**
   * Check if expression is a difference of squares
   */
  private isDifferenceOfSquares(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression' || node.operator !== '-') {
      return false;
    }

    const leftIsSquare = this.isSquareExpression(node.left);
    const rightIsSquare = this.isSquareExpression(node.right);

    return leftIsSquare && rightIsSquare;
  }

  /**
   * Check if expression is a perfect square
   */
  private isSquareExpression(node: ASTNode): boolean {
    // Check for explicit x^2 form
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      return node.right.type === 'NumberLiteral' && node.right.value === 2;
    }

    // Check for x*x form
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      return this.areEquivalentExpressions(node.left, node.right);
    }

    // Check for coefficient * x^2 form
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      const hasSquare = this.isSquareExpression(node.left) || this.isSquareExpression(node.right);
      const hasNumber = node.left.type === 'NumberLiteral' || node.right.type === 'NumberLiteral';
      return hasSquare && hasNumber;
    }

    // Check for perfect square numbers
    if (node.type === 'NumberLiteral') {
      const sqrt = Math.sqrt(Math.abs(node.value));
      return Number.isInteger(sqrt);
    }

    return false;
  }

  /**
   * Extract the square root of a square expression
   */
  private extractSquareRoot(node: ASTNode): ASTNode | null {
    // Handle x^2 case
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return node.left;
      }
    }

    // Handle x*x case
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (this.areEquivalentExpressions(node.left, node.right)) {
        return node.left;
      }
    }

    // Handle coefficient * x^2 case
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        const sqrt = Math.sqrt(Math.abs(node.left.value));
        const rightRoot = this.extractSquareRoot(node.right);
        if (Number.isInteger(sqrt) && rightRoot) {
          return ASTBuilder.multiply(ASTBuilder.number(sqrt), rightRoot);
        }
      }

      if (node.right.type === 'NumberLiteral') {
        const sqrt = Math.sqrt(Math.abs(node.right.value));
        const leftRoot = this.extractSquareRoot(node.left);
        if (Number.isInteger(sqrt) && leftRoot) {
          return ASTBuilder.multiply(leftRoot, ASTBuilder.number(sqrt));
        }
      }
    }

    // Handle perfect square numbers
    if (node.type === 'NumberLiteral') {
      const sqrt = Math.sqrt(Math.abs(node.value));
      if (Number.isInteger(sqrt)) {
        return ASTBuilder.number(sqrt);
      }
    }

    // Handle variables and other expressions (assume they're square roots)
    if (node.type === 'Identifier') {
      return node;
    }

    return null;
  }

  /**
   * Check if two expressions are equivalent
   */
  private areEquivalentExpressions(left: ASTNode, right: ASTNode): boolean {
    if (left.type !== right.type) {
      return false;
    }

    switch (left.type) {
      case 'NumberLiteral':
        return Math.abs(left.value - (right as NumberLiteral).value) < 1e-10;

      case 'Identifier':
        return left.name === (right as Identifier).name;

      case 'BinaryExpression': {
        const rightBinary = right as BinaryExpression;
        return (
          left.operator === rightBinary.operator &&
          this.areEquivalentExpressions(left.left, rightBinary.left) &&
          this.areEquivalentExpressions(left.right, rightBinary.right)
        );
      }

      case 'UnaryExpression': {
        const rightUnary = right as UnaryExpression;
        return (
          left.operator === rightUnary.operator &&
          this.areEquivalentExpressions(left.operand, rightUnary.operand)
        );
      }

      default:
        return false;
    }
  }
}
