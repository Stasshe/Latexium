import { ASTNode } from '../../../types/ast';
import { basicSimplify } from '../../simplify/basic-simplify';
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

        // Add coefficient first (if not 1)
        if (Math.abs(newCoeff) !== 1) {
          parts.push(ASTBuilder.number(Math.abs(newCoeff)));
        }

        // Add variables
        for (const [variable, power] of newVariables) {
          if (power === 1) {
            parts.push(ASTBuilder.variable(variable));
          } else {
            parts.push(
              ASTBuilder.binary('^', ASTBuilder.variable(variable), ASTBuilder.number(power))
            );
          }
        }

        // Build the term node
        if (parts.length === 0) {
          termNode = ASTBuilder.number(Math.abs(newCoeff));
        } else if (parts.length === 1 && parts[0]) {
          termNode = parts[0];
        } else if (parts.length > 1) {
          // Filter out any undefined values and reduce
          const validParts = parts.filter((part): part is ASTNode => part !== undefined);
          if (validParts.length === 0) {
            termNode = ASTBuilder.number(Math.abs(newCoeff));
          } else if (validParts.length === 1) {
            termNode = validParts[0]!; // Safe assertion after filter
          } else {
            termNode = validParts.reduce((acc, part) => ASTBuilder.binary('*', acc, part));
          }
        } else {
          termNode = ASTBuilder.number(Math.abs(newCoeff));
        }

        // Apply negative sign if needed - use subtraction instead of UnaryExpression
        if (newCoeff < 0) {
          // Instead of creating UnaryExpression, create a proper subtraction when combining terms
          // This will be handled later in the term combination phase
          termNode = ASTBuilder.number(newCoeff); // Keep the negative number as-is for now
        }
      }

      remainingTerms.push(termNode);
    }

    // Combine remaining terms
    let remainingExpression: ASTNode;
    if (remainingTerms.length === 1 && remainingTerms[0]) {
      remainingExpression = remainingTerms[0];
    } else if (remainingTerms.length > 1) {
      const validTerms = remainingTerms.filter((term): term is ASTNode => term !== undefined);
      if (validTerms.length === 0) {
        remainingExpression = ASTBuilder.number(1);
      } else if (validTerms.length === 1) {
        remainingExpression = validTerms[0]!; // Safe assertion after filter
      } else {
        remainingExpression = validTerms.reduce((acc, term) => ASTBuilder.binary('+', acc, term));
      }
    } else {
      remainingExpression = ASTBuilder.number(1);
    }

    // Apply basic simplification to clean up the remaining expression
    remainingExpression = basicSimplify(remainingExpression);

    // Build the final factored expression
    let commonFactor: ASTNode;
    if (factorParts.length === 1 && factorParts[0]) {
      commonFactor = factorParts[0];
    } else if (factorParts.length > 1) {
      const validFactors = factorParts.filter((part): part is ASTNode => part !== undefined);
      if (validFactors.length === 0) {
        commonFactor = ASTBuilder.number(1);
      } else if (validFactors.length === 1) {
        commonFactor = validFactors[0]!;
      } else {
        commonFactor = validFactors.reduce((acc, part) => ASTBuilder.binary('*', acc, part));
      }
    } else {
      commonFactor = ASTBuilder.number(1);
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
