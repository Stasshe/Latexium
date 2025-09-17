/**
 * Integration by Parts Strategy
 * Implements the integration by parts formula: ∫u dv = uv - ∫v du
 */

import { IntegrationContext, IntegrationResult } from '../index';

import {
  IntegrationStrategy,
  calculateComplexity,
  isConstant,
  containsVariable,
  createVariableNode,
  createNumberNode,
  createBinaryNode,
  createFunctionNode,
} from './index';

import { ASTNode } from '@/types';

interface PartsDivision {
  u: ASTNode;
  dv: ASTNode;
  priority: number;
  reasoning: string;
}

export class IntegrationByPartsStrategy implements IntegrationStrategy {
  readonly name = 'Integration by Parts';
  readonly priority = 5;

  // LIATE rule priorities (lower = higher priority for u)
  private readonly LIATE_PRIORITY = {
    ln: 1, // Logarithmic
    log: 1,
    asin: 2, // Inverse trigonometric
    acos: 2,
    atan: 2,
    polynomial: 3, // Algebraic (polynomial)
    sin: 4, // Trigonometric
    cos: 4,
    tan: 4,
    exp: 5, // Exponential
  };

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    return this.canApplyIntegrationByParts(node, context.variable);
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: string[] = [];

    try {
      // Prevent infinite recursion
      if (context.depth >= context.maxDepth) {
        throw new Error('Maximum recursion depth reached');
      }

      const result = this.integrateByParts(node, context, steps);

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

  private canApplyIntegrationByParts(node: ASTNode, variable: string): boolean {
    // Single functions that require integration by parts
    if (node.type === 'FunctionCall') {
      return ['ln', 'log', 'asin', 'acos', 'atan'].includes(node.name);
    }

    // Look for products that can benefit from integration by parts
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      const left = node.left;
      const right = node.right;

      // Both parts must contain the variable
      if (!containsVariable(left, variable) || !containsVariable(right, variable)) {
        return false;
      }

      // Check for specific patterns that benefit from integration by parts:

      // Pattern 1: polynomial * logarithmic (e.g., x * ln(x), x² * ln(x))
      if (
        this.isPolynomial(left) &&
        right.type === 'FunctionCall' &&
        ['ln', 'log'].includes(right.name)
      ) {
        return true;
      }
      if (
        this.isPolynomial(right) &&
        left.type === 'FunctionCall' &&
        ['ln', 'log'].includes(left.name)
      ) {
        return true;
      }

      // Pattern 2: polynomial * exponential (e.g., x * e^x)
      if (this.isPolynomial(left) && right.type === 'FunctionCall' && right.name === 'exp') {
        return true;
      }
      if (this.isPolynomial(right) && left.type === 'FunctionCall' && left.name === 'exp') {
        return true;
      }

      // Pattern 3: polynomial * inverse trigonometric
      if (
        this.isPolynomial(left) &&
        right.type === 'FunctionCall' &&
        ['asin', 'acos', 'atan'].includes(right.name)
      ) {
        return true;
      }
      if (
        this.isPolynomial(right) &&
        left.type === 'FunctionCall' &&
        ['asin', 'acos', 'atan'].includes(left.name)
      ) {
        return true;
      }

      // Pattern 4: polynomial * trigonometric (sometimes beneficial)
      if (
        this.isPolynomial(left) &&
        right.type === 'FunctionCall' &&
        ['sin', 'cos', 'tan'].includes(right.name)
      ) {
        return true;
      }
      if (
        this.isPolynomial(right) &&
        left.type === 'FunctionCall' &&
        ['sin', 'cos', 'tan'].includes(left.name)
      ) {
        return true;
      }
    }

    return false;
  }

  private integrateByParts(node: ASTNode, context: IntegrationContext, steps: string[]): ASTNode {
    const variable = context.variable;

    // Handle special single-function cases
    if (node.type === 'FunctionCall' && ['ln', 'log', 'asin', 'acos', 'atan'].includes(node.name)) {
      return this.integrateSingleFunctionByParts(node, variable, steps);
    }

    // Handle products
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      const productNode = node as { operator: '*'; left: ASTNode; right: ASTNode };
      return this.integrateProductByParts(productNode, context, steps);
    }

