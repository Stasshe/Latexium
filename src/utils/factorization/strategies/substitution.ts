/**
 * Substitution Strategy for Factorization
 * Handles quartic polynomials that can be treated as quadratics through substitution
 */

import { ASTNode } from '../../../types';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  PolynomialAnalyzer,
  ASTBuilder,
} from '../framework';

export class SubstitutionStrategy implements FactorizationStrategy {
  name = 'Substitution';
  description = 'Factor quartic expressions by substitution (u = x²)';
  priority = 70;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);

    // Check if it's a quartic polynomial
    if (!poly || poly.degree !== 4 || !poly.isUnivariate) {
      return false;
    }

    // Check if it has the form ax⁴ + bx² + c (only even powers)
    const hasX3 = poly.coefficients.has(3) && (poly.coefficients.get(3) || 0) !== 0;
    const hasX1 = poly.coefficients.has(1) && (poly.coefficients.get(1) || 0) !== 0;

    return !hasX3 && !hasX1; // No x³ or x terms
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);

      if (!poly || poly.degree !== 4) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Not a quartic polynomial'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      const a = poly.coefficients.get(4) || 0; // coefficient of x⁴
      const b = poly.coefficients.get(2) || 0; // coefficient of x²
      const c = poly.coefficients.get(0) || 0; // constant term

      steps.push(`Quartic form: ${a}${context.variable}⁴ + ${b}${context.variable}² + ${c}`);
      steps.push(`Substituting u = ${context.variable}² gives: ${a}u² + ${b}u + ${c}`);

      // Solve the quadratic in u
      const discriminant = b * b - 4 * a * c;

      if (discriminant < 0) {
        steps.push('No real factors (negative discriminant)');
        return {
          success: true,
          ast: node,
          changed: false,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      const sqrt_discriminant = Math.sqrt(discriminant);
      const u1 = (-b + sqrt_discriminant) / (2 * a);
      const u2 = (-b - sqrt_discriminant) / (2 * a);

      steps.push(`Quadratic factors: (u - ${u1})(u - ${u2})`);
      steps.push(`Substituting back: (${context.variable}² - ${u1})(${context.variable}² - ${u2})`);

      // Build the factored form
      const factor1 = ASTBuilder.subtract(
        ASTBuilder.power(ASTBuilder.variable(context.variable), ASTBuilder.number(2)),
        ASTBuilder.number(u1)
      );

      const factor2 = ASTBuilder.subtract(
        ASTBuilder.power(ASTBuilder.variable(context.variable), ASTBuilder.number(2)),
        ASTBuilder.number(u2)
      );

      const result =
        a === 1
          ? ASTBuilder.multiply(factor1, factor2)
          : ASTBuilder.multiply(ASTBuilder.number(a), ASTBuilder.multiply(factor1, factor2));

      return {
        success: true,
        ast: result,
        changed: true,
        steps,
        strategyUsed: this.name,
        canContinue: false,
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
}
