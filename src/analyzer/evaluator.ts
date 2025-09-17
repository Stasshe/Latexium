/**
 * AST Evaluator
 * Evaluates AST nodes with variable substitution and mathematical operations
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult, MATH_CONSTANTS } from '../types';

/**
 * Evaluate an AST node with given variable values
 */
export function evaluateAST(node: ASTNode, values: Record<string, number> = {}): number {
  switch (node.type) {
    case 'NumberLiteral':
      return node.value;

    case 'Identifier':
      // First check if it's a mathematical constant
      if (node.name in MATH_CONSTANTS) {
        return MATH_CONSTANTS[node.name]!;
      }

      // Then check user-provided values
      if (node.name in values) {
        return values[node.name]!;
      }

      // For bound variables, they should not be evaluated directly
      if (node.scope === 'bound') {
        throw new Error(`Bound variable ${node.name} cannot be evaluated without context`);
      }

      throw new Error(`Undefined variable: ${node.name}`);

    case 'BinaryExpression':
      return evaluateBinaryExpression(node, values);

    case 'UnaryExpression':
      return evaluateUnaryExpression(node, values);

    case 'FunctionCall':
      return evaluateFunctionCall(node, values);

    case 'Fraction': {
      const numerator = evaluateAST(node.numerator, values);
      const denominator = evaluateAST(node.denominator, values);

      if (denominator === 0) {
        throw new Error('Division by zero');
      }

      return numerator / denominator;
    }

    case 'Integral':
    case 'Sum':
    case 'Product':
      throw new Error(`${node.type} evaluation not yet implemented`);

    default:
      throw new Error(`Unsupported AST node type: ${(node as { type: string }).type}`);
  }
}

function evaluateBinaryExpression(
  node: { operator: string; left: ASTNode; right: ASTNode },
  values: Record<string, number>
): number {
  const left = evaluateAST(node.left, values);
  const right = evaluateAST(node.right, values);

  switch (node.operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) {
        throw new Error('Division by zero');
      }
      return left / right;
    case '^':
      return Math.pow(left, right);
    case '=':
      return left === right ? 1 : 0; // Boolean to number conversion
    case '>':
      return left > right ? 1 : 0;
    case '<':
      return left < right ? 1 : 0;
    case '>=':
      return left >= right ? 1 : 0;
    case '<=':
      return left <= right ? 1 : 0;
    default:
      throw new Error(`Unsupported binary operator: ${node.operator}`);
  }
}

function evaluateUnaryExpression(
  node: { operator: string; operand: ASTNode },
  values: Record<string, number>
): number {
  const operand = evaluateAST(node.operand, values);

  switch (node.operator) {
    case '+':
      return operand;
    case '-':
      return -operand;
    default:
      throw new Error(`Unsupported unary operator: ${node.operator}`);
  }
}

function evaluateFunctionCall(
  node: { name: string; args: ASTNode[] },
  values: Record<string, number>
): number {
  const args = node.args.map((arg: ASTNode) => evaluateAST(arg, values));

  if (args.length === 0) {
    throw new Error(`Function ${node.name} requires at least one argument`);
  }

  const firstArg = args[0]!;

  switch (node.name) {
    case 'sin':
      return Math.sin(firstArg);
    case 'cos':
      return Math.cos(firstArg);
    case 'tan':
      return Math.tan(firstArg);
    case 'asin':
      return Math.asin(firstArg);
    case 'acos':
      return Math.acos(firstArg);
    case 'atan':
      return Math.atan(firstArg);
    case 'sinh':
      return Math.sinh(firstArg);
    case 'cosh':
      return Math.cosh(firstArg);
    case 'tanh':
      return Math.tanh(firstArg);
    case 'log':
      return Math.log10(firstArg);
    case 'ln':
      return Math.log(firstArg);
    case 'exp':
      return Math.exp(firstArg);
    case 'sqrt':
      return Math.sqrt(firstArg);
    default:
      throw new Error(`Unsupported function: ${node.name}`);
  }
}

/**
 * Find all free variables in an AST
 */
export function findFreeVariables(node: ASTNode): Set<string> {
  const freeVars = new Set<string>();

  function traverse(n: ASTNode): void {
    switch (n.type) {
      case 'Identifier':
        if (n.scope === 'free' && !MATH_CONSTANTS[n.name]) {
          freeVars.add(n.name);
        }
        break;

      case 'BinaryExpression':
        traverse(n.left);
        traverse(n.right);
        break;

      case 'UnaryExpression':
        traverse(n.operand);
        break;

      case 'FunctionCall':
        n.args.forEach(arg => traverse(arg));
        break;

      case 'Fraction':
        traverse(n.numerator);
        traverse(n.denominator);
        break;

      case 'Integral':
        traverse(n.integrand);
        if (n.lowerBound) traverse(n.lowerBound);
        if (n.upperBound) traverse(n.upperBound);
        break;

      case 'Sum':
      case 'Product':
        traverse(n.expression);
        traverse(n.lowerBound);
        traverse(n.upperBound);
        break;
    }
  }

  traverse(node);
  return freeVars;
}

/**
 * Check if all free variables have assigned values
 */
export function validateVariableAssignment(
  node: ASTNode,
  values: Record<string, number>
): string | null {
  const freeVars = findFreeVariables(node);
  const unassigned = Array.from(freeVars).filter(varName => values[varName] === undefined);

  if (unassigned.length > 0) {
    return `Undefined variables: ${unassigned.join(', ')}`;
  }

  return null;
}

/**
 * Format a number as LaTeX string with appropriate precision
 */
export function formatNumber(value: number, precision: number = 6): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toPrecision(precision);
}

/**
 * Analyze AST with evaluation task
 */
export function analyzeEvaluate(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'evaluate' }
): AnalyzeResult {
  const steps: string[] = [];
  const values = options.values || {};
  const precision = options.precision || 6;

  try {
    // Check for undefined variables
    const validationError = validateVariableAssignment(ast, values);
    if (validationError) {
      return {
        steps: [],
        value: null,
        valueType: 'exact',
        ast: null,
        error: validationError,
      };
    }

    // Add substitution steps
    Object.entries(values).forEach(([varName, varValue]) => {
      steps.push(`Substitution: ${varName} = ${formatNumber(varValue, precision)}`);
    });

    // Evaluate the expression
    const result = evaluateAST(ast, values);

    // Format the result
    const formattedResult = formatNumber(result, precision);
    steps.push(`Result: ${formattedResult}`);

    const analyzeResult: AnalyzeResult = {
      steps,
      value: formattedResult,
      valueType: Number.isInteger(result) ? 'exact' : 'approximate',
      ast: {
        type: 'NumberLiteral',
        value: result,
      },
      error: null,
    };

    if (!Number.isInteger(result)) {
      analyzeResult.precision = precision;
    }

    return analyzeResult;
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'exact',
      ast: null,
      error: error instanceof Error ? error.message : 'Evaluation error',
    };
  }
}
