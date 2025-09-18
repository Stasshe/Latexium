/**
 * Factorization by Grouping Strategy
 * Factors polynomials by grouping terms with common factors
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
import { CommonFactorStrategy } from './common-factor';

export class GroupingStrategy implements FactorizationStrategy {
  name = 'Factorization by Grouping';
  description = 'Factor polynomials by grouping terms and extracting common factors';
  priority = 70;

  private commonFactorStrategy = new CommonFactorStrategy();

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const terms = this.extractTerms(node);
    return terms.length >= 4; // Grouping typically works with 4+ terms
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      const terms = this.extractTerms(node);

      if (terms.length < 4) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Need at least 4 terms for grouping'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      steps.push(
        `Found ${terms.length} terms: ${terms.map(t => `${t.sign > 0 ? '+' : '-'}${astToLatex(t.term)}`).join(' ')}`
      );

      // Try different grouping patterns
      const groupingPatterns = this.generateGroupingPatterns(terms.length);

      for (let i = 0; i < groupingPatterns.length; i++) {
        const pattern = groupingPatterns[i]!;
        steps.push(
          `Trying grouping pattern ${i + 1}: ${pattern.map(g => `(${g.join(', ')})`).join(' + ')}`
        );

        const result = this.tryGroupingPattern(terms, pattern, context, steps);
        if (result) {
          return {
            success: true,
            ast: result,
            changed: true,
            steps,
            strategyUsed: this.name,
            canContinue: true,
          };
        }
      }

      return {
        success: true,
        ast: node,
        changed: false,
        steps: [...steps, 'No successful grouping pattern found'],
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
   * Extract all terms from expression
   */
  private extractTerms(node: ASTNode): Array<{ term: ASTNode; sign: number }> {
    const terms: Array<{ term: ASTNode; sign: number }> = [];

    const extractRecursive = (n: ASTNode, currentSign: number): void => {
      if (n.type === 'BinaryExpression') {
        if (n.operator === '+') {
          extractRecursive(n.left, currentSign);
          extractRecursive(n.right, currentSign);
        } else if (n.operator === '-') {
          extractRecursive(n.left, currentSign);
          extractRecursive(n.right, -currentSign);
        } else {
          terms.push({ term: n, sign: currentSign });
        }
      } else {
        terms.push({ term: n, sign: currentSign });
      }
    };

    extractRecursive(node, 1);
    return terms;
  }

  /**
   * Generate different grouping patterns for n terms
   */
  private generateGroupingPatterns(n: number): number[][][] {
    const patterns: number[][][] = [];

    if (n === 4) {
      // For 4 terms, try common grouping patterns
      patterns.push([
        [0, 1],
        [2, 3], // (term1 + term2) + (term3 + term4)
      ]);
      patterns.push([
        [0, 2],
        [1, 3], // (term1 + term3) + (term2 + term4)
      ]);
      patterns.push([
        [0, 3],
        [1, 2], // (term1 + term4) + (term2 + term3)
      ]);
    } else if (n === 6) {
      // For 6 terms, try grouping in pairs of 3
      patterns.push([
        [0, 1, 2],
        [3, 4, 5],
      ]);
      patterns.push([
        [0, 2, 4],
        [1, 3, 5],
      ]);
      patterns.push([
        [0, 1],
        [2, 3],
        [4, 5],
      ]);
    } else {
      // For other cases, try grouping in halves
      const mid = Math.floor(n / 2);
      const firstHalf = Array.from({ length: mid }, (_, i) => i);
      const secondHalf = Array.from({ length: n - mid }, (_, i) => i + mid);
      patterns.push([firstHalf, secondHalf]);
    }

    return patterns;
  }

  /**
   * Try a specific grouping pattern
   */
  private tryGroupingPattern(
    terms: Array<{ term: ASTNode; sign: number }>,
    pattern: number[][],
    context: FactorizationContext,
    steps: string[]
  ): ASTNode | null {
    const groups: ASTNode[] = [];
    const groupFactors: ASTNode[] = [];

    // Factor each group
    for (let i = 0; i < pattern.length; i++) {
      const groupIndices = pattern[i]!;
      const groupTerms = groupIndices.map(idx => terms[idx]!);

      steps.push(
        `Group ${i + 1}: ${groupTerms.map(t => `${t.sign > 0 ? '+' : '-'}${astToLatex(t.term)}`).join(' ')}`
      );

      // Build expression for this group
      const groupExpression = this.buildExpression(groupTerms);

      // Try to factor out common factors from this group
      const factorResult = this.commonFactorStrategy.apply(groupExpression, context);

      if (factorResult.success && factorResult.changed) {
        // Extract the common factor and remaining expression
        const { commonFactor, remaining } = this.extractFactorAndRemainder(factorResult.ast);

        if (commonFactor && remaining) {
          groups.push(remaining);
          groupFactors.push(commonFactor);
          steps.push(
            `Factored group ${i + 1}: ${astToLatex(commonFactor)} * (${astToLatex(remaining)})`
          );
        } else {
          groups.push(groupExpression);
          groupFactors.push(ASTBuilder.number(1));
        }
      } else {
        groups.push(groupExpression);
        groupFactors.push(ASTBuilder.number(1));
      }
    }

    // Check if all groups have the same remaining factor
    if (groups.length < 2) {
      return null;
    }

    const firstGroup = groups[0]!;
    const allGroupsSame = groups.every(group => this.areEquivalentExpressions(group, firstGroup));

    if (!allGroupsSame) {
      steps.push('Groups do not have common factors after factoring');
      return null;
    }

    steps.push(`All groups have common factor: ${astToLatex(firstGroup)}`);

    // Build the final factored form
    let coefficientSum = groupFactors[0]!;
    for (let i = 1; i < groupFactors.length; i++) {
      coefficientSum = ASTBuilder.add(coefficientSum, groupFactors[i]!);
    }

    const result = ASTBuilder.multiply(coefficientSum, firstGroup);
    steps.push(`Final result: (${astToLatex(coefficientSum)}) * (${astToLatex(firstGroup)})`);

    return result;
  }

  /**
   * Extract common factor and remainder from factored expression
   */
  private extractFactorAndRemainder(node: ASTNode): {
    commonFactor: ASTNode | null;
    remaining: ASTNode | null;
  } {
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      // Assume left side is the factor, right side is the remainder
      return {
        commonFactor: node.left,
        remaining: node.right,
      };
    }

    return {
      commonFactor: null,
      remaining: node,
    };
  }

  /**
   * Build expression from terms with signs
   */
  private buildExpression(terms: Array<{ term: ASTNode; sign: number }>): ASTNode {
    if (terms.length === 0) {
      return ASTBuilder.number(0);
    }

    if (terms.length === 1) {
      const { term, sign } = terms[0]!;
      return sign === 1 ? term : ASTBuilder.multiply(ASTBuilder.number(-1), term);
    }

    let result =
      terms[0]!.sign === 1
        ? terms[0]!.term
        : ASTBuilder.multiply(ASTBuilder.number(-1), terms[0]!.term);

    for (let i = 1; i < terms.length; i++) {
      const { term, sign } = terms[i]!;
      if (sign === 1) {
        result = ASTBuilder.add(result, term);
      } else {
        result = ASTBuilder.subtract(result, term);
      }
    }

    return result;
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

        // Check direct match
        if (
          left.operator === rightBinary.operator &&
          this.areEquivalentExpressions(left.left, rightBinary.left) &&
          this.areEquivalentExpressions(left.right, rightBinary.right)
        ) {
          return true;
        }

        // Check commutative operations (+ and *)
        if (
          (left.operator === '+' || left.operator === '*') &&
          left.operator === rightBinary.operator &&
          this.areEquivalentExpressions(left.left, rightBinary.right) &&
          this.areEquivalentExpressions(left.right, rightBinary.left)
        ) {
          return true;
        }

        return false;
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
