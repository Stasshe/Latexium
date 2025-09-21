/**
 * Basic Integration Strategy
 * Handles elementary functions and simple rules
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

export class BasicIntegrationStrategy implements IntegrationStrategy {
  readonly name = 'Basic Integration';
  readonly priority = 1;

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    // Can handle most basic node types
    return [
      'NumberLiteral',
      'Identifier',
      'BinaryExpression',
      'UnaryExpression',
      'FunctionCall',
    ].includes(node.type);
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: StepTree[] = [];

    try {
      const result = this.integrateNode(node, context.variable, steps);

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

  private integrateNode(node: ASTNode, variable: string, steps: StepTree[]): ASTNode {
    switch (node.type) {
      case 'NumberLiteral':
        steps.push(`∫${node.value} dx = ${node.value}x`);
        return createBinaryNode('*', node, createVariableNode(variable));

      case 'Identifier':
        if (node.name === variable && node.scope === 'free') {
          steps.push(`∫x dx = x²/2`);
          return createFractionNode(
            createBinaryNode('^', createVariableNode(variable), createNumberNode(2)),
            createNumberNode(2)
          );
        } else {
          steps.push(`∫${node.name} dx = ${node.name}x (constant)`);
          return createBinaryNode('*', node, createVariableNode(variable));
        }

      case 'BinaryExpression':
        return this.integrateBinaryExpression(node, variable, steps);

      case 'UnaryExpression':
        return this.integrateUnaryExpression(node, variable, steps);

      case 'FunctionCall':
        return this.integrateFunctionCall(node, variable, steps);

      default:
        throw new Error(`Basic integration cannot handle ${node.type}`);
    }
  }

  private integrateBinaryExpression(
    node: { operator: string; left: ASTNode; right: ASTNode },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    switch (node.operator) {
      case '+':
      case '-':
        steps.push(`∫(u ${node.operator} v) dx = ∫u dx ${node.operator} ∫v dx`);
        return createBinaryNode(
          node.operator as '+' | '-',
          this.integrateNode(node.left, variable, steps),
          this.integrateNode(node.right, variable, steps)
        );

      case '*':
        if (isConstant(node.left, variable)) {
          steps.push(`∫c·f(x) dx = c·∫f(x) dx`);
          return createBinaryNode('*', node.left, this.integrateNode(node.right, variable, steps));
        } else if (isConstant(node.right, variable)) {
          steps.push(`∫f(x)·c dx = c·∫f(x) dx`);
          return createBinaryNode('*', node.right, this.integrateNode(node.left, variable, steps));
        } else {
          throw new Error('Product integration requires advanced strategies');
        }

      case '/':
        if (isConstant(node.right, variable)) {
          steps.push(`∫f(x)/c dx = (1/c)·∫f(x) dx`);
          return createFractionNode(this.integrateNode(node.left, variable, steps), node.right);
        } else {
          throw new Error('Complex fraction integration requires advanced strategies');
        }

      case '^':
        return this.integratePower(node, variable, steps);

      default:
        throw new Error(`Basic integration cannot handle operator ${node.operator}`);
    }
  }

  private integratePower(
    node: { left: ASTNode; right: ASTNode },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    if (
      node.left.type === 'Identifier' &&
      node.left.name === variable &&
      isConstant(node.right, variable)
    ) {
      const exponent = node.right;

      // Special case: x^(-1) = 1/x
      if (exponent.type === 'NumberLiteral' && exponent.value === -1) {
        steps.push(`∫x⁻¹ dx = ln|x|`);
        return createFunctionNode('ln', [
          createFunctionNode('abs', [createVariableNode(variable)]),
        ]);
      }

      // General power rule: ∫x^n dx = x^(n+1)/(n+1)
      steps.push(`∫x^n dx = x^(n+1)/(n+1) (Power rule)`);
      const newExponent = createBinaryNode('+', exponent, createNumberNode(1));

      return createFractionNode(
        createBinaryNode('^', createVariableNode(variable), newExponent),
        newExponent
      );
    }

    throw new Error('Complex power integration requires advanced strategies');
  }

  private integrateUnaryExpression(
    node: { operator: string; operand: ASTNode },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    const integral = this.integrateNode(node.operand, variable, steps);

    switch (node.operator) {
      case '+':
        return integral;
      case '-':
        steps.push(`∫(-f(x)) dx = -∫f(x) dx`);
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: integral,
        };
      default:
        throw new Error(`Unsupported unary operator: ${node.operator}`);
    }
  }

  private integrateFunctionCall(
    node: { name: string; args: ASTNode[] },
    variable: string,
    steps: StepTree[]
  ): ASTNode {
    if (node.args.length !== 1) {
      throw new Error(`Function ${node.name} requires exactly 1 argument for basic integration`);
    }

    const arg = node.args[0]!;

    // Only handle simple case where argument is the variable
    if (arg.type === 'Identifier' && arg.name === variable) {
      return this.integrateBasicFunction(node.name, arg, steps);
    }

    throw new Error(`Complex function arguments require substitution strategy`);
  }

  private integrateBasicFunction(functionName: string, arg: ASTNode, steps: StepTree[]): ASTNode {
    switch (functionName) {
      case 'sin':
        steps.push(`∫sin(x) dx = -cos(x)`);
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: createFunctionNode('cos', [arg]),
        };

      case 'cos':
        steps.push(`∫cos(x) dx = sin(x)`);
        return createFunctionNode('sin', [arg]);

      case 'exp':
        steps.push(`∫e^x dx = e^x`);
        return createFunctionNode('exp', [arg]);

      case 'tan':
        steps.push(`∫tan(x) dx = -ln|cos(x)|`);
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: createFunctionNode('ln', [
            createFunctionNode('abs', [createFunctionNode('cos', [arg])]),
          ]),
        };

      case 'sqrt':
        steps.push(`∫√x dx = (2/3)x^(3/2)`);
        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(2), createNumberNode(3)),
          createBinaryNode('^', arg, createFractionNode(createNumberNode(3), createNumberNode(2)))
        );

      case 'sinh':
        steps.push(`∫sinh(x) dx = cosh(x)`);
        return createFunctionNode('cosh', [arg]);

      case 'cosh':
        steps.push(`∫cosh(x) dx = sinh(x)`);
        return createFunctionNode('sinh', [arg]);

      case 'tanh':
        steps.push(`∫tanh(x) dx = ln(cosh(x))`);
        return createFunctionNode('ln', [createFunctionNode('cosh', [arg])]);

      default:
        throw new Error(`Basic integration of ${functionName} not supported`);
    }
  }
}
