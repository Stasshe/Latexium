/**
 * Polynomial Utilities for Berlekamp-Zassenhaus Algorithm
 * Helper functions for polynomial operations and AST conversions
 */

import { ASTNode, BinaryExpression } from '../../types';

/**
 * Polynomial utility functions
 */
export class PolynomialUtils {
  /**
   * Check if an AST node represents a polynomial in the given variable
   */
  isPolynomial(node: ASTNode, variable: string): boolean {
    if (!node) return false;

    switch (node.type) {
      case 'NumberLiteral':
        return true;
      case 'Identifier':
        return node.name === variable || this.isConstant(node.name);
      case 'BinaryExpression':
        return this.isBinaryPolynomial(node, variable);
      default:
        return false;
    }
  }

  /**
   * Check if a binary expression represents a polynomial operation
   */
  private isBinaryPolynomial(node: BinaryExpression, variable: string): boolean {
    const { operator, left, right } = node;

    switch (operator) {
      case '+':
      case '-':
        return this.isPolynomial(left, variable) && this.isPolynomial(right, variable);
      case '*':
        return this.isPolynomial(left, variable) && this.isPolynomial(right, variable);
      case '^':
        // Power must have polynomial base and constant integer exponent
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

  /**
   * Check if an identifier represents a constant (not the main variable)
   */
  private isConstant(name: string): boolean {
    // Simple heuristic: single letters other than x, y, z are likely constants
    return name.length === 1 && !['x', 'y', 'z'].includes(name.toLowerCase());
  }

  /**
   * Extract polynomial coefficients from AST node
   * Returns array where index i contains coefficient of x^i
   */
  extractCoefficients(node: ASTNode, variable: string): number[] {
    const coeffs: number[] = [];
    this.extractCoeffsRecursive(node, variable, coeffs);

    // Remove trailing zeros
    while (coeffs.length > 1 && coeffs[coeffs.length - 1] === 0) {
      coeffs.pop();
    }

    return coeffs.length > 0 ? coeffs : [0];
  }

  /**
   * Recursive helper for coefficient extraction
   */
  private extractCoeffsRecursive(node: ASTNode, variable: string, coeffs: number[]): void {
    if (!node) return;

    switch (node.type) {
      case 'NumberLiteral':
        this.addToCoeff(coeffs, 0, node.value);
        break;
      case 'Identifier':
        if (node.name === variable) {
          this.addToCoeff(coeffs, 1, 1);
        } else {
          // Treat as constant
          this.addToCoeff(coeffs, 0, 1);
        }
        break;
      case 'BinaryExpression':
        this.extractBinaryCoeffs(node, variable, coeffs);
        break;
    }
  }

  /**
   * Extract coefficients from binary expressions
   */
  private extractBinaryCoeffs(node: BinaryExpression, variable: string, coeffs: number[]): void {
    const { operator, left, right } = node;

    switch (operator) {
      case '+':
        this.extractCoeffsRecursive(left, variable, coeffs);
        this.extractCoeffsRecursive(right, variable, coeffs);
        break;
      case '-': {
        this.extractCoeffsRecursive(left, variable, coeffs);
        // Subtract right side coefficients
        const rightCoeffs: number[] = [];
        this.extractCoeffsRecursive(right, variable, rightCoeffs);
        for (let i = 0; i < rightCoeffs.length; i++) {
          this.addToCoeff(coeffs, i, -rightCoeffs[i]!);
        }
        break;
      }
      case '*':
        this.extractMultiplicationCoeffs(left, right, variable, coeffs);
        break;
      case '^':
        this.extractPowerCoeffs(left, right, variable, coeffs);
        break;
    }
  }

  /**
   * Extract coefficients from multiplication
   */
  private extractMultiplicationCoeffs(
    left: ASTNode,
    right: ASTNode,
    variable: string,
    coeffs: number[]
  ): void {
    // Get coefficients for both factors
    const leftCoeffs: number[] = [];
    const rightCoeffs: number[] = [];

    this.extractCoeffsRecursive(left, variable, leftCoeffs);
    this.extractCoeffsRecursive(right, variable, rightCoeffs);

    // Multiply polynomials (convolution of coefficients)
    for (let i = 0; i < leftCoeffs.length; i++) {
      for (let j = 0; j < rightCoeffs.length; j++) {
        const leftVal = leftCoeffs[i];
        const rightVal = rightCoeffs[j];
        if (leftVal !== undefined && rightVal !== undefined) {
          this.addToCoeff(coeffs, i + j, leftVal * rightVal);
        }
      }
    }
  }

  /**
   * Extract coefficients from power expressions
   */
  private extractPowerCoeffs(
    base: ASTNode,
    exponent: ASTNode,
    variable: string,
    coeffs: number[]
  ): void {
    if (exponent.type !== 'NumberLiteral' || !Number.isInteger(exponent.value)) {
      throw new Error('Non-integer exponents not supported in polynomial extraction');
    }

    const exp = exponent.value;
    if (exp < 0) {
      throw new Error('Negative exponents not supported in polynomial extraction');
    }

    if (exp === 0) {
      this.addToCoeff(coeffs, 0, 1);
      return;
    }

    // Handle base^exp
    if (base.type === 'Identifier' && base.name === variable) {
      // x^n case
      this.addToCoeff(coeffs, exp, 1);
    } else {
      // (polynomial)^n case - requires polynomial exponentiation
      const baseCoeffs: number[] = [];
      this.extractCoeffsRecursive(base, variable, baseCoeffs);

      const resultCoeffs = this.polynomialPower(baseCoeffs, exp);
      for (let i = 0; i < resultCoeffs.length; i++) {
        const coeff = resultCoeffs[i];
        if (coeff !== undefined) {
          this.addToCoeff(coeffs, i, coeff);
        }
      }
    }
  }

  /**
   * Compute polynomial raised to integer power
   */
  private polynomialPower(coeffs: number[], power: number): number[] {
    if (power === 0) return [1];
    if (power === 1) return [...coeffs];

    let result = [1];
    let base = [...coeffs];
    let exp = power;

    // Binary exponentiation
    while (exp > 0) {
      if (exp % 2 === 1) {
        result = this.multiplyPolynomials(result, base);
      }
      base = this.multiplyPolynomials(base, base);
      exp = Math.floor(exp / 2);
    }

    return result;
  }

  /**
   * Multiply two polynomials represented as coefficient arrays
   */
  private multiplyPolynomials(a: number[], b: number[]): number[] {
    const result = new Array(a.length + b.length - 1).fill(0);

    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const aVal = a[i];
        const bVal = b[j];
        if (aVal !== undefined && bVal !== undefined) {
          result[i + j] += aVal * bVal;
        }
      }
    }

    return result;
  }

