/**
 * Pattern Recognition Implementation
 * Concrete implementations of factorization patterns using middle-simplify functions
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '@/types';

/**
 * Common factorization patterns interface
 */
export interface FactorizationPattern {
  name: string;
  description: string;
  matches(node: ASTNode): boolean;
  factor(node: ASTNode): ASTNode | null;
}

/**
 * Utility functions for pattern matching
 */
export class PatternUtils {
  /**
   * Extract coefficient from a term (e.g., 3x² -> 3)
   */
  static getCoefficient(node: ASTNode): number {
    if (node.type === 'NumberLiteral') {
      return node.value;
    }
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        return node.left.value;
      }
      if (node.right.type === 'NumberLiteral') {
        return node.right.value;
      }
    }
    return 1; // Default coefficient
  }

  /**
   * Extract variable part from a term (e.g., 3x² -> x²)
   */
  static getVariablePart(node: ASTNode): ASTNode | null {
    if (node.type === 'Identifier') {
      return node;
    }
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      return node;
    }
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      if (node.left.type === 'NumberLiteral') {
        return node.right;
      }
      if (node.right.type === 'NumberLiteral') {
        return node.left;
      }
    }
    return null;
  }

  /**
   * Calculate GCD of an array of numbers
   */
  static gcd(a: number, b: number): number {
    if (b === 0) return Math.abs(a);
    return this.gcd(b, a % b);
  }

  static gcdArray(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) {
      const first = numbers[0];
      return first !== undefined ? Math.abs(first) : 1;
    }

    let result = numbers[0];
    if (result === undefined) return 1;

    for (let i = 1; i < numbers.length; i++) {
      const current = numbers[i];
      if (current === undefined) continue;
      result = this.gcd(result, current);
      if (result === 1) break; // Early termination
    }
    return Math.abs(result);
  }

  /**
   * Check if two AST nodes represent the same expression structure
   */
  static areStructurallyEqual(a: ASTNode, b: ASTNode): boolean {
    if (a.type !== b.type) return false;

    switch (a.type) {
      case 'NumberLiteral':
        return (a as NumberLiteral).value === (b as NumberLiteral).value;
      case 'Identifier': {
        const idA = a as Identifier;
        const idB = b as Identifier;
        return idA.name === idB.name;
      }
      case 'BinaryExpression': {
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return (
          binA.operator === binB.operator &&
          this.areStructurallyEqual(binA.left, binB.left) &&
          this.areStructurallyEqual(binA.right, binB.right)
        );
      }
      default:
        return false;
    }
  }

  /**
   * Create a NumberLiteral node
   */
  static createNumber(value: number): NumberLiteral {
    return {
      type: 'NumberLiteral',
      value: value,
    };
  }

  /**
   * Create an Identifier node
   */
  static createIdentifier(name: string): Identifier {
    return {
      type: 'Identifier',
      name: name,
    };
  }

  /**
   * Create a BinaryExpression node
   */
  static createBinaryExpression(
    left: ASTNode,
    operator: '+' | '-' | '*' | '/' | '^' | '=' | '>' | '<' | '>=' | '<=',
    right: ASTNode
  ): BinaryExpression {
    return {
      type: 'BinaryExpression',
      left: left,
      operator: operator,
      right: right,
    };
  }
}

/**
 * Concrete implementation of CommonFactorPattern
 */
export class ConcreteCommonFactorPattern implements FactorizationPattern {
  name = 'common-factor';
  description = 'Extract common factors from polynomial terms';

  matches(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression') return false;
    if (node.operator !== '+' && node.operator !== '-') return false;

    const terms = this.extractTerms(node);
    if (terms.length < 2) return false;

    const coefficients = terms.map(term => PatternUtils.getCoefficient(term));
    const gcd = PatternUtils.gcdArray(coefficients);

    return gcd > 1;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;

    const terms = this.extractTerms(node as BinaryExpression);
    const coefficients = terms.map(term => PatternUtils.getCoefficient(term));
    const gcd = PatternUtils.gcdArray(coefficients);

    if (gcd <= 1) return null;

    // Extract the common factor and create factored form
    const factorNode = PatternUtils.createNumber(gcd);
    const simplifiedTerms = terms.map(term => {
      const coeff = PatternUtils.getCoefficient(term);
      const varPart = PatternUtils.getVariablePart(term);
      const newCoeff = coeff / gcd;

      if (newCoeff === 1 && varPart) {
        return varPart;
      } else if (varPart) {
        return PatternUtils.createBinaryExpression(
          PatternUtils.createNumber(newCoeff),
          '*',
          varPart
        );
      } else {
        return PatternUtils.createNumber(newCoeff);
      }
    });

    // Reconstruct the simplified expression
    if (simplifiedTerms.length === 0) return null;

    let simplified = simplifiedTerms[0];
    if (!simplified) return null;

    for (let i = 1; i < simplifiedTerms.length; i++) {
      const term = simplifiedTerms[i];
      if (!term) continue;
      simplified = PatternUtils.createBinaryExpression(simplified, '+', term);
    }

    return PatternUtils.createBinaryExpression(factorNode, '*', simplified);
  }

