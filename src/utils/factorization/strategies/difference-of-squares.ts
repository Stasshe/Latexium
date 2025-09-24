/**
 * Difference of Squares Strategy
 * Factors expressions of the form a² - b² into (a + b)(a - b)
 */

import { astToLatex } from '../../ast';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  ASTBuilder,
} from '../framework';

import {
  ASTNode,
  BinaryExpression,
  NumberLiteral,
  Identifier,
  UnaryExpression,
  StepTree,
} from '@/types';

export class DifferenceOfSquaresStrategy implements FactorizationStrategy {
  name = 'Difference of Squares';
  description = 'Factor expressions of the form a² - b² into (a + b)(a - b)';
  priority = 140;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    return this.isDifferenceOfSquares(node);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: StepTree[] = [];

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
      let leftSquareRoot: ASTNode | null = null;
      let rightSquareRoot: ASTNode | null = null;

      // Handle standard a - b form
      if (binaryNode.operator === '-') {
        leftSquareRoot = this.extractSquareRoot(binaryNode.left);
        rightSquareRoot = this.extractSquareRoot(binaryNode.right);
      }
      // Handle a + (-b) form where -b is UnaryExpression
      else if (
        binaryNode.operator === '+' &&
        binaryNode.right.type === 'UnaryExpression' &&
        binaryNode.right.operator === '-'
      ) {
        leftSquareRoot = this.extractSquareRoot(binaryNode.left);
        rightSquareRoot = this.extractSquareRoot(binaryNode.right.operand);
      }

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
        canContinue: true, // Allow further factorization of the result
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
    // Handle standard a - b form
    if (node.type === 'BinaryExpression' && node.operator === '-') {
      const leftIsSquare = this.isSquareExpression(node.left);
      const rightIsSquare = this.isSquareExpression(node.right);
      return leftIsSquare && rightIsSquare;
    }

    // Handle a + (-b) form (where -b is a UnaryExpression)
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      if (node.right.type === 'UnaryExpression' && node.right.operator === '-') {
        const leftIsSquare = this.isSquareExpression(node.left);
        const rightIsSquare = this.isSquareExpression(node.right.operand);
        return leftIsSquare && rightIsSquare;
      }
    }

    return false;
  }

  /**
   * Check if expression is a perfect square
   */
  private isSquareExpression(node: ASTNode): boolean {
    // Check for explicit x^2 form
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return true;
      }
      // Check for x^4 = (x^2)^2, x^6 = (x^3)^2, etc.
      if (node.right.type === 'NumberLiteral' && node.right.value % 2 === 0) {
        return true;
      }
    }

    // Check for x*x form
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (this.areEquivalentExpressions(node.left, node.right)) {
        return true;
      }

      // Check for coefficient * perfect_square form like 9x^2
      if (node.left.type === 'NumberLiteral') {
        const coeff = node.left.value;
        const coeffSqrt = Math.sqrt(Math.abs(coeff));
        return Number.isInteger(coeffSqrt) && this.isSquareExpression(node.right);
      }

      if (node.right.type === 'NumberLiteral') {
        const coeff = node.right.value;
        const coeffSqrt = Math.sqrt(Math.abs(coeff));
        return Number.isInteger(coeffSqrt) && this.isSquareExpression(node.left);
      }
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
    // Handle x^n case where n is even
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral') {
        if (node.right.value === 2) {
          return node.left;
        }
        // Handle x^4 = (x^2)^2, x^6 = (x^3)^2, etc.
        if (node.right.value % 2 === 0) {
          const halfPower = node.right.value / 2;
          return ASTBuilder.binary('^', node.left, ASTBuilder.number(halfPower));
        }
      }
    }

    // Handle x*x case
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (this.areEquivalentExpressions(node.left, node.right)) {
        return node.left;
      }
    }

    // Handle coefficient * perfect_square case (e.g., 9x^2 -> 3x)
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        const coeff = node.left.value;
        const coeffSqrt = Math.sqrt(Math.abs(coeff));
        const rightRoot = this.extractSquareRoot(node.right);
        if (Number.isInteger(coeffSqrt) && rightRoot) {
          return ASTBuilder.multiply(ASTBuilder.number(coeffSqrt), rightRoot);
        }
      }

      if (node.right.type === 'NumberLiteral') {
        const coeff = node.right.value;
        const coeffSqrt = Math.sqrt(Math.abs(coeff));
        const leftRoot = this.extractSquareRoot(node.left);
        if (Number.isInteger(coeffSqrt) && leftRoot) {
          return ASTBuilder.multiply(leftRoot, ASTBuilder.number(coeffSqrt));
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
