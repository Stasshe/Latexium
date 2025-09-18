import { ASTNode, BinaryExpression } from '../../../types/ast';
import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';
import { PolynomialAnalyzer, ASTBuilder } from '../framework';

/**
 * Strategy for factoring out common factors
 * Examples: 6x + 9 → 3(2x + 3), x²y + xy² → xy(x + y)
 */
export class CommonFactorStrategy implements FactorizationStrategy {
  name = 'Common Factor';
  description = 'Extract greatest common factors from polynomial terms';
  priority = 100; // High priority - should be tried first

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const terms = PolynomialAnalyzer.extractTerms(node);
    return terms.length >= 2 && this.hasCommonFactors(terms);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];
    const terms = PolynomialAnalyzer.extractTerms(node);

    steps.push(`Analyzing ${terms.length} terms for common factors`);

    // Extract coefficients and find GCD
    const coefficients = terms.map(term => Math.abs(term.coefficient * term.sign));
    const numericGCD = PolynomialAnalyzer.findGCD(coefficients);

    // Find common variable factors
    const commonVariables = PolynomialAnalyzer.findCommonVariableFactors(terms);

    steps.push(`Numeric GCD: ${numericGCD}`);
    if (commonVariables.size > 0) {
      const varFactors = Array.from(commonVariables.entries())
        .map(([var_, power]) => (power === 1 ? var_ : `${var_}^${power}`))
        .join('');
      steps.push(`Common variable factors: ${varFactors}`);
    }

    // Check if we have meaningful common factors
    if (numericGCD === 1 && commonVariables.size === 0) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: ['No common factors found'],
        strategyUsed: this.name,
        canContinue: true,
      };
    }

    // Build the factored form
    const factorParts: ASTNode[] = [];

    // Add numeric factor if > 1
    if (numericGCD > 1) {
      factorParts.push(ASTBuilder.number(numericGCD));
    }

    // Add variable factors
    for (const [variable, power] of commonVariables) {
      if (power === 1) {
        factorParts.push(ASTBuilder.variable(variable));
      } else {
        factorParts.push(
          ASTBuilder.binary('^', ASTBuilder.variable(variable), ASTBuilder.number(power))
        );
      }
    }

    // Build remaining terms after factoring out common factors
    const remainingTerms: ASTNode[] = [];

    for (const term of terms) {
      const newCoeff = (term.coefficient * term.sign) / numericGCD;
      const newVariables = new Map(term.variables);

      // Remove common variable factors
      for (const [variable, commonPower] of commonVariables) {
        const termPower = newVariables.get(variable) || 0;
        const remainingPower = termPower - commonPower;
        if (remainingPower > 0) {
          newVariables.set(variable, remainingPower);
        } else {
          newVariables.delete(variable);
        }
      }

      // Build the remaining term
      let termNode: ASTNode;

      if (Math.abs(newCoeff) === 1 && newVariables.size === 0) {
        // Just 1 or -1
        termNode = ASTBuilder.number(newCoeff);
      } else {
        const parts: ASTNode[] = [];

        if (Math.abs(newCoeff) !== 1) {
          parts.push(ASTBuilder.number(Math.abs(newCoeff)));
        }

        for (const [variable, power] of newVariables) {
          if (power === 1) {
            parts.push(ASTBuilder.variable(variable));
          } else {
            parts.push(
              ASTBuilder.binary('^', ASTBuilder.variable(variable), ASTBuilder.number(power))
            );
          }
        }

        if (parts.length === 0) {
          termNode = ASTBuilder.number(Math.abs(newCoeff));
        } else if (parts.length === 1 && parts[0]) {
          termNode = parts[0];
          if (Math.abs(newCoeff) !== 1) {
            termNode = ASTBuilder.binary('*', ASTBuilder.number(Math.abs(newCoeff)), termNode);
          }
        } else {
          termNode = parts.reduce((acc, part) => ASTBuilder.binary('*', acc, part));
          if (Math.abs(newCoeff) !== 1) {
            termNode = ASTBuilder.binary('*', ASTBuilder.number(Math.abs(newCoeff)), termNode);
          }
        }

        if (newCoeff < 0) {
          termNode = { type: 'UnaryExpression', operator: '-', operand: termNode };
        }
      }

      remainingTerms.push(termNode);
    }

    // Combine remaining terms
    let remainingExpression: ASTNode;
    if (remainingTerms.length === 1 && remainingTerms[0]) {
      remainingExpression = remainingTerms[0];
    } else {
      remainingExpression = remainingTerms.reduce((acc, term) => ASTBuilder.binary('+', acc, term));
    }

    // Build the final factored expression
    let commonFactor: ASTNode;
    if (factorParts.length === 1 && factorParts[0]) {
      commonFactor = factorParts[0];
    } else {
      commonFactor = factorParts.reduce((acc, part) => ASTBuilder.binary('*', acc, part));
    }

    const result = ASTBuilder.binary('*', commonFactor, remainingExpression);

    steps.push(`Factored form: common factor times remaining expression`);

    return {
      success: true,
      ast: result,
      changed: true,
      steps,
      strategyUsed: this.name,
      canContinue: true,
    };
  }

  private hasCommonFactors(
    terms: Array<{ coefficient: number; variables: Map<string, number>; sign: number }>
  ): boolean {
    // Check for numeric GCD > 1
    const coefficients = terms.map(term => Math.abs(term.coefficient * term.sign));
    if (PolynomialAnalyzer.findGCD(coefficients) > 1) {
      return true;
    }

    // Check for common variables
    const commonVariables = PolynomialAnalyzer.findCommonVariableFactors(terms);
    return commonVariables.size > 0;
  }
}
