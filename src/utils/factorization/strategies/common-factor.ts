import { simplify as middleSimplify } from '../../middle-simplify';
import { FactorizationStrategy, FactorizationResult, FactorizationContext } from '../framework';
import { PolynomialAnalyzer, ASTBuilder } from '../framework';

import { ASTNode, StepTree } from '@/types/ast';

/**
 * Strategy for factoring out common factors
 * Examples: 6x + 9 → 3(2x + 3), x²y + xy² → xy(x + y)
 */
export class CommonFactorStrategy implements FactorizationStrategy {
  name = 'Common Factor';
  description = 'Extract greatest common factors from polynomial terms';
  priority = 150; // High priority - should be tried first

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const terms = PolynomialAnalyzer.extractTerms(node);
    return terms.length >= 2 && this.hasCommonFactors(terms);
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: StepTree[] = [];
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

    // Build the factored form (AST for numeric and variable factors)
    const factorParts: ASTNode[] = [];
    if (numericGCD > 1) {
      factorParts.push(ASTBuilder.number(numericGCD));
    }
    for (const [variable, power] of commonVariables) {
      if (power === 1) {
        factorParts.push(ASTBuilder.variable(variable));
      } else {
        factorParts.push(
          ASTBuilder.binary('^', ASTBuilder.variable(variable), ASTBuilder.number(power))
        );
      }
    }

    // Build the common factor AST (product of all factorParts, or 1 if none)
    let commonFactor: ASTNode;
    if (factorParts.length === 0) {
      commonFactor = ASTBuilder.number(1);
    } else if (factorParts.length === 1) {
      commonFactor = factorParts[0]!;
    } else {
      commonFactor = factorParts.reduce((acc, part) => ASTBuilder.binary('*', acc, part));
    }

    // 分数を使わず、各項の係数・変数から共通因子を引いた差分で再構成
    const remainingTerms: ASTNode[] = [];
    for (const term of terms) {
      const coeff = term.coefficient * term.sign;
      let newCoeff = coeff;
      if (numericGCD > 1) newCoeff = coeff / numericGCD;
      const newVars = new Map(term.variables);
      for (const [v, pow] of commonVariables) {
        const tPow = newVars.get(v) || 0;
        const restPow = tPow - pow;
        if (restPow > 0) newVars.set(v, restPow);
        else newVars.delete(v);
      }
      // 残りの項を再構成
      let node: ASTNode | null = null;
      if (newCoeff === 0) {
        node = ASTBuilder.number(0);
      } else {
        const parts: ASTNode[] = [];
        if (Math.abs(newCoeff) !== 1 || newVars.size === 0) parts.push(ASTBuilder.number(newCoeff));
        for (const [v, pow] of newVars) {
          if (pow === 1) parts.push(ASTBuilder.variable(v));
          else parts.push(ASTBuilder.binary('^', ASTBuilder.variable(v), ASTBuilder.number(pow)));
        }
        if (parts.length === 0) node = ASTBuilder.number(1);
        else if (parts.length === 1) node = parts[0]!;
        else node = parts.reduce((acc, p) => ASTBuilder.binary('*', acc, p));
      }
      remainingTerms.push(node!);
    }
    // 和としてまとめてmiddle-simplify
    let remainingExpression: ASTNode;
    if (remainingTerms.length === 1) remainingExpression = remainingTerms[0]!;
    else remainingExpression = remainingTerms.reduce((acc, t) => ASTBuilder.binary('+', acc, t));
    remainingExpression = middleSimplify(remainingExpression);

    // Build the final factored expression
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
