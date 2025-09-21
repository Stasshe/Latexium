import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';
import { ASTBuilder } from '../framework';

import { ASTNode, StepTree } from '@/types/ast';

/**
 * Simple Common Factor Strategy for debugging
 */
export class SimpleCommonFactorStrategy implements FactorizationStrategy {
  name = 'Simple Common Factor';
  description = 'Simple common factor extraction for debugging';
  priority = 100;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    return this.isAddition(node) && this.hasCommonFactor(node);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: StepTree[] = [];

    if (node.type !== 'BinaryExpression' || node.operator !== '+') {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: ['Not an addition expression'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }

    // For simple case: 6x + 9
    const left = node.left; // 6x (BinaryExpression * with 6 and x)
    const right = node.right; // 9 (NumberLiteral)

    steps.push(
      `Analyzing simple addition: left=${this.nodeToString(left)}, right=${this.nodeToString(right)}`
    );

    // Extract coefficients manually for debugging
    const leftCoeff = this.extractCoefficient(left);
    const rightCoeff = this.extractCoefficient(right);

    steps.push(`Left coefficient: ${leftCoeff}, Right coefficient: ${rightCoeff}`);

    if (leftCoeff === null || rightCoeff === null) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'Could not extract coefficients'],
        strategyUsed: this.name,
        canContinue: false,
      };
    }

    const gcd = this.gcd(Math.abs(leftCoeff), Math.abs(rightCoeff));
    steps.push(`GCD of ${leftCoeff} and ${rightCoeff} is ${gcd}`);

    if (gcd <= 1) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [...steps, 'No common factor greater than 1'],
        strategyUsed: this.name,
        canContinue: true,
      };
    }

    // Factor out the GCD
    const newLeftCoeff = leftCoeff / gcd;
    const newRightCoeff = rightCoeff / gcd;

    steps.push(`After factoring out ${gcd}: left=${newLeftCoeff}, right=${newRightCoeff}`);

    // Build the factored expression: gcd * (newLeft + newRight)
    let newLeft: ASTNode;
    if (
      left.type === 'BinaryExpression' &&
      left.operator === '*' &&
      left.left.type === 'NumberLiteral' &&
      left.right.type === 'Identifier'
    ) {
      // Replace coefficient in 6x -> 2x
      newLeft =
        newLeftCoeff === 1
          ? left.right
          : ASTBuilder.binary('*', ASTBuilder.number(newLeftCoeff), left.right);
    } else {
      newLeft = ASTBuilder.number(newLeftCoeff);
    }

    const newRight = ASTBuilder.number(newRightCoeff);
    const factorContent = ASTBuilder.binary('+', newLeft, newRight);
    const result = ASTBuilder.binary('*', ASTBuilder.number(gcd), factorContent);

    steps.push(
      `Final result: ${gcd} * (${this.nodeToString(newLeft)} + ${this.nodeToString(newRight)})`
    );

    return {
      success: true,
      ast: result,
      changed: true,
      steps,
      strategyUsed: this.name,
      canContinue: true,
    };
  }

  private isAddition(node: ASTNode): boolean {
    return node.type === 'BinaryExpression' && node.operator === '+';
  }

  private hasCommonFactor(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression' || node.operator !== '+') return false;

    const leftCoeff = this.extractCoefficient(node.left);
    const rightCoeff = this.extractCoefficient(node.right);

    if (leftCoeff === null || rightCoeff === null) return false;

    return this.gcd(Math.abs(leftCoeff), Math.abs(rightCoeff)) > 1;
  }

  private extractCoefficient(node: ASTNode): number | null {
    switch (node.type) {
      case 'NumberLiteral':
        return node.value;

      case 'BinaryExpression':
        if (node.operator === '*') {
          if (node.left.type === 'NumberLiteral') {
            return node.left.value;
          }
          if (node.right.type === 'NumberLiteral') {
            return node.right.value;
          }
        }
        return 1;

      case 'Identifier':
        return 1;

      default:
        return null;
    }
  }

  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  private nodeToString(node: ASTNode): string {
    switch (node.type) {
      case 'NumberLiteral':
        return node.value.toString();
      case 'Identifier':
        return node.name;
      case 'BinaryExpression':
        return `(${this.nodeToString(node.left)} ${node.operator} ${this.nodeToString(node.right)})`;
      default:
        return 'unknown';
    }
  }
}
