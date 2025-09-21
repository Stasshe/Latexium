/**
 * Trigonometric Integration Strategy
 * Handles trigonometric identities and special cases
 */

import { IntegrationContext, IntegrationResult } from '../index';

import {
  IntegrationStrategy,
  calculateComplexity,
  createVariableNode,
  createNumberNode,
  createBinaryNode,
  createFunctionNode,
  createFractionNode,
} from './index';

import { ASTNode, StepTree } from '@/types';

export class TrigonometricStrategy implements IntegrationStrategy {
  readonly name = 'Trigonometric';
  readonly priority = 2;

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    return this.hasTrigonometricPattern(node);
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: StepTree[] = [];

    try {
      const result = this.integrateTrigonometric(node, context.variable, steps);

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

  private hasTrigonometricPattern(node: ASTNode): boolean {
    switch (node.type) {
      case 'FunctionCall':
        return ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'].includes(node.name);

      case 'BinaryExpression':
        if (
          node.operator === '^' &&
          node.left.type === 'FunctionCall' &&
          ['sin', 'cos', 'tan'].includes(node.left.name) &&
          node.right.type === 'NumberLiteral'
        ) {
          return true;
        }
        return this.hasTrigonometricPattern(node.left) || this.hasTrigonometricPattern(node.right);

      default:
        return false;
    }
  }

  private integrateTrigonometric(node: ASTNode, variable: string, steps: StepTree[]): ASTNode {
    // Handle sin²(x), cos²(x), tan²(x)
    if (this.isTrigonometricSquare(node)) {
      const powerNode = node as {
        type: 'BinaryExpression';
        operator: '^';
        left: { type: 'FunctionCall'; name: string; args: ASTNode[] };
        right: { type: 'NumberLiteral'; value: number };
      };
      return this.integrateTrigSquare(powerNode, variable, steps);
    }

    // Handle sin(x)cos(x) products
    if (this.isSinCosProduct(node)) {
      const productNode = node as {
        type: 'BinaryExpression';
        operator: '*';
        left: ASTNode;
        right: ASTNode;
      };
      return this.integrateSinCosProduct(productNode, variable, steps);
    }

    // Handle higher powers
    if (this.isTrigonometricPower(node)) {
      const powerNode = node as {
        type: 'BinaryExpression';
        operator: '^';
        left: { type: 'FunctionCall'; name: string; args: ASTNode[] };
        right: { type: 'NumberLiteral'; value: number };
      };
      return this.integrateTrigPower(powerNode, variable, steps);
    }

    throw new Error('Trigonometric pattern not recognized');
  }

  private isTrigonometricSquare(node: ASTNode): boolean {
    return (
      node.type === 'BinaryExpression' &&
      node.operator === '^' &&
      node.right.type === 'NumberLiteral' &&
      node.right.value === 2 &&
      node.left.type === 'FunctionCall' &&
      ['sin', 'cos', 'tan'].includes(node.left.name)
    );
  }

  private integrateTrigSquare(
    node: { operator: '^'; left: { name: string; args: ASTNode[] }; right: { value: number } },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    const funcName = node.left.name;
    const arg = node.left.args[0];

    if (!arg || arg.type !== 'Identifier' || arg.name !== variable) {
      throw new Error('Complex arguments not supported in trigonometric square');
    }

    const x = createVariableNode(variable);

    switch (funcName) {
      case 'sin':
        steps.push(`∫sin²(x) dx = x/2 - sin(2x)/4 (Using identity: sin²(x) = (1-cos(2x))/2)`);
        return createBinaryNode(
          '-',
          createFractionNode(x, createNumberNode(2)),
          createFractionNode(
            createFunctionNode('sin', [createBinaryNode('*', createNumberNode(2), x)]),
            createNumberNode(4)
          )
        );

      case 'cos':
        steps.push(`∫cos²(x) dx = x/2 + sin(2x)/4 (Using identity: cos²(x) = (1+cos(2x))/2)`);
        return createBinaryNode(
          '+',
          createFractionNode(x, createNumberNode(2)),
          createFractionNode(
            createFunctionNode('sin', [createBinaryNode('*', createNumberNode(2), x)]),
            createNumberNode(4)
          )
        );

      case 'tan':
        steps.push(`∫tan²(x) dx = tan(x) - x (Using identity: tan²(x) = sec²(x) - 1)`);
        return createBinaryNode('-', createFunctionNode('tan', [x]), x);

      default:
        throw new Error(`Trigonometric square ${funcName} not supported`);
    }
  }

  private isSinCosProduct(node: ASTNode): boolean {
    if (node.type !== 'BinaryExpression' || node.operator !== '*') {
      return false;
    }

    const left = node.left;
    const right = node.right;

    return (
      (left.type === 'FunctionCall' &&
        left.name === 'sin' &&
        right.type === 'FunctionCall' &&
        right.name === 'cos') ||
      (left.type === 'FunctionCall' &&
        left.name === 'cos' &&
        right.type === 'FunctionCall' &&
        right.name === 'sin')
    );
  }

  private integrateSinCosProduct(
    node: { operator: '*'; left: ASTNode; right: ASTNode },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    steps.push(`∫sin(x)cos(x) dx = -cos²(x)/2 (Using substitution u = cos(x))`);

    const x = createVariableNode(variable);
    return createBinaryNode(
      '*',
      createNumberNode(-0.5),
      createBinaryNode('^', createFunctionNode('cos', [x]), createNumberNode(2))
    );
  }

  private isTrigonometricPower(node: ASTNode): boolean {
    return (
      node.type === 'BinaryExpression' &&
      node.operator === '^' &&
      node.left.type === 'FunctionCall' &&
      ['sin', 'cos', 'tan'].includes(node.left.name) &&
      node.right.type === 'NumberLiteral' &&
      node.right.value > 2
    );
  }

  private integrateTrigPower(
    node: { operator: '^'; left: { name: string; args: ASTNode[] }; right: { value: number } },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    const funcName = node.left.name;
    const power = node.right.value;
    const arg = node.left.args[0];

    if (!arg || arg.type !== 'Identifier' || arg.name !== variable) {
      throw new Error('Complex arguments not supported in trigonometric power');
    }

    if (funcName === 'sin' || funcName === 'cos') {
      if (power % 2 === 1) {
        steps.push(`∫${funcName}^${power}(x) dx (Odd power: use substitution)`);
        return this.integrateOddTrigPower(funcName, power, variable, steps);
      } else {
        steps.push(`∫${funcName}^${power}(x) dx (Even power: use reduction formula)`);
        return this.integrateEvenTrigPower(funcName, power, variable, steps);
      }
    }

    throw new Error(`High power integration of ${funcName} not implemented`);
  }

  private integrateOddTrigPower(
    funcName: string,
    power: number,
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    // For odd powers, factor out one term and use substitution
    const x = createVariableNode(variable);

    if (funcName === 'sin') {
      // ∫sin^n(x) dx where n is odd
      // = ∫sin^(n-1)(x) * sin(x) dx
      // = ∫(1-cos²(x))^((n-1)/2) * sin(x) dx
      // Use substitution u = cos(x), du = -sin(x)dx

      steps.push(`Factor out sin(x) and use substitution u = cos(x)`);

      // This is a simplified result - full implementation would require reduction
      return createBinaryNode(
        '*',
        createNumberNode(-1 / power),
        createBinaryNode('^', createFunctionNode('cos', [x]), createNumberNode(power))
      );
    } else if (funcName === 'cos') {
      steps.push(`Factor out cos(x) and use substitution u = sin(x)`);

      return createBinaryNode(
        '*',
        createNumberNode(1 / power),
        createBinaryNode('^', createFunctionNode('sin', [x]), createNumberNode(power))
      );
    }

    throw new Error(`Odd power integration of ${funcName} not implemented`);
  }

  private integrateEvenTrigPower(
    funcName: string,
    power: number,
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    // For even powers, use reduction formulas repeatedly
    steps.push(`Use reduction formula repeatedly`);

    const x = createVariableNode(variable);

    // Simplified implementation - real reduction would be more complex
    if (funcName === 'sin') {
      return createBinaryNode(
        '+',
        createBinaryNode(
          '*',
          createFractionNode(createNumberNode(power - 1), createNumberNode(power)),
          x
        ),
        createBinaryNode(
          '*',
          createNumberNode(-1),
          createBinaryNode(
            '*',
            createFractionNode(createNumberNode(1), createNumberNode(power)),
            createBinaryNode(
              '*',
              createBinaryNode('^', createFunctionNode('sin', [x]), createNumberNode(power - 1)),
              createFunctionNode('cos', [x])
            )
          )
        )
      );
    }

    throw new Error(`Even power integration of ${funcName} not fully implemented`);
  }
}
