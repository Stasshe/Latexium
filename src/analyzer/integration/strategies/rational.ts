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

import { ASTNode, StepTree } from '@/types';

export class RationalFunctionStrategy implements IntegrationStrategy {
  readonly name = 'Rational Functions';
  readonly priority = 4;

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    return this.isRationalFunction(node, context.variable);
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: StepTree[] = [];

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

  private integrateRational(node: ASTNode, variable: string, steps: StepTree[]): ASTNode {
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
    steps: StepTree[]
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

    // Pattern: (x+1)/(x²-1) = (x+1)/((x-1)(x+1)) = 1/(x-1)
    if (this.isSimplifiableFraction(numerator, denominator, variable)) {
      return this.integrateSimplifiedFraction(numerator, denominator, variable, steps);
    }

    // Pattern: 1/(x²+a²)
    if (this.isFormXSquaredPlusConstant(denominator, variable)) {
      return this.integrateXSquaredPlusConstant(numerator, denominator, variable, steps);
    }

    // Pattern: 1/(x²-a²)
    if (this.isFormXSquaredMinusConstant(denominator, variable)) {
      return this.integrateXSquaredMinusConstant(numerator, denominator, variable, steps);
    }

    // Pattern: (ax+b)/(x²+cx+d) - split into logarithmic and arctangent parts
    if (this.isLinearOverQuadratic(numerator, denominator, variable)) {
      return this.integrateLinearOverQuadratic(numerator, denominator, variable, steps);
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

  private isSimplifiableFraction(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string
  ): boolean {
    // Check for (x+1)/(x²-1) type patterns
    if (
      numerator.type === 'BinaryExpression' &&
      numerator.operator === '+' &&
      numerator.left.type === 'Identifier' &&
      numerator.left.name === variable &&
      numerator.right.type === 'NumberLiteral' &&
      numerator.right.value === 1 &&
      denominator.type === 'BinaryExpression' &&
      denominator.operator === '-' &&
      denominator.left.type === 'BinaryExpression' &&
      denominator.left.operator === '^' &&
      denominator.left.left.type === 'Identifier' &&
      denominator.left.left.name === variable &&
      denominator.left.right.type === 'NumberLiteral' &&
      denominator.left.right.value === 2 &&
      denominator.right.type === 'NumberLiteral' &&
      denominator.right.value === 1
    ) {
      return true;
    }
    return false;
  }

  private integrateSimplifiedFraction(
    numerator: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    // (x+1)/(x²-1) = (x+1)/((x-1)(x+1)) = 1/(x-1)
    steps.push(`Simplifying: (x+1)/(x²-1) = (x+1)/((x-1)(x+1)) = 1/(x-1)`);
    steps.push(`∫1/(x-1) dx = ln|x-1|`);

    return createFunctionNode('ln', [
      createFunctionNode('abs', [
        createBinaryNode('-', createVariableNode(variable), createNumberNode(1)),
      ]),
    ]);
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
    steps: StepTree[]
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
    steps: StepTree[]
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
    steps: StepTree[]
  ): ASTNode {
    // Handle (ax+b)/(x²+c) by splitting into logarithmic and arctangent parts
    // ∫(2x+3)/(x²+4) dx = ∫2x/(x²+4) dx + ∫3/(x²+4) dx
    //                   = ln(x²+4) + (3/2)arctan(x/2)

    if (
      numerator.type === 'BinaryExpression' &&
      (numerator.operator === '+' || numerator.operator === '-') &&
      denominator.type === 'BinaryExpression' &&
      denominator.operator === '+' &&
      this.isFormXSquaredPlusConstant(denominator, variable)
    ) {
      const leftTerm = numerator.left;
      const rightTerm = numerator.right;
      const sign = numerator.operator === '+' ? 1 : -1;

      steps.push(
        `Splitting: ∫(${this.termToString(leftTerm)}${numerator.operator}${this.termToString(rightTerm)})/(x²+c) dx = ∫${this.termToString(leftTerm)}/(x²+c) dx ${numerator.operator} ∫${this.termToString(rightTerm)}/(x²+c) dx`
      );

      // Integrate each part separately
      const leftResult = this.integrateSingleTermOverQuadratic(
        leftTerm,
        denominator,
        variable,
        steps
      );
      const rightResult = this.integrateSingleTermOverQuadratic(
        rightTerm,
        denominator,
        variable,
        steps
      );

      return createBinaryNode(numerator.operator as '+' | '-', leftResult, rightResult);
    }

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

  private integrateSingleTermOverQuadratic(
    term: ASTNode,
    denominator: ASTNode,
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    // Handle constant over (x²+a²): ∫c/(x²+a²) dx = (c/√a)arctan(x/√a)
    if (isConstant(term, variable)) {
      const denom = denominator as {
        type: 'BinaryExpression';
        operator: '+';
        left: ASTNode;
        right: ASTNode;
      };
      const a = denom.right;

      if (a.type === 'NumberLiteral' && a.value > 0) {
        const sqrtA = Math.sqrt(a.value);
        const coefficient = term.type === 'NumberLiteral' ? term.value : 1;

        steps.push(
          `∫${coefficient}/(x²+${a.value}) dx = (${coefficient}/${sqrtA})arctan(x/${sqrtA})`
        );

        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(coefficient), createNumberNode(sqrtA)),
          createFunctionNode('atan', [
            createFractionNode(createVariableNode(variable), createNumberNode(sqrtA)),
          ])
        );
      }
    }

    // Handle cx over (x²+a²): ∫cx/(x²+a²) dx = (c/2)ln(x²+a²)
    if (
      term.type === 'BinaryExpression' &&
      term.operator === '*' &&
      ((isConstant(term.left, variable) &&
        term.right.type === 'Identifier' &&
        term.right.name === variable) ||
        (isConstant(term.right, variable) &&
          term.left.type === 'Identifier' &&
          term.left.name === variable))
    ) {
      const coefficient = isConstant(term.left, variable) ? term.left : term.right;
      const coeffValue = coefficient.type === 'NumberLiteral' ? coefficient.value : 1;

      steps.push(`∫${coeffValue}x/(x²+a²) dx = (${coeffValue}/2)ln(x²+a²)`);

      return createBinaryNode(
        '*',
        createFractionNode(createNumberNode(coeffValue), createNumberNode(2)),
        createFunctionNode('ln', [denominator])
      );
    }

    // Handle x over (x²+a²): ∫x/(x²+a²) dx = (1/2)ln(x²+a²)
    if (term.type === 'Identifier' && term.name === variable) {
      steps.push(`∫x/(x²+a²) dx = (1/2)ln(x²+a²)`);

      return createBinaryNode(
        '*',
        createFractionNode(createNumberNode(1), createNumberNode(2)),
        createFunctionNode('ln', [denominator])
      );
    }

    throw new Error(`Single term integration not supported for: ${this.termToString(term)}`);
  }

  private termToString(node: ASTNode): string {
    if (node.type === 'NumberLiteral') return node.value.toString();
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'BinaryExpression') {
      return `(${this.termToString(node.left)} ${node.operator} ${this.termToString(node.right)})`;
    }
    return 'unknown';
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
    steps: StepTree[]
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
    steps: StepTree[]
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
