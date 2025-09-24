/**
 * Berlekamp-Zassenhaus Strategy
 * Advanced polynomial factorization strategy using BZ algorithm
 */

import { berlekampZassenhausFactor } from './berlekamp-zassenhaus/index';
import { ASTNode } from '../../../types';
import { astToLatex } from '../../ast';
import { basicSimplify } from '../../simplify/basic-simplify';
import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

/**
 * Berlekamp-Zassenhaus factorization strategy
 * Used for high-degree polynomials that can't be factored by basic patterns
 */
export class BerlekampZassenhausStrategy implements FactorizationStrategy {
  name = 'berlekamp-zassenhaus';
  priority = 10; // Lower priority - try after basic patterns
  description = 'Advanced polynomial factorization using Berlekamp-Zassenhaus algorithm';

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // Don't apply to already factored expressions (containing multiplications)
    if (this.containsMultiplication(node)) {
      return false;
    }

    // Apply to any polynomial that other strategies couldn't handle
    if (!this.isPolynomial(node, context.variable)) {
      return false;
    }

    const degree = this.getPolynomialDegree(node, context.variable);

    // Use BZ for any polynomial of degree >= 2, or if other strategies have been tried
    return (degree >= 2 && degree <= 8) || context.currentIteration > 1;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];
    try {
      const originalLatex = astToLatex(node);
      steps.push(`[DEBUG] originalLatex: ${originalLatex}`);

      // Apply Berlekamp-Zassenhaus algorithm
      const factors = berlekampZassenhausFactor(node, context.variable, {}, steps);
      steps.push(`[DEBUG] raw factors count: ${factors ? factors.length : 'null'}`);
      if (factors) {
        steps.push(`[DEBUG] raw factors LaTeX: ${factors.map(astToLatex).join(' | ')}`);
      }

      if (!factors || factors.length <= 1) {
        // No factorization found or polynomial is irreducible
        steps.push('Berlekamp-Zassenhaus: Polynomial appears to be irreducible over the integers');
        return {
          success: false,
          ast: node,
          changed: false,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Construct factored expression from factors
      const factoredExpression = this.constructFactoredExpression(factors);
      steps.push(`[DEBUG] factoredExpression LaTeX: ${astToLatex(factoredExpression)}`);

      // Apply basic simplification to normalize expressions like (x - -1) → (x + 1)
      const simplifiedExpression = basicSimplify(factoredExpression);
      const factoredLatex = astToLatex(simplifiedExpression);
      steps.push(`[DEBUG] simplifiedExpression LaTeX: ${factoredLatex}`);

      if (factoredLatex === originalLatex) {
        // No change achieved
        steps.push('Berlekamp-Zassenhaus: No further factorization possible');
        return {
          success: false,
          ast: node,
          changed: false,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      steps.push('Applied Berlekamp-Zassenhaus algorithm');
      steps.push(`Factored into ${factors.length} irreducible factors`);
      steps.push(`Result: ${factoredLatex}`);
      return {
        success: true,
        ast: simplifiedExpression,
        changed: true,
        steps,
        strategyUsed: this.name,
        canContinue: true,
      };
    } catch (error) {
      steps.push(
        `Berlekamp-Zassenhaus failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        success: false,
        ast: node,
        changed: false,
        steps,
        strategyUsed: this.name,
        canContinue: false,
      };
    }
  }

  /**
   * Check if node represents a polynomial in the given variable
   */
  private isPolynomial(node: ASTNode, variable: string): boolean {
    switch (node.type) {
      case 'NumberLiteral':
        return true;
      case 'Identifier':
        return node.name === variable || this.isConstant(node.name);
      case 'BinaryExpression': {
        const { operator, left, right } = node;
        switch (operator) {
          case '+':
          case '-':
          case '*':
            return this.isPolynomial(left, variable) && this.isPolynomial(right, variable);
          case '^':
            return (
              this.isPolynomial(left, variable) &&
              right.type === 'NumberLiteral' &&
              Number.isInteger(right.value) &&
              right.value >= 0
            );
          default:
            return false;
        }
      }
      default:
        return false;
    }
  }

  /**
   * Check if identifier represents a constant
   */
  private isConstant(name: string): boolean {
    return name.length === 1 && !['x', 'y', 'z'].includes(name.toLowerCase());
  }

  /**
   * Get polynomial degree (simplified estimation)
   */
  private getPolynomialDegree(node: ASTNode, variable: string): number {
    switch (node.type) {
      case 'NumberLiteral':
        return 0;
      case 'Identifier':
        return node.name === variable ? 1 : 0;
      case 'BinaryExpression': {
        const { operator, left, right } = node;
        switch (operator) {
          case '+':
          case '-':
            return Math.max(
              this.getPolynomialDegree(left, variable),
              this.getPolynomialDegree(right, variable)
            );
          case '*':
            return (
              this.getPolynomialDegree(left, variable) + this.getPolynomialDegree(right, variable)
            );
          case '^':
            if (
              left.type === 'Identifier' &&
              left.name === variable &&
              right.type === 'NumberLiteral'
            ) {
              return right.value;
            }
            return this.getPolynomialDegree(left, variable);
          default:
            return 0;
        }
      }
      default:
        return 0;
    }
  }

  /**
   * Construct factored expression from factor array
   */
  private constructFactoredExpression(factors: ASTNode[]): ASTNode {
    if (factors.length === 0) {
      return { type: 'NumberLiteral', value: 1 };
    }

    if (factors.length === 1) {
      return factors[0]!;
    }

    // Multiply all factors together
    let result = factors[0]!;
    for (let i = 1; i < factors.length; i++) {
      result = {
        type: 'BinaryExpression',
        operator: '*',
        left: result,
        right: factors[i]!,
      };
    }

    return result;
  }

  /**
   * Check if node contains multiplication (indicating it's already factored)
   */
  private containsMultiplication(node: ASTNode): boolean {
    switch (node.type) {
      case 'BinaryExpression':
        if (node.operator === '*') {
          return true;
        }
        return this.containsMultiplication(node.left) || this.containsMultiplication(node.right);
      default:
        return false;
    }
  }
}
