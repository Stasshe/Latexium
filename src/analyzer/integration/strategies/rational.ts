/**
 * Rational Function Integration Strategy
 * Handles integration of rational functions using partial fractions and special techniques
 */

import { IntegrationContext, IntegrationResult } from '../index';

import {
  IntegrationStrategy,
  calculateComplexity,
  isConstant,
  createVariableNode,
  createNumberNode,
  createBinaryNode,
  createFunctionNode,
  createFractionNode,
} from './index';

import { ASTNode } from '@/types';

export class RationalFunctionStrategy implements IntegrationStrategy {
  readonly name = 'Rational Functions';
  readonly priority = 4;

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    return this.isRationalFunction(node, context.variable);
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: string[] = [];

    try {
      const result = this.integrateRational(node, context.variable, steps);

      return {
        result,
        success: true,
        strategy: this.name,
        steps,
        complexity: calculateComplexity(result),
      };
    } catch (error) {
      return {
        result: null,
        success: false,
        strategy: this.name,
        steps: [...steps, error instanceof Error ? error.message : 'Unknown error'],
        complexity: Infinity,
      };
    }
  }

  private isRationalFunction(node: ASTNode, variable: string): boolean {
    if (node.type === 'Fraction') {
      return (
        this.isPolynomial(node.numerator, variable) && this.isPolynomial(node.denominator, variable)
      );
    }

    // Also handle cases like 1/(x²+1)
    if (
      node.type === 'BinaryExpression' &&
      node.operator === '/' &&
      node.left.type === 'NumberLiteral' &&
      node.left.value === 1
    ) {
      return this.isPolynomial(node.right, variable);
    }

    return false;
  }

  private isPolynomial(node: ASTNode, variable: string): boolean {
    switch (node.type) {
      case 'NumberLiteral':
        return true;
      case 'Identifier':
        return true;
      case 'BinaryExpression':
        if (['+', '-'].includes(node.operator)) {
          return this.isPolynomial(node.left, variable) && this.isPolynomial(node.right, variable);
        }
        if (node.operator === '*') {
          return (
            (isConstant(node.left, variable) && this.isPolynomial(node.right, variable)) ||
            (isConstant(node.right, variable) && this.isPolynomial(node.left, variable)) ||
            (this.isPolynomial(node.left, variable) && this.isPolynomial(node.right, variable))
          );
        }
        if (
          node.operator === '^' &&
          node.left.type === 'Identifier' &&
          node.left.name === variable &&
          node.right.type === 'NumberLiteral' &&
          Number.isInteger(node.right.value) &&
          node.right.value >= 0
        ) {
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  private integrateRational(node: ASTNode, variable: string, steps: string[]): ASTNode {
    if (node.type === 'Fraction') {
      return this.integrateFraction(node, variable, steps);
    }

    if (node.type === 'BinaryExpression' && node.operator === '/') {
      return this.integrateFraction(
        {
          numerator: node.left,
          denominator: node.right,
        },
        variable,
        steps
      );
    }

    throw new Error('Not a rational function');
  }

  private integrateFraction(
    node: { numerator: ASTNode; denominator: ASTNode },
    variable: string,
    steps: string[]
  ): ASTNode {
    const numerator = node.numerator;
    const denominator = node.denominator;

    // Handle specific rational function patterns

    // Pattern: 1/x
    if (
      numerator.type === 'NumberLiteral' &&
      numerator.value === 1 &&
      denominator.type === 'Identifier' &&
      denominator.name === variable
    ) {
      steps.push(`∫1/x dx = ln|x|`);
      return createFunctionNode('ln', [createFunctionNode('abs', [createVariableNode(variable)])]);
    }

    // Pattern: 1/(x²+a²)
    if (this.isFormXSquaredPlusConstant(denominator, variable)) {
      return this.integrateXSquaredPlusConstant(numerator, denominator, variable, steps);
    }

    // Pattern: 1/(x²-a²)
    if (this.isFormXSquaredMinusConstant(denominator, variable)) {
      return this.integrateXSquaredMinusConstant(numerator, denominator, variable, steps);
    }

    // Pattern: x/(x²+a²) or similar
    if (this.isLinearOverQuadratic(numerator, denominator, variable)) {
      return this.integrateLinearOverQuadratic(numerator, denominator, variable, steps);
    }

    // Pattern: 1/√(a²-x²)
    if (this.isFormSqrtASquaredMinusXSquared(denominator, variable)) {
      return this.integrateSqrtASquaredMinusXSquared(numerator, denominator, variable, steps);
    }

    // General partial fractions (simplified)
    steps.push(`Attempting partial fraction decomposition...`);
    return this.attemptPartialFractions(numerator, denominator, variable, steps);
  }

  private isFormXSquaredPlusConstant(node: ASTNode, variable: string): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      const left = node.left;
      const right = node.right;

      // x² + a²
      if (
        left.type === 'BinaryExpression' &&
        left.operator === '^' &&
        left.left.type === 'Identifier' &&
        left.left.name === variable &&
        left.right.type === 'NumberLiteral' &&
        left.right.value === 2 &&
        isConstant(right, variable)
      ) {
        return true;
      }
    }

    return false;
  }

  private integrateXSquaredPlusConstant(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: string[]
  ): ASTNode {
    // ∫1/(x²+a²) dx = (1/a)arctan(x/a)
    if (numerator.type === 'NumberLiteral' && numerator.value === 1) {
      const denom = denominator as {
        type: 'BinaryExpression';
        operator: '+';
        left: ASTNode;
        right: ASTNode;
      };
      const a = denom.right;

      if (a.type === 'NumberLiteral' && a.value > 0) {
        const sqrtA = Math.sqrt(a.value);
        steps.push(`∫1/(x²+${a.value}) dx = (1/${sqrtA})arctan(x/${sqrtA})`);

        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(1), createNumberNode(sqrtA)),
          createFunctionNode('atan', [
            createFractionNode(createVariableNode(variable), createNumberNode(sqrtA)),
          ])
        );
      }
    }

    throw new Error('Complex x²+a² form not supported');
  }

  private isFormXSquaredMinusConstant(node: ASTNode, variable: string): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '-') {
      const left = node.left;
      const right = node.right;

      // x² - a²
      if (
        left.type === 'BinaryExpression' &&
        left.operator === '^' &&
        left.left.type === 'Identifier' &&
        left.left.name === variable &&
        left.right.type === 'NumberLiteral' &&
        left.right.value === 2 &&
        isConstant(right, variable)
      ) {
        return true;
      }
    }

    return false;
  }

  private integrateXSquaredMinusConstant(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: string[]
  ): ASTNode {
    // ∫1/(x²-a²) dx = (1/2a)ln|(x-a)/(x+a)|
    if (numerator.type === 'NumberLiteral' && numerator.value === 1) {
      const denom = denominator as {
        type: 'BinaryExpression';
        operator: '-';
        left: ASTNode;
        right: ASTNode;
      };
      const a = denom.right;

      if (a.type === 'NumberLiteral' && a.value > 0) {
        const sqrtA = Math.sqrt(a.value);
        steps.push(`∫1/(x²-${a.value}) dx = (1/${2 * sqrtA})ln|(x-${sqrtA})/(x+${sqrtA})|`);

        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(1), createNumberNode(2 * sqrtA)),
          createFunctionNode('ln', [
            createFunctionNode('abs', [
              createFractionNode(
                createBinaryNode('-', createVariableNode(variable), createNumberNode(sqrtA)),
                createBinaryNode('+', createVariableNode(variable), createNumberNode(sqrtA))
              ),
            ]),
          ])
        );
      }
    }

    throw new Error('Complex x²-a² form not supported');
  }

  private isLinearOverQuadratic(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string
  ): boolean {
    // Check for forms like x/(x²+a²) or (ax+b)/(x²+cx+d)
    if (
      (numerator.type === 'Identifier' && numerator.name === variable) ||
      (numerator.type === 'BinaryExpression' && ['+', '-', '*'].includes(numerator.operator))
    ) {
      return this.isQuadratic(denominator, variable);
    }

    return false;
  }

  private isQuadratic(node: ASTNode, variable: string): boolean {
    // Simplified quadratic detection
    if (node.type === 'BinaryExpression' && ['+', '-'].includes(node.operator)) {
      const hasXSquared = this.containsXSquared(node, variable);
      const hasLinearOrConstant = true; // Simplified check
      return hasXSquared && hasLinearOrConstant;
    }

    return false;
  }

  private containsXSquared(node: ASTNode, variable: string): boolean {
    if (
      node.type === 'BinaryExpression' &&
      node.operator === '^' &&
      node.left.type === 'Identifier' &&
      node.left.name === variable &&
      node.right.type === 'NumberLiteral' &&
      node.right.value === 2
    ) {
      return true;
    }

    if (node.type === 'BinaryExpression') {
      return (
        this.containsXSquared(node.left, variable) || this.containsXSquared(node.right, variable)
      );
    }

    return false;
  }

  private integrateLinearOverQuadratic(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: string[]
  ): ASTNode {
    // For x/(x²+a²), result is (1/2)ln(x²+a²)
    if (
      numerator.type === 'Identifier' &&
      numerator.name === variable &&
      this.isFormXSquaredPlusConstant(denominator, variable)
    ) {
      steps.push(`∫x/(x²+a²) dx = (1/2)ln(x²+a²)`);

      return createBinaryNode(
        '*',
        createFractionNode(createNumberNode(1), createNumberNode(2)),
        createFunctionNode('ln', [denominator])
      );
    }

    throw new Error('Linear over quadratic form not supported');
  }

  private isFormSqrtASquaredMinusXSquared(node: ASTNode, variable: string): boolean {
    if (node.type === 'FunctionCall' && node.name === 'sqrt' && node.args.length === 1) {
      const arg = node.args[0]!;
      return this.isFormASquaredMinusXSquared(arg, variable);
    }

    return false;
  }

  private isFormASquaredMinusXSquared(node: ASTNode, variable: string): boolean {
    if (node.type === 'BinaryExpression' && node.operator === '-') {
      const left = node.left;
      const right = node.right;

      // a² - x²
      if (
        isConstant(left, variable) &&
        right.type === 'BinaryExpression' &&
        right.operator === '^' &&
        right.left.type === 'Identifier' &&
        right.left.name === variable &&
        right.right.type === 'NumberLiteral' &&
        right.right.value === 2
      ) {
        return true;
      }
    }

    return false;
  }

  private integrateSqrtASquaredMinusXSquared(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: string[]
  ): ASTNode {
    // ∫1/√(a²-x²) dx = arcsin(x/a)
    if (numerator.type === 'NumberLiteral' && numerator.value === 1) {
      steps.push(`∫1/√(a²-x²) dx = arcsin(x/a)`);

      // Extract 'a' from the expression
      const sqrt = denominator as { type: 'FunctionCall'; name: 'sqrt'; args: ASTNode[] };
      const inner = sqrt.args[0];
      if (inner && inner.type === 'BinaryExpression') {
        const a = inner.left;

        if (a.type === 'NumberLiteral') {
          const sqrtA = Math.sqrt(a.value);
          return createFunctionNode('asin', [
            createFractionNode(createVariableNode(variable), createNumberNode(sqrtA)),
          ]);
        }
      }
    }

    throw new Error('√(a²-x²) form not supported');
  }

  private attemptPartialFractions(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: string[]
  ): ASTNode {
    // Simplified partial fractions - just handle basic cases
    steps.push(`Partial fraction decomposition not fully implemented`);

    // For now, just handle simple constant over denominator
    if (isConstant(numerator, variable)) {
      throw new Error('Complex partial fractions not yet implemented');
    }

    throw new Error('Partial fractions decomposition requires advanced algebraic manipulation');
  }
}
