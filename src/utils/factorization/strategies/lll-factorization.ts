/**
 * LLL Factorization Strategy
 * Advanced polynomial factorization strategy using LLL algorithm
 */

import { ASTNode } from '../../../types';
import { astToLatex } from '../../ast';
import { lllFactor } from '../../lll-factorization';
import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

/**
 * LLL factorization strategy
 * Used for high-degree polynomials and complex factorization cases
 */
export class LLLFactorizationStrategy implements FactorizationStrategy {
  name = 'lll-factorization';
  priority = 5; // Higher priority than BZ for complex cases
  description = 'Advanced polynomial factorization using LLL lattice basis reduction';

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // Apply to polynomials that other strategies couldn't handle
    if (!this.isPolynomial(node, context.variable)) {
      return false;
    }

    const degree = this.getPolynomialDegree(node, context.variable);

    // Use LLL for higher degree polynomials or when other strategies have been tried
    return degree >= 3 || context.currentIteration > 1;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    try {
      const originalLatex = astToLatex(node);

      // Apply LLL algorithm
      const factors = lllFactor(node, context.variable);

      if (!factors || factors.length <= 1) {
        // No factorization found or polynomial is irreducible
        return {
          success: false,
          ast: node,
          changed: false,
          steps: [`LLL: Polynomial appears to be irreducible or too complex`],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Construct factored expression from factors
      const factoredExpression = this.constructFactoredExpression(factors);
      const factoredLatex = astToLatex(factoredExpression);

      if (factoredLatex === originalLatex) {
        // No change achieved
        return {
          success: false,
          ast: node,
          changed: false,
          steps: [`LLL: No further factorization possible`],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      return {
        success: true,
        ast: factoredExpression,
        changed: true,
        steps: [
          `Applied LLL factorization algorithm`,
          `Factored into ${factors.length} factors`,
          `Result: ${factoredLatex}`,
        ],
        strategyUsed: this.name,
        canContinue: true,
      };
    } catch (error) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [`LLL failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
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
}