    throw new Error('Node not suitable for integration by parts');
  }

  private integrateSingleFunctionByParts(
    node: { name: string; args: ASTNode[] },
    variable: string,
    steps: string[]
  ): ASTNode {
    const arg = node.args[0];
    if (!arg || arg.type !== 'Identifier' || arg.name !== variable) {
      throw new Error('Complex arguments not supported in single function integration by parts');
    }

    const x = createVariableNode(variable);

    switch (node.name) {
      case 'ln':
        steps.push(`∫ln(x) dx: Let u = ln(x), dv = dx`);
        steps.push(`Then du = (1/x)dx, v = x`);
        steps.push(`∫ln(x) dx = x·ln(x) - ∫x·(1/x) dx = x·ln(x) - ∫1 dx = x·ln(x) - x`);

        return createBinaryNode('-', createBinaryNode('*', x, createFunctionNode('ln', [x])), x);

      case 'log':
        steps.push(`∫log₁₀(x) dx: Let u = log₁₀(x), dv = dx`);
        steps.push(`∫log₁₀(x) dx = x·log₁₀(x) - x/ln(10)`);

        return createBinaryNode(
          '-',
          createBinaryNode('*', x, createFunctionNode('log', [x])),
          createBinaryNode(
            '*',
            x,
            createBinaryNode(
              '/',
              createNumberNode(1),
              createFunctionNode('ln', [createNumberNode(10)])
            )
          )
        );

      case 'asin':
        steps.push(`∫arcsin(x) dx: Let u = arcsin(x), dv = dx`);
        steps.push(`∫arcsin(x) dx = x·arcsin(x) + √(1-x²)`);

        return createBinaryNode(
          '+',
          createBinaryNode('*', x, createFunctionNode('asin', [x])),
          createFunctionNode('sqrt', [
            createBinaryNode(
              '-',
              createNumberNode(1),
              createBinaryNode('^', x, createNumberNode(2))
            ),
          ])
        );

      case 'acos':
        steps.push(`∫arccos(x) dx: Let u = arccos(x), dv = dx`);
        steps.push(`∫arccos(x) dx = x·arccos(x) - √(1-x²)`);

        return createBinaryNode(
          '-',
          createBinaryNode('*', x, createFunctionNode('acos', [x])),
          createFunctionNode('sqrt', [
            createBinaryNode(
              '-',
              createNumberNode(1),
              createBinaryNode('^', x, createNumberNode(2))
            ),
          ])
        );

      case 'atan':
        steps.push(`∫arctan(x) dx: Let u = arctan(x), dv = dx`);
        steps.push(`∫arctan(x) dx = x·arctan(x) - (1/2)ln(1+x²)`);

        return createBinaryNode(
          '-',
          createBinaryNode('*', x, createFunctionNode('atan', [x])),
          createBinaryNode(
            '*',
            createBinaryNode('/', createNumberNode(1), createNumberNode(2)),
            createFunctionNode('ln', [
              createBinaryNode(
                '+',
                createNumberNode(1),
                createBinaryNode('^', x, createNumberNode(2))
              ),
            ])
          )
        );

      default:
        throw new Error(`Single function integration by parts for ${node.name} not implemented`);
    }
  }

  private integrateProductByParts(
    node: { operator: '*'; left: ASTNode; right: ASTNode },
    context: IntegrationContext,
    steps: string[]
  ): ASTNode {
    const divisions = this.identifyPartsDivisions(node.left, node.right, context.variable);

    if (divisions.length === 0) {
      throw new Error('No suitable division found for integration by parts');
    }

    // Choose the best division (lowest priority score)
    const bestDivision = divisions.reduce((best, current) =>
      current.priority < best.priority ? current : best
    );

    steps.push(`Integration by parts: ${bestDivision.reasoning}`);
    steps.push(
      `Let u = ${this.nodeToString(bestDivision.u)}, dv = ${this.nodeToString(bestDivision.dv)} dx`
    );

    return this.applyIntegrationByParts(bestDivision, context, steps);
  }

  private identifyPartsDivisions(left: ASTNode, right: ASTNode, variable: string): PartsDivision[] {
    const divisions: PartsDivision[] = [];

    // Try left as u, right as dv
    const leftPriority = this.getFunctionPriority(left);
    const rightPriority = this.getFunctionPriority(right);

    if (leftPriority <= rightPriority) {
      divisions.push({
        u: left,
        dv: right,
        priority: leftPriority,
        reasoning: `LIATE rule: ${this.getFunctionType(left)} before ${this.getFunctionType(right)}`,
      });
    }

    // Try right as u, left as dv
    if (rightPriority <= leftPriority) {
      divisions.push({
        u: right,
        dv: left,
        priority: rightPriority,
        reasoning: `LIATE rule: ${this.getFunctionType(right)} before ${this.getFunctionType(left)}`,
      });
    }

    return divisions;
  }

  private getFunctionPriority(node: ASTNode): number {
    if (node.type === 'FunctionCall') {
      return this.LIATE_PRIORITY[node.name as keyof typeof this.LIATE_PRIORITY] || 6;
    }

    if (this.isPolynomial(node)) {
      return this.LIATE_PRIORITY['polynomial'];
    }

    return 6; // Default high priority
  }

  private getFunctionType(node: ASTNode): string {
    if (node.type === 'FunctionCall') {
      if (['ln', 'log'].includes(node.name)) return 'Logarithmic';
      if (['asin', 'acos', 'atan'].includes(node.name)) return 'Inverse Trigonometric';
      if (['sin', 'cos', 'tan'].includes(node.name)) return 'Trigonometric';
      if (node.name === 'exp') return 'Exponential';
    }

    if (this.isPolynomial(node)) return 'Algebraic';

    return 'Unknown';
  }

  private isPolynomial(node: ASTNode): boolean {
    switch (node.type) {
      case 'NumberLiteral':
        return true;
      case 'Identifier':
        return true;
      case 'BinaryExpression':
        if (
          node.operator === '^' &&
          node.left.type === 'Identifier' &&
          node.right.type === 'NumberLiteral' &&
          node.right.value >= 0
        ) {
          return true;
        }
        if (['+', '-', '*'].includes(node.operator)) {
          return this.isPolynomial(node.left) && this.isPolynomial(node.right);
        }
        return false;
      default:
        return false;
    }
  }

  private applyIntegrationByParts(
    division: PartsDivision,
    context: IntegrationContext,
    steps: string[]
  ): ASTNode {
    const u = division.u;
    const dv = division.dv;
    const variable = context.variable;

    steps.push(`Computing du and v...`);

    // Handle specific common cases
    if (this.isSpecificCase(u, dv, variable)) {
      return this.handleSpecificCase(u, dv, variable, steps);
    }

    steps.push(`Applying formula: ∫u dv = uv - ∫v du`);
    throw new Error('General integration by parts not yet fully implemented');
  }

  private isSpecificCase(u: ASTNode, dv: ASTNode, variable: string): boolean {
    // x * e^x case
    if (
      u.type === 'Identifier' &&
      u.name === variable &&
      dv.type === 'FunctionCall' &&
      dv.name === 'exp' &&
      dv.args.length === 1 &&
      dv.args[0]?.type === 'Identifier' &&
      dv.args[0].name === variable
    ) {
      return true;
    }

    // x^n * ln(x) case
    if (
      dv.type === 'FunctionCall' &&
      dv.name === 'ln' &&
      dv.args.length === 1 &&
      dv.args[0]?.type === 'Identifier' &&
      dv.args[0].name === variable
    ) {
      return true;
    }

    // ln(x) * 1 case (already handled in single function)
    return false;
  }

  private handleSpecificCase(u: ASTNode, dv: ASTNode, variable: string, steps: string[]): ASTNode {
    const x = createVariableNode(variable);

    // x * e^x case: ∫x·e^x dx = e^x(x-1)
    if (
      u.type === 'Identifier' &&
      u.name === variable &&
      dv.type === 'FunctionCall' &&
      dv.name === 'exp' &&
      dv.args.length === 1 &&
      dv.args[0]?.type === 'Identifier' &&
      dv.args[0].name === variable
    ) {
      steps.push(`∫x·e^x dx: Let u = x, dv = e^x dx`);
      steps.push(`Then du = dx, v = e^x`);
      steps.push(`∫x·e^x dx = x·e^x - ∫e^x dx = x·e^x - e^x = e^x(x-1)`);

      return createBinaryNode(
        '*',
        createFunctionNode('exp', [x]),
        createBinaryNode('-', x, createNumberNode(1))
      );
    }

    // x^2 * ln(x) case: ∫x²·ln(x) dx = (x³/3)ln(x) - x³/9
    if (
      u.type === 'BinaryExpression' &&
      u.operator === '^' &&
      u.left.type === 'Identifier' &&
      u.left.name === variable &&
      u.right.type === 'NumberLiteral' &&
      u.right.value === 2 &&
      dv.type === 'FunctionCall' &&
      dv.name === 'ln' &&
      dv.args.length === 1 &&
      dv.args[0]?.type === 'Identifier' &&
      dv.args[0].name === variable
    ) {
      steps.push(`∫x²·ln(x) dx: Let u = ln(x), dv = x² dx`);
      steps.push(`Then du = (1/x)dx, v = x³/3`);
      steps.push(
        `∫x²·ln(x) dx = (x³/3)ln(x) - ∫(x³/3)·(1/x) dx = (x³/3)ln(x) - ∫x²/3 dx = (x³/3)ln(x) - x³/9`
      );

      return createBinaryNode(
        '-',
        createBinaryNode(
          '*',
          createBinaryNode('/', createBinaryNode('^', x, createNumberNode(3)), createNumberNode(3)),
          createFunctionNode('ln', [x])
        ),
        createBinaryNode('/', createBinaryNode('^', x, createNumberNode(3)), createNumberNode(9))
      );
    }

    // x * ln(x) case
    if (
      u.type === 'Identifier' &&
      u.name === variable &&
      dv.type === 'FunctionCall' &&
      dv.name === 'ln' &&
      dv.args.length === 1 &&
      dv.args[0]?.type === 'Identifier' &&
      dv.args[0].name === variable
    ) {
      steps.push(`∫x·ln(x) dx: Let u = ln(x), dv = x dx`);
      steps.push(`Then du = (1/x)dx, v = x²/2`);
      steps.push(
        `∫x·ln(x) dx = (x²/2)ln(x) - ∫(x²/2)·(1/x) dx = (x²/2)ln(x) - ∫x/2 dx = (x²/2)ln(x) - x²/4`
      );

      return createBinaryNode(
        '-',
        createBinaryNode(
          '*',
          createBinaryNode('/', createBinaryNode('^', x, createNumberNode(2)), createNumberNode(2)),
          createFunctionNode('ln', [x])
        ),
        createBinaryNode('/', createBinaryNode('^', x, createNumberNode(2)), createNumberNode(4))
      );
    }

    throw new Error('Specific case not implemented');
  }

  private nodeToString(node: ASTNode): string {
    // Simple string representation for logging
    switch (node.type) {
      case 'NumberLiteral':
        return node.value.toString();
      case 'Identifier':
        return node.name;
      case 'FunctionCall':
        return `${node.name}(${node.args.map(arg => this.nodeToString(arg)).join(', ')})`;
      case 'BinaryExpression':
        return `(${this.nodeToString(node.left)} ${node.operator} ${this.nodeToString(node.right)})`;
      default:
        return node.type;
    }
  }
}
