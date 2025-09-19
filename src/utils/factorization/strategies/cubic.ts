/**
 * Cubic Factorization Strategy
 * Factors cubic polynomials using various methods including rational root theorem
 */

import { ASTNode } from '../../../types';
import { astToLatex } from '../../ast';
import { simplify } from '../../unified-simplify';
import {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  PolynomialAnalyzer,
  ASTBuilder,
} from '../framework';

export class CubicFactorizationStrategy implements FactorizationStrategy {
  name = 'Cubic Factorization';
  description = 'Factor cubic polynomials using rational root theorem and polynomial division';
  priority = 60;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);
    return poly !== null && poly.degree === 3 && poly.isUnivariate;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const steps: string[] = [];

    try {
      const poly = PolynomialAnalyzer.analyzePolynomial(node, context.variable);

      if (!poly || poly.degree !== 3) {
        return {
          success: false,
          ast: node,
          changed: false,
          steps: ['Not a cubic polynomial'],
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      const a = poly.coefficients.get(3) || 0;
      const b = poly.coefficients.get(2) || 0;
      const c = poly.coefficients.get(1) || 0;
      const d = poly.coefficients.get(0) || 0;

      steps.push(
        `Cubic form: ${a}${context.variable}³ + ${b}${context.variable}² + ${c}${context.variable} + ${d}`
      );

      // Special cases first
      const specialResult = this.trySpecialCases(a, b, c, d, context.variable, steps);
      if (specialResult) {
        return {
          success: true,
          ast: specialResult,
          changed: true,
          steps,
          strategyUsed: this.name,
          canContinue: false,
        };
      }

      // Try rational root theorem
      const rationalResult = this.tryRationalRootFactorization(a, b, c, d, context.variable, steps);
      if (rationalResult) {
        return {
          success: true,
          ast: rationalResult,
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
   * Try special cases like sum/difference of cubes
   */
  private trySpecialCases(
    a: number,
    b: number,
    c: number,
    d: number,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    // Case 1: Sum of cubes (x³ + a³ = (x + a)(x² - ax + a²))
    if (b === 0 && c === 0 && d > 0) {
      const cubeRoot = Math.round(Math.cbrt(d));
      if (cubeRoot * cubeRoot * cubeRoot === d) {
        steps.push(`Detected sum of cubes: ${variable}³ + ${cubeRoot}³`);
        steps.push(`Using formula: a³ + b³ = (a + b)(a² - ab + b²)`);

        const linearFactor = ASTBuilder.add(
          ASTBuilder.variable(variable),
          ASTBuilder.number(cubeRoot)
        );

        const quadraticFactor = ASTBuilder.add(
          ASTBuilder.subtract(
            ASTBuilder.power(ASTBuilder.variable(variable), ASTBuilder.number(2)),
            ASTBuilder.multiply(ASTBuilder.number(cubeRoot), ASTBuilder.variable(variable))
          ),
          ASTBuilder.number(cubeRoot * cubeRoot) // Use the actual value, not cubeRoot^2
        );

        // Simplify the quadratic factor to ensure correct coefficient extraction
        const simplifiedQuadraticFactor = simplify(quadraticFactor);

        steps.push(`Generated quadratic factor: ${astToLatex(simplifiedQuadraticFactor)}`);

        const result =
          a === 1
            ? ASTBuilder.multiply(linearFactor, simplifiedQuadraticFactor)
            : ASTBuilder.multiply(
                ASTBuilder.number(a),
                ASTBuilder.multiply(linearFactor, simplifiedQuadraticFactor)
              );

        steps.push(`Final factored result: ${astToLatex(result)}`);
        return result;
      }
    }

    // Case 2: Difference of cubes (x³ - a³ = (x - a)(x² + ax + a²))
    if (b === 0 && c === 0 && d < 0) {
      const cubeRoot = Math.round(Math.cbrt(-d));
      if (cubeRoot * cubeRoot * cubeRoot === -d) {
        steps.push(`Detected difference of cubes: ${variable}³ - ${cubeRoot}³`);
        steps.push(`Using formula: a³ - b³ = (a - b)(a² + ab + b²)`);

        const linearFactor = ASTBuilder.subtract(
          ASTBuilder.variable(variable),
          ASTBuilder.number(cubeRoot)
        );

        const quadraticFactor = ASTBuilder.add(
          ASTBuilder.add(
            ASTBuilder.power(ASTBuilder.variable(variable), ASTBuilder.number(2)),
            ASTBuilder.multiply(ASTBuilder.number(cubeRoot), ASTBuilder.variable(variable))
          ),
          ASTBuilder.number(cubeRoot * cubeRoot) // Use the actual value, not cubeRoot^2
        );

        // Simplify the quadratic factor to ensure correct coefficient extraction
        const simplifiedQuadraticFactor = simplify(quadraticFactor);

        return a === 1
          ? ASTBuilder.multiply(linearFactor, simplifiedQuadraticFactor)
          : ASTBuilder.multiply(
              ASTBuilder.number(a),
              ASTBuilder.multiply(linearFactor, simplifiedQuadraticFactor)
            );
      }
    }

    // Case 3: Perfect cube (x + a)³
    if (this.isPerfectCube(a, b, c, d)) {
      const root = this.findCubeRoot(a, b, c, d);
      if (root !== null) {
        steps.push(`Detected perfect cube: (${variable} + ${root})³`);

        const factor =
          root >= 0
            ? ASTBuilder.add(ASTBuilder.variable(variable), ASTBuilder.number(root))
            : ASTBuilder.subtract(ASTBuilder.variable(variable), ASTBuilder.number(-root));

        return ASTBuilder.power(factor, ASTBuilder.number(3));
      }
    }

    return null;
  }

  /**
   * Try factorization using rational root theorem
   */
  private tryRationalRootFactorization(
    a: number,
    b: number,
    c: number,
    d: number,
    variable: string,
    steps: string[]
  ): ASTNode | null {
    steps.push('Applying rational root theorem...');

    // Handle zero constant term
    if (d === 0) {
      steps.push('Constant term is zero, factoring out x');
      const factor = ASTBuilder.variable(variable);
      const quotient = this.buildQuadraticFromCoefficients(c, b, a, variable);
      return ASTBuilder.multiply(factor, quotient);
    }

    const roots = this.findRationalRoots(a, b, c, d);

    if (roots.length === 0) {
      steps.push('No rational roots found');
      return null;
    }

    steps.push(`Found rational roots: ${roots.join(', ')}`);

    // Factor out the first rational root
    const root = roots[0]!;
    const quotientCoeffs = this.syntheticDivision(a, b, c, d, root);

    if (!quotientCoeffs) {
      steps.push('Synthetic division failed');
      return null;
    }

    const linearFactor = ASTBuilder.linearFactor(variable, root);
    const quadraticFactor = this.buildQuadraticFromCoefficients(
      quotientCoeffs[0],
      quotientCoeffs[1],
      quotientCoeffs[2],
      variable
    );

    steps.push(`Factored as: (${astToLatex(linearFactor)}) * (${astToLatex(quadraticFactor)})`);

    // Try to factor the quadratic further
    // This could be done by calling the quadratic strategy, but for simplicity we'll check for more rational roots
    const remainingRoots = roots.slice(1);
    if (remainingRoots.length > 0) {
      const additionalRoot = remainingRoots[0]!;
      // Check if this root also divides the quadratic
      const quadPoly = PolynomialAnalyzer.analyzePolynomial(quadraticFactor, variable);
      if (quadPoly && quadPoly.degree === 2) {
        const qa = quadPoly.coefficients.get(2) || 0;
        const qb = quadPoly.coefficients.get(1) || 0;
        const qc = quadPoly.coefficients.get(0) || 0;

        const testValue = qa * additionalRoot * additionalRoot + qb * additionalRoot + qc;
        if (Math.abs(testValue) < 1e-10) {
          steps.push(`Additional root ${additionalRoot} also factors the quadratic`);

          const factor2 = ASTBuilder.linearFactor(variable, additionalRoot);
          const finalRoot = -(qb + qa * additionalRoot) / qa; // Using Vieta's formulas
          const factor3 = ASTBuilder.linearFactor(variable, finalRoot);

          return ASTBuilder.multiply(linearFactor, ASTBuilder.multiply(factor2, factor3));
        }
      }
    }

    return ASTBuilder.multiply(linearFactor, quadraticFactor);
  }

  /**
   * Check if cubic is a perfect cube
   */
  private isPerfectCube(a: number, b: number, c: number, d: number): boolean {
    // For (x + k)³ = x³ + 3kx² + 3k²x + k³
    // We need: b = 3k*a, c = 3k²*a, d = k³*a

    if (a === 0) return false;

    const k = b / (3 * a);
    const expectedC = 3 * k * k * a;
    const expectedD = k * k * k * a;

    return Math.abs(c - expectedC) < 1e-10 && Math.abs(d - expectedD) < 1e-10;
  }

  /**
   * Find the cube root for a perfect cube
   */
  private findCubeRoot(a: number, b: number, c: number, d: number): number | null {
    if (a === 0) return null;

    const k = b / (3 * a);
    const expectedC = 3 * k * k * a;
    const expectedD = k * k * k * a;

    if (Math.abs(c - expectedC) < 1e-10 && Math.abs(d - expectedD) < 1e-10) {
      return k;
    }

    return null;
  }

  /**
   * Find rational roots using rational root theorem
   */
  private findRationalRoots(a: number, b: number, c: number, d: number): number[] {
    if (d === 0) {
      return [0]; // Zero is always a root if constant term is 0
    }

    const pFactors = this.getFactors(Math.abs(d));
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
      const value = a * root * root * root + b * root * root + c * root + d;
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
   * Synthetic division for cubic by linear factor
   */
  private syntheticDivision(
    a: number,
    b: number,
    c: number,
    d: number,
    root: number
  ): [number, number, number] | null {
    // Divide ax³ + bx² + cx + d by (x - root)
    const q2 = a;
    const q1 = b + root * q2;
    const q0 = c + root * q1;
    const remainder = d + root * q0;

    if (Math.abs(remainder) > 1e-10) {
      return null; // Not an exact division
    }

    return [q0, q1, q2]; // Coefficients of quotient (constant, x, x²)
  }

  /**
   * Build quadratic from coefficients
   */
  private buildQuadraticFromCoefficients(
    constCoeff: number,
    linearCoeff: number,
    quadCoeff: number,
    variable: string
  ): ASTNode {
    let result: ASTNode | null = null;

    // Add quadratic term
    if (quadCoeff !== 0) {
      if (quadCoeff === 1) {
        result = ASTBuilder.power(ASTBuilder.variable(variable), ASTBuilder.number(2));
      } else {
        result = ASTBuilder.multiply(
          ASTBuilder.number(quadCoeff),
          ASTBuilder.power(ASTBuilder.variable(variable), ASTBuilder.number(2))
        );
      }
    }

    // Add linear term
    if (linearCoeff !== 0) {
      const linearTerm =
        linearCoeff === 1
          ? ASTBuilder.variable(variable)
          : ASTBuilder.multiply(ASTBuilder.number(linearCoeff), ASTBuilder.variable(variable));

      result = result ? ASTBuilder.add(result, linearTerm) : linearTerm;
    }

    // Add constant term
    if (constCoeff !== 0) {
      const constantTerm = ASTBuilder.number(constCoeff);
      result = result ? ASTBuilder.add(result, constantTerm) : constantTerm;
    }

    return result || ASTBuilder.number(0);
  }
}
