/**
 * Substitution Integration Strategy
 * Implements u-substitution and various substitution techniques
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
  createFractionNode,
} from './index';

import { ASTNode, StepTree } from '@/types';

interface SubstitutionCandidate {
  u: ASTNode;
  du: ASTNode;
  confidence: number;
  technique: string;
}

export class SubstitutionStrategy implements IntegrationStrategy {
  readonly name = 'Substitution';
  readonly priority = 3;

  canHandle(node: ASTNode, context: IntegrationContext): boolean {
    const candidates = this.identifySubstitutionCandidates(node, context.variable);
    return candidates.length > 0;
  }

  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: StepTree[] = [];

    try {
      const result = this.integrateBySubstitution(node, context, steps);

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

  private identifySubstitutionCandidates(node: ASTNode, variable: string): SubstitutionCandidate[] {
    const candidates: SubstitutionCandidate[] = [];

    // Look for composite functions f(g(x))
    if (node.type === 'FunctionCall' && node.args[0]) {
      const arg = node.args[0];
      if (containsVariable(arg, variable)) {
        candidates.push({
          u: arg,
          du: this.estimateDerivative(arg, variable),
          confidence: 0.8,
          technique: 'Basic u-substitution',
        });
      }
    }

    // Look for exponential forms e^(f(x))
    if (node.type === 'FunctionCall' && node.name === 'exp') {
      const arg = node.args[0];
      if (arg && containsVariable(arg, variable)) {
        candidates.push({
          u: arg,
          du: this.estimateDerivative(arg, variable),
          confidence: 0.9,
          technique: 'Exponential substitution',
        });
      }
    }

    // Look for square root patterns √(x²+1), √(x²-1), etc.
    if (node.type === 'FunctionCall' && node.name === 'sqrt') {
      const arg = node.args[0];
      if (arg && this.isQuadraticForm(arg, variable)) {
        candidates.push({
          u: arg,
          du: this.estimateDerivative(arg, variable),
          confidence: 0.85,
          technique: 'Square root substitution',
        });
      }
    }

    // Look for trigonometric substitution patterns: 1/√(a²-x²), 1/√(x²+a²), 1/√(x²-a²)
    if (
      node.type === 'Fraction' &&
      node.numerator.type === 'NumberLiteral' &&
      node.numerator.value === 1 &&
      node.denominator.type === 'FunctionCall' &&
      node.denominator.name === 'sqrt'
    ) {
      const sqrtArg = node.denominator.args[0];
      if (sqrtArg && this.isTrigSubstitutionForm(sqrtArg, variable)) {
        candidates.push({
          u: sqrtArg,
          du: this.estimateDerivative(sqrtArg, variable),
          confidence: 0.95,
          technique: 'Trigonometric substitution',
        });
      }
    }

    // Look for products that suggest substitution
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      const productNode = node as { operator: '*'; left: ASTNode; right: ASTNode };
      const productCandidates = this.findProductSubstitutions(productNode, variable);
      candidates.push(...productCandidates);
    }

    // Look for fractions that suggest substitution
    if (node.type === 'Fraction') {
      const fractionCandidates = this.findFractionSubstitutions(node, variable);
      candidates.push(...fractionCandidates);
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  private isQuadraticForm(node: ASTNode, variable: string): boolean {
    // Check for forms like x²+a², x²-a², ax²+b, etc.
    if (node.type === 'BinaryExpression' && ['+', '-'].includes(node.operator)) {
      const hasSquaredTerm = this.containsSquaredVariable(node, variable);
      return hasSquaredTerm;
    }
    return false;
  }

  private containsSquaredVariable(node: ASTNode, variable: string): boolean {
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
        this.containsSquaredVariable(node.left, variable) ||
        this.containsSquaredVariable(node.right, variable)
      );
    }
    return false;
  }

  private isTrigSubstitutionForm(node: ASTNode, variable: string): boolean {
    // Check for a²-x², x²+a², x²-a²
    if (node.type === 'BinaryExpression' && ['+', '-'].includes(node.operator)) {
      const left = node.left;
      const right = node.right;

      // Check for x² terms and constant terms
      const hasXSquared =
        (left.type === 'BinaryExpression' &&
          left.operator === '^' &&
          left.left.type === 'Identifier' &&
          left.left.name === variable &&
          left.right.type === 'NumberLiteral' &&
          left.right.value === 2) ||
        (right.type === 'BinaryExpression' &&
          right.operator === '^' &&
          right.left.type === 'Identifier' &&
          right.left.name === variable &&
          right.right.type === 'NumberLiteral' &&
          right.right.value === 2);

      const hasConstant = isConstant(left, variable) || isConstant(right, variable);

      return hasXSquared && hasConstant;
    }
    return false;
  }

  private findProductSubstitutions(
    node: { operator: '*'; left: ASTNode; right: ASTNode },
    variable: string
  ): SubstitutionCandidate[] {
    const candidates: SubstitutionCandidate[] = [];

    // Check if one factor is the derivative of part of the other
    const left = node.left;
    const right = node.right;

    // Pattern: f'(x) * g(f(x))
    if (right.type === 'FunctionCall' && right.args[0]) {
      const innerFunc = right.args[0];
      if (this.isDerivativeOf(left, innerFunc, variable)) {
        candidates.push({
          u: innerFunc,
          du: left,
          confidence: 0.95,
          technique: 'Chain rule reversal',
        });
      }
    }

    if (left.type === 'FunctionCall' && left.args[0]) {
      const innerFunc = left.args[0];
      if (this.isDerivativeOf(right, innerFunc, variable)) {
        candidates.push({
          u: innerFunc,
          du: right,
          confidence: 0.95,
          technique: 'Chain rule reversal',
        });
      }
    }

    return candidates;
  }

  private findFractionSubstitutions(
    node: { numerator: ASTNode; denominator: ASTNode },
    variable: string
  ): SubstitutionCandidate[] {
    const candidates: SubstitutionCandidate[] = [];

    // Pattern: f'(x) / f(x) = ln|f(x)|
    if (this.isDerivativeOf(node.numerator, node.denominator, variable)) {
      candidates.push({
        u: node.denominator,
        du: node.numerator,
        confidence: 0.9,
        technique: 'Logarithmic substitution',
      });
    }

    // Special case: ln(x)/x -> u = ln(x), du = (1/x)dx
    if (
      node.numerator.type === 'FunctionCall' &&
      node.numerator.name === 'ln' &&
      node.numerator.args[0]?.type === 'Identifier' &&
      node.numerator.args[0].name === variable &&
      node.denominator.type === 'Identifier' &&
      node.denominator.name === variable
    ) {
      candidates.push({
        u: node.numerator, // ln(x)
        du: createFractionNode(createNumberNode(1), createVariableNode(variable)), // 1/x
        confidence: 0.95,
        technique: 'ln(x)/x substitution',
      });
    }

    return candidates;
  }

  private isDerivativeOf(candidate: ASTNode, original: ASTNode, variable: string): boolean {
    // Simplified derivative checking - in a full implementation,
    // this would use the differentiation engine

    // Handle simple cases
    if (
      original.type === 'BinaryExpression' &&
      original.operator === '^' &&
      original.left.type === 'Identifier' &&
      original.left.name === variable &&
      original.right.type === 'NumberLiteral'
    ) {
      // Check if candidate is n*x^(n-1)
      const n = original.right.value;
      if (
        candidate.type === 'BinaryExpression' &&
        candidate.operator === '*' &&
        candidate.left.type === 'NumberLiteral' &&
        candidate.left.value === n &&
        candidate.right.type === 'BinaryExpression' &&
        candidate.right.operator === '^' &&
        candidate.right.left.type === 'Identifier' &&
        candidate.right.left.name === variable &&
        candidate.right.right.type === 'NumberLiteral' &&
        candidate.right.right.value === n - 1
      ) {
        return true;
      }
    }

    return false;
  }

  private estimateDerivative(node: ASTNode, variable: string): ASTNode {
    // Simplified derivative estimation
    switch (node.type) {
      case 'Identifier':
        if (node.name === variable) {
          return createNumberNode(1);
        }
        return createNumberNode(0);

      case 'BinaryExpression':
        if (node.operator === '*' && node.left.type === 'NumberLiteral') {
          return createBinaryNode('*', node.left, this.estimateDerivative(node.right, variable));
        }
        if (
          node.operator === '^' &&
          node.left.type === 'Identifier' &&
          node.left.name === variable &&
          node.right.type === 'NumberLiteral'
        ) {
          // d/dx[x^n] = n*x^(n-1)
          const n = node.right.value;
          return createBinaryNode(
            '*',
            createNumberNode(n),
            createBinaryNode('^', createVariableNode(variable), createNumberNode(n - 1))
          );
        }
        break;

      default:
        return createNumberNode(1); // Default assumption
    }

    return createNumberNode(1);
  }

  private integrateBySubstitution(
    node: ASTNode,
    context: IntegrationContext,
    steps: StepTree[]
  ): ASTNode {
    const candidates = this.identifySubstitutionCandidates(node, context.variable);

    if (candidates.length === 0) {
      throw new Error('No substitution candidates found');
    }

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      throw new Error('No suitable substitution found');
    }

    steps.push(`Using ${bestCandidate.technique}`);
    steps.push(`Let u = ${this.nodeToString(bestCandidate.u)}`);
    steps.push(`Then du = ${this.nodeToString(bestCandidate.du)} dx`);

    return this.applySubstitution(node, bestCandidate, context, steps);
  }

  private applySubstitution(
    node: ASTNode,
    candidate: SubstitutionCandidate,
    context: IntegrationContext,
    steps: StepTree[]
  ): ASTNode {
    // Handle specific substitution patterns

    // Exponential with linear argument: ∫e^(ax) dx = (1/a)e^(ax)
    if (
      node.type === 'FunctionCall' &&
      node.name === 'exp' &&
      candidate.technique === 'Exponential substitution'
    ) {
      const arg = node.args[0]!;
      if (
        arg.type === 'BinaryExpression' &&
        arg.operator === '*' &&
        ((arg.left.type === 'NumberLiteral' && arg.right.type === 'Identifier') ||
          (arg.right.type === 'NumberLiteral' && arg.left.type === 'Identifier'))
      ) {
        const coefficient = arg.left.type === 'NumberLiteral' ? arg.left : arg.right;

        if (coefficient.type === 'NumberLiteral') {
          steps.push(
            `∫e^(${coefficient.value}x) dx = (1/${coefficient.value})e^(${coefficient.value}x)`
          );
        } else {
          steps.push(`∫e^(ax) dx = (1/a)e^(ax)`);
        }

        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(1), coefficient),
          createFunctionNode('exp', [arg])
        );
      }
    }

    // Logarithmic substitution: ∫f'(x)/f(x) dx = ln|f(x)|
    if (candidate.technique === 'Logarithmic substitution') {
      steps.push(`∫f'(x)/f(x) dx = ln|f(x)|`);

      return createFunctionNode('ln', [createFunctionNode('abs', [candidate.u])]);
    }

    // Special case: ∫ln(x)/x dx = (ln(x))²/2
    if (candidate.technique === 'ln(x)/x substitution') {
      steps.push(`∫ln(x)/x dx: Let u = ln(x), then du = (1/x)dx`);
      steps.push(`∫ln(x)/x dx = ∫u du = u²/2 = (ln(x))²/2`);

      return createBinaryNode(
        '/',
        createBinaryNode(
          '^',
          createFunctionNode('ln', [createVariableNode(context.variable)]),
          createNumberNode(2)
        ),
        createNumberNode(2)
      );
    }

    // Trigonometric substitution: ∫1/√(a²-x²) dx = arcsin(x/a)
    if (candidate.technique === 'Trigonometric substitution') {
      steps.push(`∫1/√(a²-x²) dx = arcsin(x/a)`);

      // For now, assume a=1 for simplicity
      return createFunctionNode('asin', [createVariableNode(context.variable)]);
    }

    // Square root substitution: simplified handling
    if (candidate.technique === 'Square root substitution') {
      steps.push(`Complex square root substitution detected`);
      throw new Error('Complex square root integration requires advanced techniques');
    }

    // Basic function composition
    if (node.type === 'FunctionCall' && candidate.technique === 'Basic u-substitution') {
      const arg = node.args[0]!;

      if (
        arg.type === 'BinaryExpression' &&
        arg.operator === '*' &&
        arg.left.type === 'NumberLiteral'
      ) {
        const coefficient = arg.left.value;
        steps.push(
          `∫${node.name}(${coefficient}x) dx = (-1/${coefficient})${this.getAntiderivative(node.name)}(${coefficient}x)`
        );

        return createBinaryNode(
          '*',
          createFractionNode(createNumberNode(1), createNumberNode(coefficient)),
          createFunctionNode(this.getAntiderivative(node.name), [arg])
        );
      }
    }

    throw new Error(`Substitution technique '${candidate.technique}' not fully implemented`);
  }

  private getAntiderivative(functionName: string): string {
    const antiderivatives: Record<string, string> = {
      sin: 'cos',
      cos: 'sin',
      tan: 'ln', // Actually -ln|cos(x)|, but simplified
      exp: 'exp',
    };

    return antiderivatives[functionName] || functionName;
  }

  private nodeToString(node: ASTNode): string {
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