  private extractTerms(node: BinaryExpression): ASTNode[] {
    const terms: ASTNode[] = [];

    if (node.operator === '+' || node.operator === '-') {
      // Recursively extract terms from left side
      if (
        node.left.type === 'BinaryExpression' &&
        (node.left.operator === '+' || node.left.operator === '-')
      ) {
        terms.push(...this.extractTerms(node.left));
      } else {
        terms.push(node.left);
      }

      // Add right term (with proper sign handling for subtraction)
      terms.push(node.right);
    } else {
      terms.push(node);
    }

    return terms;
  }
}

/**
 * Concrete implementation of DifferenceOfSquaresPattern
 */
export class ConcreteDifferenceOfSquaresPattern implements FactorizationPattern {
  name = 'difference-of-squares';
  description = 'Factor expressions of the form a² - b²';

  matches(node: ASTNode): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '-') {
      return this.isDifferenceOfSquares(node);
    }
    return false;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;

    const binNode = node as BinaryExpression;
    if (binNode.operator !== '-') return null;

    // Extract a and b from a² - b²
    const aSquared = this.extractSquareRoot(binNode.left);
    const bSquared = this.extractSquareRoot(binNode.right);

    if (!aSquared || !bSquared) return null;

    // Create (a - b)(a + b)
    const firstFactor = PatternUtils.createBinaryExpression(aSquared, '-', bSquared);

    const secondFactor = PatternUtils.createBinaryExpression(aSquared, '+', bSquared);

    return PatternUtils.createBinaryExpression(firstFactor, '*', secondFactor);
  }

  private isDifferenceOfSquares(node: BinaryExpression): boolean {
    // Check if both terms are perfect squares
    return this.isPerfectSquare(node.left) && this.isPerfectSquare(node.right);
  }

  private isPerfectSquare(node: ASTNode): boolean {
    // Check if a term is a perfect square (x^2, (expr)^2, etc.)
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return true;
      }
    }
    return false;
  }

  private extractSquareRoot(node: ASTNode): ASTNode | null {
    if (node.type === 'BinaryExpression' && node.operator === '^') {
      if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
        return node.left;
      }
    }
    return null;
  }
}

/**
 * Quadratic factorization pattern: ax² + bx + c = (px + q)(rx + s)
 */
class QuadraticPattern implements FactorizationPattern {
  name = 'quadratic-factorization';
  description = 'Factor quadratic expressions ax² + bx + c';

  matches(node: ASTNode): boolean {
    if (node.type === 'BinaryExpression') {
      const quadratic = this.extractQuadraticCoefficients(node);
      return quadratic !== null && quadratic.a !== 0;
    }
    return false;
  }

  factor(node: ASTNode): ASTNode | null {
    if (!this.matches(node)) return null;

    const quadratic = this.extractQuadraticCoefficients(node);
    if (!quadratic) return null;

    const { a, b, c, variable } = quadratic;

    // Try to find integer factors
    const factors = this.findQuadraticFactors(a, b, c);
    if (!factors) return null;

    const { p, q, r, s } = factors;

    // Build (px + q)(rx + s)
    const firstFactor = this.buildLinearFactor(p, q, variable);
    const secondFactor = this.buildLinearFactor(r, s, variable);

    return PatternUtils.createBinaryExpression(firstFactor, '*', secondFactor);
  }

  private buildLinearFactor(coeff: number, constant: number, variable: string): ASTNode {
    const coeffTerm =
      coeff === 1
        ? PatternUtils.createIdentifier(variable)
        : PatternUtils.createBinaryExpression(
            PatternUtils.createNumber(coeff),
            '*',
            PatternUtils.createIdentifier(variable)
          );

    if (constant === 0) {
      return coeffTerm;
    } else if (constant > 0) {
      // (x + q)
      return PatternUtils.createBinaryExpression(
        coeffTerm,
        '+',
        PatternUtils.createNumber(constant)
      );
    } else {
      // (x - |q|)
      return PatternUtils.createBinaryExpression(
        coeffTerm,
        '-',
        PatternUtils.createNumber(-constant)
      );
    }
  }

  private extractQuadraticCoefficients(node: ASTNode): {
    a: number;
    b: number;
    c: number;
    variable: string;
  } | null {
    // Simple case for x^2 - 3x + 2 style expressions
    const terms = this.parsePolynomialTerms(node);
    if (terms.length === 0) return null;

    let a = 0,
      b = 0,
      c = 0;
    let variable = 'x';

    for (const term of terms) {
      if (term.degree === 2) {
        a = term.coefficient;
        variable = term.variable;
      } else if (term.degree === 1) {
        b = term.coefficient;
      } else if (term.degree === 0) {
        c = term.coefficient;
      }
    }

    return a !== 0 ? { a, b, c, variable } : null;
  }

