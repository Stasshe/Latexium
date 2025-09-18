/**
 * Quadratic Factorization Strategy
 * Factors quadratic expressions ax² + bx + c into linear factors
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '../../../types';
import { astToLatex } from '../../ast';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  PolynomialAnalyzer,
  ASTBuilder,
} from '../framework';

export class QuadraticFactorizationStrategy implements FactorizationStrategy {
  name = 'Quadratic Factorization';
  description = 'Factor quadratic expressions ax² + bx + c into linear factors';
  priority = 80;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);
    return poly !== null && poly.degree === 2 && poly.isUnivariate;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);

      if (!poly || poly.degree !== 2) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Not a quadratic polynomial'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      const a = poly.coefficients.get(2) || 0;
      const b = poly.coefficients.get(1) || 0;
      const c = poly.coefficients.get(0) || 0;

      steps.push(`Quadratic form: ${a}${context.variable}² + ${b}${context.variable} + ${c}`);

      // Special case: perfect square trinomial
      const perfectSquareResult = this.tryPerfectSquareTrinomial(a, b, c, context.variable, steps);
      if (perfectSquareResult) {
        return {
          success: true,
          ast: perfectSquareResult,
          changed: true,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Try factoring by rational roots
      const rationalFactorResult = this.tryRationalFactorization(a, b, c, context.variable, steps);
      if (rationalFactorResult) {
        return {
          success: true,
          ast: rationalFactorResult,
          changed: true,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Try factoring by grouping (AC method)
      const groupingResult = this.tryACMethod(a, b, c, context.variable, steps);
      if (groupingResult) {
        return {
          success: true,
          ast: groupingResult,
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
        steps: [...steps, 'Cannot factor over rational numbers'],
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
   * Try to factor as perfect square trinomial
   */
  private tryPerfectSquareTrinomial(
    a: number,
    b: number,
    c: number,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    // Check if b² = 4ac (perfect square condition)
    const discriminant = b * b - 4 * a * c;

    if (Math.abs(discriminant) > 1e-10) {
      return null; // Not a perfect square
    }

    steps.push('Detected perfect square trinomial');

    // For perfect square: ax² + bx + c = a(x + k)² where k = b/(2a)
    const k = -b / (2 * a);

    steps.push(`Using formula: a(x + k)² where k = ${k}`);

    let innerExpression: ASTNode;
    if (k === 0) {
      innerExpression = ASTBuilder.variable(variable);
    } else if (k > 0) {
      innerExpression = ASTBuilder.add(ASTBuilder.variable(variable), ASTBuilder.number(k));
    } else {
      innerExpression = ASTBuilder.subtract(ASTBuilder.variable(variable), ASTBuilder.number(-k));
    }

    const squared = ASTBuilder.power(innerExpression, ASTBuilder.number(2));

    if (a === 1) {
      return squared;
    } else {
      return ASTBuilder.multiply(ASTBuilder.number(a), squared);
    }
  }

  /**
   * Try factorization using rational root theorem
   */
  private tryRationalFactorization(
    a: number,
    b: number,
    c: number,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    steps.push('Trying rational root theorem...');

    const roots = this.findRationalRoots(a, b, c);

    if (roots.length === 0) {
      steps.push('No rational roots found');
      return null;
    }

    steps.push(`Found rational roots: ${roots.join(', ')}`);

    if (roots.length === 1) {
      // One rational root - factor out (x - root) and find quadratic factor
      const root = roots[0]!;
      const quotient = this.syntheticDivision(a, b, c, root);

      if (!quotient) {
        return null;
      }

      const linearFactor = ASTBuilder.linearFactor(variable, root);
      const quadraticFactor = this.buildLinearFromCoefficients(quotient[0], quotient[1], variable);

      return ASTBuilder.multiply(linearFactor, quadraticFactor);
    } else if (roots.length >= 2) {
      // Two rational roots - build two linear factors
      const factor1 = ASTBuilder.linearFactor(variable, roots[0]!);
      const factor2 = ASTBuilder.linearFactor(variable, roots[1]!);

      if (a === 1) {
        return ASTBuilder.multiply(factor1, factor2);
      } else {
        return ASTBuilder.multiply(ASTBuilder.number(a), ASTBuilder.multiply(factor1, factor2));
      }
    }

    return null;
  }

  /**
   * Try AC method (factoring by grouping)
   */
  private tryACMethod(
    a: number,
    b: number,
    c: number,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    steps.push('Trying AC method (factoring by grouping)...');

    const ac = a * c;
    const factorPairs = this.findFactorPairs(ac);

    for (const [p, q] of factorPairs) {
      if (p + q === b) {
        steps.push(`Found factor pair: ${p} and ${q} (sum = ${b})`);

        // Rewrite bx as px + qx
        steps.push(`Rewriting: ${a}${variable}² + ${p}${variable} + ${q}${variable} + ${c}`);

        // Try to factor by grouping
        // Group: (ax² + px) + (qx + c)
        const group1Factor = this.findCommonFactor([a, p]);
        const group2Factor = this.findCommonFactor([q, c]);

        if (group1Factor !== 1 || group2Factor !== 1) {
          // Factor first group: group1Factor * x * (something)
          const term1 = a / group1Factor;
          const term2 = p / group1Factor;

          // Factor second group: group2Factor * (something)
          const term3 = q / group2Factor;
          const term4 = c / group2Factor;

          // Check if the "something" parts are the same
          if (Math.abs(term2 - term4) < 1e-10) {
            const commonTerm = term2;
            const factor1 = ASTBuilder.add(
              ASTBuilder.multiply(ASTBuilder.number(group1Factor), ASTBuilder.variable(variable)),
              ASTBuilder.number(group2Factor)
            );

            let factor2: ASTNode;
            if (commonTerm === 1) {
              factor2 = ASTBuilder.add(
                ASTBuilder.multiply(ASTBuilder.number(term1), ASTBuilder.variable(variable)),
                ASTBuilder.number(1)
              );
            } else {
              factor2 = ASTBuilder.add(
                ASTBuilder.multiply(ASTBuilder.number(term1), ASTBuilder.variable(variable)),
                ASTBuilder.number(commonTerm)
              );
            }

            return ASTBuilder.multiply(factor1, factor2);
          }
        }
      }
    }

    steps.push('AC method failed - no suitable factor pairs found');
    return null;
  }

  /**
   * Find rational roots using rational root theorem
   */
  private findRationalRoots(a: number, b: number, c: number): number[] {
    if (c === 0) {
      return [0]; // Zero is always a root if constant term is 0
    }

    const pFactors = this.getFactors(Math.abs(c));
    const qFactors = this.getFactors(Math.abs(a));

    const possibleRoots: number[] = [];

    for (const p of pFactors) {
      for (const q of qFactors) {
        possibleRoots.push(p / q, -p / q);
      }
    }

    // Remove duplicates and test each root
    const uniqueRoots = [...new Set(possibleRoots)];
    const actualRoots: number[] = [];

    for (const root of uniqueRoots) {
      const value = a * root * root + b * root + c;
      if (Math.abs(value) < 1e-10) {
        actualRoots.push(root);
      }
    }

    return actualRoots.sort((a, b) => a - b);
  }

  /**
   * Get factors of a number
   */
  private getFactors(n: number): number[] {
    const factors: number[] = [];
    const absN = Math.abs(n);

    for (let i = 1; i <= Math.sqrt(absN); i++) {
      if (absN % i === 0) {
        factors.push(i);
        if (i !== absN / i) {
          factors.push(absN / i);
        }
      }
    }

    return factors.sort((a, b) => a - b);
  }

  /**
   * Find factor pairs of a number
   */
  private findFactorPairs(n: number): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];
    const factors = this.getFactors(Math.abs(n));

    for (let i = 0; i < factors.length; i++) {
      for (let j = i; j < factors.length; j++) {
        const factor1 = factors[i]!;
        const factor2 = factors[j]!;

        if (factor1 * factor2 === Math.abs(n)) {
          pairs.push([factor1, factor2]);
          if (factor1 !== factor2) {
            pairs.push([factor2, factor1]);
          }

          // Also consider negative versions
          if (n < 0) {
            pairs.push([-factor1, factor2]);
            pairs.push([factor1, -factor2]);
          }
        }
      }
    }

    return pairs;
  }

  /**
   * Synthetic division for quadratic by linear factor
   */
  private syntheticDivision(
    a: number,
    b: number,
    c: number,
    root: number
  ): [number, number] | null {
    // Divide ax² + bx + c by (x - root)
    const q1 = a;
    const q0 = b + root * q1;
    const remainder = c + root * q0;

    if (Math.abs(remainder) > 1e-10) {
      return null; // Not an exact division
    }

    return [q0, q1]; // Coefficients of quotient (constant, x)
  }

  /**
   * Build linear expression from coefficients
   */
  private buildLinearFromCoefficients(
    constCoeff: number,
    linearCoeff: number,
    variable: string
  ): ASTNode {
    if (linearCoeff === 0) {
      return ASTBuilder.number(constCoeff);
    }

    if (constCoeff === 0) {
      return linearCoeff === 1
        ? ASTBuilder.variable(variable)
        : ASTBuilder.multiply(ASTBuilder.number(linearCoeff), ASTBuilder.variable(variable));
    }

    const linearTerm =
      linearCoeff === 1
        ? ASTBuilder.variable(variable)
        : ASTBuilder.multiply(ASTBuilder.number(linearCoeff), ASTBuilder.variable(variable));

    return constCoeff > 0
      ? ASTBuilder.add(linearTerm, ASTBuilder.number(constCoeff))
      : ASTBuilder.subtract(linearTerm, ASTBuilder.number(-constCoeff));
  }

  /**
   * Find common factor of two numbers
   */
  private findCommonFactor(numbers: number[]): number {
    if (numbers.length === 0) return 1;

    let result = Math.abs(numbers[0]!);
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcd(result, Math.abs(numbers[i]!));
    }

    return result;
  }

  /**
   * Calculate greatest common divisor
   */
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }
}