  /**
   * Add value to coefficient at given degree
   */
  private addToCoeff(coeffs: number[], degree: number, value: number): void {
    // Extend array if necessary
    while (coeffs.length <= degree) {
      coeffs.push(0);
    }
    const existing = coeffs[degree];
    if (existing !== undefined) {
      coeffs[degree] = existing + value;
    }
  }

  /**
   * Convert coefficient array back to AST node
   */
  coefficientsToAST(coeffs: number[], variable: string): ASTNode {
    if (coeffs.length === 0) {
      return { type: 'NumberLiteral', value: 0 };
    }

    // Find the highest non-zero coefficient
    let degree = coeffs.length - 1;
    while (degree > 0 && coeffs[degree] === 0) {
      degree--;
    }

    if (degree === 0) {
      const constantCoeff = coeffs[0];
      return { type: 'NumberLiteral', value: constantCoeff || 0 };
    }

    // Build polynomial from highest to lowest degree
    let result: ASTNode | null = null;

    for (let i = degree; i >= 0; i--) {
      const coeff = coeffs[i];
      if (coeff === undefined || coeff === 0) continue;

      const term = this.createTerm(coeff, i, variable);

      if (result === null) {
        result = term;
      } else {
        result = {
          type: 'BinaryExpression',
          operator: coeff > 0 ? '+' : '-',
          left: result,
          right: coeff > 0 ? term : this.negateTerm(term),
        };
      }
    }

    return result || { type: 'NumberLiteral', value: 0 };
  }

  /**
   * Create a single term (coefficient * variable^degree)
   */
  private createTerm(coeff: number, degree: number, variable: string): ASTNode {
    const absCoeff = Math.abs(coeff);

    if (degree === 0) {
      return { type: 'NumberLiteral', value: absCoeff };
    }

    const varNode: ASTNode = { type: 'Identifier', name: variable };
    const powerNode: ASTNode =
      degree === 1
        ? varNode
        : {
            type: 'BinaryExpression',
            operator: '^',
            left: varNode,
            right: { type: 'NumberLiteral', value: degree },
          };

    if (absCoeff === 1) {
      return powerNode;
    }

    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: absCoeff },
      right: powerNode,
    };
  }

  /**
   * Negate a term (used for subtraction)
   */
  private negateTerm(term: ASTNode): ASTNode {
    if (term.type === 'NumberLiteral') {
      return { type: 'NumberLiteral', value: -term.value };
    }

    return {
      type: 'UnaryExpression',
      operator: '-',
      operand: term,
    };
  }
}
