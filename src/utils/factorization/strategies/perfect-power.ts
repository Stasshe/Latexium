/**
 * Perfect Power Strategy for Factorization
 * Recognizes and factors perfect powers like (x+1)^n
 */

import { ASTNode } from '../../../types';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  PolynomialAnalyzer,
  PolynomialInfo,
  ASTBuilder,
} from '../framework';

export class PerfectPowerStrategy implements FactorizationStrategy {
  name = 'Perfect Power';
  description = 'Factor perfect power expressions like (x+a)^n';
  priority = 90;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);
    return poly !== null && poly.degree >= 2 && poly.degree <= 6 && poly.isUnivariate;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);

      if (!poly) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Not a polynomial'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Try to detect perfect powers
      const perfectPowerResult = this.tryPerfectPower(poly, context.variable, steps);
      if (perfectPowerResult) {
        return {
          success: true,
          ast: perfectPowerResult,
          changed: true,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      return {
        success: true,
        ast: node,
        changed: false,
        steps: [...steps, 'Not a perfect power'],
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

  /**
   * Try to factor as a perfect power
   */
  private tryPerfectPower(poly: PolynomialInfo, variable: string, steps: string[]): ASTNode | null {
    const degree = poly.degree;
    const coefficients = poly.coefficients;

    // Check for perfect squares (x + a)²
    if (degree === 2) {
      return this.tryPerfectSquare(coefficients, variable, steps);
    }

    // Check for perfect fourth powers (x + a)⁴
    if (degree === 4) {
      return this.tryPerfectFourthPower(coefficients, variable, steps);
    }

    return null;
  }

  /**
   * Check for perfect square (x + a)²
   */
  private tryPerfectSquare(
    coefficients: Map<number, number>,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    const a = coefficients.get(2) || 0;
    const b = coefficients.get(1) || 0;
    const c = coefficients.get(0) || 0;

    // For (x + k)², coefficients should be: a, 2ak, ak²
    if (a === 0) return null;

    const k = b / (2 * a);
    const expectedConstant = a * k * k;

    steps.push(
      `Perfect square check: a=${a}, b=${b}, c=${c}, k=${k}, expected_constant=${expectedConstant}`
    );

    // Use discriminant check instead - if discriminant < 0, it's not factorable
    const discriminant = b * b - 4 * a * c;
    steps.push(`Discriminant = ${discriminant}`);

    if (discriminant < 0) {
      steps.push('Cannot factor (negative discriminant)');
      return null;
    }

    if (Math.abs(c - expectedConstant) < 1e-10) {
      steps.push(`Detected perfect square: (${variable} + ${k})²`);

      const innerExpression =
        k >= 0
          ? ASTBuilder.add(ASTBuilder.variable(variable), ASTBuilder.number(k))
          : ASTBuilder.subtract(ASTBuilder.variable(variable), ASTBuilder.number(-k));

      const result = ASTBuilder.power(innerExpression, ASTBuilder.number(2));

      return a === 1 ? result : ASTBuilder.multiply(ASTBuilder.number(a), result);
    }

    return null;
  }

  /**
   * Check for perfect fourth power (x + a)⁴
   */
  private tryPerfectFourthPower(
    coefficients: Map<number, number>,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    const a4 = coefficients.get(4) || 0; // x⁴ coefficient
    const a3 = coefficients.get(3) || 0; // x³ coefficient
    const a2 = coefficients.get(2) || 0; // x² coefficient
    const a1 = coefficients.get(1) || 0; // x coefficient
    const a0 = coefficients.get(0) || 0; // constant term

    // For (x + k)⁴, coefficients should follow binomial expansion:
    // a4*x⁴ + 4*a4*k*x³ + 6*a4*k²*x² + 4*a4*k³*x + a4*k⁴

    if (a4 === 0) return null;

    // Calculate k from the x³ coefficient
    const k = a3 / (4 * a4);

    // Check if other coefficients match the pattern
    const expected_a2 = 6 * a4 * k * k;
    const expected_a1 = 4 * a4 * k * k * k;
    const expected_a0 = a4 * k * k * k * k;

    const tolerance = 1e-10;
    if (
      Math.abs(a2 - expected_a2) < tolerance &&
      Math.abs(a1 - expected_a1) < tolerance &&
      Math.abs(a0 - expected_a0) < tolerance
    ) {
      steps.push(`Detected perfect fourth power: (${variable} + ${k})⁴`);
      steps.push(`Coefficients match pattern: [${a4}, ${a3}, ${a2}, ${a1}, ${a0}]`);

      const innerExpression =
        k >= 0
          ? ASTBuilder.add(ASTBuilder.variable(variable), ASTBuilder.number(k))
          : ASTBuilder.subtract(ASTBuilder.variable(variable), ASTBuilder.number(-k));

      const result = ASTBuilder.power(innerExpression, ASTBuilder.number(4));

      return a4 === 1 ? result : ASTBuilder.multiply(ASTBuilder.number(a4), result);
    }

    steps.push(
      `Fourth power pattern not detected. Expected: [${a4}, ${4 * a4 * k}, ${expected_a2}, ${expected_a1}, ${expected_a0}], Got: [${a4}, ${a3}, ${a2}, ${a1}, ${a0}]`
    );
    return null;
  }
}