  private parsePolynomialTerms(node: ASTNode): Array<{
    coefficient: number;
    degree: number;
    variable: string;
  }> {
    // Flatten the sum tree into terms
    const terms: ASTNode[] = [];
    const collectTerms = (n: ASTNode): void => {
      if (n.type === 'BinaryExpression' && (n.operator === '+' || n.operator === '-')) {
        collectTerms(n.left);
        // 右項がマイナスの場合は符号を反転
        if (n.operator === '-') {
          // 右項の係数を反転
          terms.push({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: -1 },
            right: n.right,
          } as ASTNode);
        } else {
          terms.push(n.right);
        }
      } else {
        terms.push(n);
      }
    };
    collectTerms(node);

    // Extract coefficient, degree, variable for each term
    const parsed = terms.map(term => {
      let coefficient = 1;
      let degree = 0;
      let variable = '';
      if (term.type === 'NumberLiteral') {
        coefficient = term.value;
        degree = 0;
        variable = 'x';
      } else if (term.type === 'Identifier') {
        coefficient = 1;
        degree = 1;
        variable = term.name;
      } else if (term.type === 'BinaryExpression') {
        if (term.operator === '*') {
          // 係数×変数 or 係数×累乗
          const left = term.left;
          const right = term.right;
          if (left.type === 'NumberLiteral' && right.type === 'Identifier') {
            coefficient = left.value;
            degree = 1;
            variable = right.name;
          } else if (left.type === 'Identifier' && right.type === 'NumberLiteral') {
            coefficient = right.value;
            degree = 1;
            variable = left.name;
          } else if (
            left.type === 'BinaryExpression' &&
            left.operator === '^' &&
            right.type === 'NumberLiteral'
          ) {
            // (x^2)*3
            if (left.left.type === 'Identifier' && left.right.type === 'NumberLiteral') {
              coefficient = right.value;
              degree = left.right.value;
              variable = left.left.name;
            }
          } else if (
            left.type === 'Identifier' &&
            right.type === 'BinaryExpression' &&
            right.operator === '^'
          ) {
            // x*x^2 = x^3
            if (
              right.left.type === 'Identifier' &&
              right.right.type === 'NumberLiteral' &&
              left.name === right.left.name
            ) {
              coefficient = 1;
              degree = 1 + right.right.value;
              variable = left.name;
            }
          } else if (
            left.type === 'NumberLiteral' &&
            right.type === 'BinaryExpression' &&
            right.operator === '*'
          ) {
            // 2*x*y のような多変数は未対応
            coefficient = left.value;
            degree = 1;
            variable = '?';
          } else if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
            coefficient = left.value * right.value;
            degree = 0;
            variable = 'x';
          } else if (
            left.type === 'NumberLiteral' &&
            right.type === 'BinaryExpression' &&
            right.operator === '^'
          ) {
            if (right.left.type === 'Identifier' && right.right.type === 'NumberLiteral') {
              coefficient = left.value;
              degree = right.right.value;
              variable = right.left.name;
            }
          } else if (left.type === 'NumberLiteral' && right.type === 'BinaryExpression') {
            coefficient = left.value;
            degree = 1;
            variable = '?';
          } else if (left.type === 'NumberLiteral') {
            coefficient = left.value;
            degree = 0;
            variable = 'x';
          }
        } else if (term.operator === '^') {
          // x^2
          if (term.left.type === 'Identifier' && term.right.type === 'NumberLiteral') {
            coefficient = 1;
            degree = term.right.value;
            variable = term.left.name;
          }
        }
      }
      return { coefficient, degree, variable };
    });
    return parsed;
  }

  private findQuadraticFactors(
    a: number,
    b: number,
    c: number
  ): {
    p: number;
    q: number;
    r: number;
    s: number;
  } | null {
    // For a = 1: x^2 + bx + c = (x + p)(x + q), p*q = c, p+q = b
    if (a === 1) {
      for (let p = -20; p <= 20; p++) {
        for (let q = p; q <= 20; q++) {
          if (p * q === c && p + q === b) {
            return { p: 1, q: p, r: 1, s: q };
          }
          if (p !== q && q * p === c && q + p === b) {
            return { p: 1, q: q, r: 1, s: p };
          }
        }
      }
    }
    return null;
  }
}

// Export all patterns
export const FACTORIZATION_PATTERNS = [
  new ConcreteDifferenceOfSquaresPattern(),
  new ConcreteCommonFactorPattern(),
  new QuadraticPattern(),
];
