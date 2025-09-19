/**
 * Quartic Substitution Strategy
 * Factors quartic polynomials that can be treated as quadratics in x^2
 * Example: x^4 - 13x^2 + 36 = (x^2)^2 - 13(x^2) + 36 = (x^2 - 4)(x^2 - 9)
 */

import { ASTNode, BinaryExpression, Identifier, NumberLiteral } from '../../../types/ast';
import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';

export class QuarticSubstitutionStrategy implements FactorizationStrategy {
  name = 'quartic-substitution';
  description = 'Factors quartic polynomials that can be treated as quadratics in x^2';
  priority = 85; // Higher than common factor, lower than difference of squares

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // Check if this is a polynomial of the form ax^4 + bx^2 + c
    if (!this.isQuarticInX2Form(node, context.variable)) {
      return false;
    }

    // Extract coefficients
    const coeffs = this.extractQuarticCoefficients(node, context.variable);
    if (!coeffs) {
      return false;
    }

    // Check if it can be factored as a quadratic in x^2
    return this.canFactorAsQuadratic(coeffs.a, coeffs.b, coeffs.c);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const coeffs = this.extractQuarticCoefficients(node, context.variable);
    if (!coeffs) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }

    // Solve the quadratic equation at^2 + bt + c = 0 where t = x^2
    const quadraticRoots = this.solveQuadratic(coeffs.a, coeffs.b, coeffs.c);
    if (
      !quadraticRoots ||
      quadraticRoots.length !== 2 ||
      quadraticRoots[0] === undefined ||
      quadraticRoots[1] === undefined
    ) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [],
        strategyUsed: this.name,
        canContinue: false,
      };
    }

    // Build factors (x^2 - root1)(x^2 - root2) or similar
    const root1 = quadraticRoots[0];
    const root2 = quadraticRoots[1];
    const factor1 = this.buildQuadraticFactor(root1, context.variable, coeffs.a);
    const factor2 = this.buildQuadraticFactor(root2, context.variable, coeffs.a);

    // Create the factored form
    const factored: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '*',
      left: factor1,
      right: factor2,
    };

    return {
      success: true,
      ast: factored,
      changed: true,
      steps: [`Applied quartic substitution: treated as quadratic in ${context.variable}^2`],
      strategyUsed: this.name,
      canContinue: false,
    };
  }

  private isQuarticInX2Form(node: ASTNode, variable: string): boolean {
    // Must be a polynomial with only even powers of the variable (x^4, x^2, constant)
    return this.hasOnlyEvenPowers(node, variable) && this.getHighestPower(node, variable) === 4;
  }

  private hasOnlyEvenPowers(node: ASTNode, variable: string): boolean {
    if (node.type === 'NumberLiteral') {
      return true; // Constants are allowed
    }

    if (node.type === 'Identifier') {
      return node.name !== variable; // Variables other than our target are ok as constants
    }

    if (node.type === 'BinaryExpression') {
      const expr = node as BinaryExpression;

      if (expr.operator === '^') {
        // Check if this is variable^n where n is even
        if (
          expr.left.type === 'Identifier' &&
          expr.left.name === variable &&
          expr.right.type === 'NumberLiteral'
        ) {
          const power = expr.right.value;
          return power % 2 === 0; // Only even powers
        }
        return true; // Other powers (like constants^n) are ok
      }

      if (expr.operator === '*') {
        // For multiplication, check both sides
        return (
          this.hasOnlyEvenPowers(expr.left, variable) &&
          this.hasOnlyEvenPowers(expr.right, variable)
        );
      }

      if (expr.operator === '+' || expr.operator === '-') {
        // For addition/subtraction, both sides must have only even powers
        return (
          this.hasOnlyEvenPowers(expr.left, variable) &&
          this.hasOnlyEvenPowers(expr.right, variable)
        );
      }
    }

    return true; // Other node types are assumed to be constants
  }

  private getHighestPower(node: ASTNode, variable: string): number {
    if (node.type === 'NumberLiteral') {
      return 0;
    }

    if (node.type === 'Identifier') {
      return node.name === variable ? 1 : 0;
    }

    if (node.type === 'BinaryExpression') {
      const expr = node as BinaryExpression;

      if (expr.operator === '^') {
        if (
          expr.left.type === 'Identifier' &&
          expr.left.name === variable &&
          expr.right.type === 'NumberLiteral'
        ) {
          return expr.right.value;
        }
      }

      if (expr.operator === '*') {
        return Math.max(
          this.getHighestPower(expr.left, variable),
          this.getHighestPower(expr.right, variable)
        );
      }

      if (expr.operator === '+' || expr.operator === '-') {
        return Math.max(
          this.getHighestPower(expr.left, variable),
          this.getHighestPower(expr.right, variable)
        );
      }
    }

    return 0;
  }

  private extractQuarticCoefficients(
    node: ASTNode,
    variable: string
  ): { a: number; b: number; c: number } | null {
    // Extract coefficients from ax^4 + bx^2 + c form
    const terms = this.extractTerms(node);
    let a = 0,
      b = 0,
      c = 0;

    for (const term of terms) {
      const { coefficient, power } = this.analyzeTerm(term, variable);

      if (power === 4) {
        a += coefficient;
      } else if (power === 2) {
        b += coefficient;
      } else if (power === 0) {
        c += coefficient;
      }
    }

    return { a, b, c };
  }

  private extractTerms(node: ASTNode): ASTNode[] {
    // Extract individual terms from a sum/difference
    if (node.type === 'BinaryExpression') {
      const expr = node as BinaryExpression;
      if (expr.operator === '+') {
        return [...this.extractTerms(expr.left), ...this.extractTerms(expr.right)];
      } else if (expr.operator === '-') {
        const leftTerms = this.extractTerms(expr.left);
        const rightTerms = this.extractTerms(expr.right);
        // Negate the right terms
        return [...leftTerms, ...rightTerms.map(term => this.negateTerm(term))];
      }
    }
    return [node];
  }

  private negateTerm(term: ASTNode): ASTNode {
    // Create -term
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: -1 },
      right: term,
    } as BinaryExpression;
  }

  private analyzeTerm(term: ASTNode, variable: string): { coefficient: number; power: number } {
    if (term.type === 'NumberLiteral') {
      return { coefficient: term.value, power: 0 };
    }

    if (term.type === 'Identifier') {
      if (term.name === variable) {
        return { coefficient: 1, power: 1 };
      }
      return { coefficient: 1, power: 0 }; // Other variables treated as constants
    }

    if (term.type === 'BinaryExpression') {
      const expr = term as BinaryExpression;

      if (expr.operator === '^') {
        if (
          expr.left.type === 'Identifier' &&
          expr.left.name === variable &&
          expr.right.type === 'NumberLiteral'
        ) {
          return { coefficient: 1, power: expr.right.value };
        }
      }

      if (expr.operator === '*') {
        // Handle coefficient * variable^power
        const leftAnalysis = this.analyzeTerm(expr.left, variable);
        const rightAnalysis = this.analyzeTerm(expr.right, variable);

        return {
          coefficient: leftAnalysis.coefficient * rightAnalysis.coefficient,
          power: leftAnalysis.power + rightAnalysis.power,
        };
      }
    }

    return { coefficient: 1, power: 0 };
  }

  private canFactorAsQuadratic(a: number, b: number, c: number): boolean {
    // Check if the discriminant is a perfect square
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return false;
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    return Number.isInteger(sqrtDiscriminant);
  }

  private solveQuadratic(a: number, b: number, c: number): number[] | null {
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return null;
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);

    return [root1, root2];
  }

  private buildQuadraticFactor(root: number, variable: string, leadingCoeff: number): ASTNode {
    // Build factor of the form (x^2 - root) or (ax^2 - root*a)
    const variableSquared: BinaryExpression = {
      type: 'BinaryExpression',
      operator: '^',
      left: {
        type: 'Identifier',
        name: variable,
        scope: 'free',
        uniqueId: `free_${variable}`,
      } as Identifier,
      right: { type: 'NumberLiteral', value: 2 } as NumberLiteral,
    };

    // If leading coefficient is not 1, include it
    let leftSide: ASTNode = variableSquared;
    if (leadingCoeff !== 1) {
      leftSide = {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'NumberLiteral', value: leadingCoeff } as NumberLiteral,
        right: variableSquared,
      } as BinaryExpression;
    }

    if (root === 0) {
      return leftSide;
    }

    const operator = root > 0 ? '-' : '+';
    const absoluteRoot = Math.abs(root * leadingCoeff);

    return {
      type: 'BinaryExpression',
      operator,
      left: leftSide,
      right: { type: 'NumberLiteral', value: absoluteRoot } as NumberLiteral,
    } as BinaryExpression;
  }
}
