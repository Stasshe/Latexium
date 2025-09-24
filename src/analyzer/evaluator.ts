/**
 * AST Evaluator
 * Evaluates AST nodes with variable substitution and mathematical operations
 */

import { astToLatex } from '../engine/ast';
import { simplify } from '../engine/unified-simplify';
import { extractFreeVariables } from '../engine/variables';
import { ASTNode, AnalyzeOptions, AnalyzeResult, MATH_CONSTANTS, StepTree } from '../types';

/**
 * Evaluate an AST node with given variable values
 */
export function evaluateAST(node: ASTNode, values: Record<string, number> = {}): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      return node;

    case 'Identifier':
      // First check if it's a mathematical constant
      if (node.name in MATH_CONSTANTS) {
        return { type: 'NumberLiteral', value: MATH_CONSTANTS[node.name]! };
      }

      // Handle imaginary unit 'i' - it stays symbolic in evaluation
      if (node.name === 'i' || node.name === 'I') {
        throw new Error('Imaginary unit i cannot be evaluated numerically');
      }

      // Then check user-provided values
      if (node.name in values) {
        return { type: 'NumberLiteral', value: values[node.name]! };
      }

      // For bound variables, they should not be evaluated directly
      if (node.scope === 'bound') {
        throw new Error(`Bound variable ${node.name} cannot be evaluated without context`);
      }

      throw new Error(`Undefined variable: ${node.name}`);

    case 'BinaryExpression': {
      const left = evaluateAST(node.left, values);
      const right = evaluateAST(node.right, values);
      if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
        return {
          type: 'NumberLiteral',
          value: evaluateBinaryExpression({ ...node, left, right }, values),
        };
      } else {
        return { ...node, left, right };
      }
    }

    case 'UnaryExpression': {
      const operand = evaluateAST(node.operand, values);
      if (operand.type === 'NumberLiteral') {
        return {
          type: 'NumberLiteral',
          value: evaluateUnaryExpression({ ...node, operand }, values),
        };
      } else {
        return { ...node, operand };
      }
    }

    case 'FunctionCall':
      // Do not evaluate function calls numerically, just return the node with evaluated args
      return {
        ...node,
        args: node.args.map(arg => evaluateAST(arg, values)),
      };

    case 'Fraction': {
      const numerator = evaluateAST(node.numerator, values);
      const denominator = evaluateAST(node.denominator, values);
      if (numerator.type === 'NumberLiteral' && denominator.type === 'NumberLiteral') {
        if (denominator.value === 0) {
          throw new Error('Division by zero');
        }
        return { type: 'NumberLiteral', value: numerator.value / denominator.value };
      } else {
        return { ...node, numerator, denominator };
      }
    }

    case 'Integral':
    case 'Sum':
    case 'Product':
      throw new Error(`${node.type} evaluation not yet implemented`);

    default:
      throw new Error(`Unsupported AST node type: ${(node as { type: string }).type}`);
  }
}

import type { NumberLiteral } from '@/types/ast';

function evaluateBinaryExpression(
  node: { operator: string; left: ASTNode; right: ASTNode },
  values: Record<string, number>
): number {
  // left, rightは必ずNumberLiteral型
  const left = (node.left as NumberLiteral).value;
  const right = (node.right as NumberLiteral).value;
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
  // operandは必ずNumberLiteral型
  const operand = (node.operand as NumberLiteral).value;
  switch (node.operator) {
    case '+':
      return operand;
    case '-':
      return -operand;
    default:
      throw new Error(`Unsupported unary operator: ${node.operator}`);
  }
}

// FunctionCallの数値評価はapproxでのみ行うため、ここでは削除

/**
 * Check if AST contains imaginary unit 'i'
 */
function containsImaginaryUnit(node: ASTNode): boolean {
  switch (node.type) {
    case 'NumberLiteral':
      return false;

    case 'Identifier':
      return node.name === 'i' || node.name === 'I';

    case 'BinaryExpression':
      return containsImaginaryUnit(node.left) || containsImaginaryUnit(node.right);

    case 'UnaryExpression':
      return containsImaginaryUnit(node.operand);

    case 'FunctionCall':
      return node.args.some(arg => containsImaginaryUnit(arg));

    case 'Fraction':
      return containsImaginaryUnit(node.numerator) || containsImaginaryUnit(node.denominator);

    case 'Integral':
      return (
        containsImaginaryUnit(node.integrand) ||
        (node.lowerBound ? containsImaginaryUnit(node.lowerBound) : false) ||
        (node.upperBound ? containsImaginaryUnit(node.upperBound) : false)
      );

    case 'Sum':
    case 'Product':
      return (
        containsImaginaryUnit(node.expression) ||
        containsImaginaryUnit(node.lowerBound) ||
        containsImaginaryUnit(node.upperBound)
      );

    default:
      return false;
  }
}

/**
 * Check if AST contains fractions
 */
function containsFractions(node: ASTNode): boolean {
  switch (node.type) {
    case 'Fraction':
      return true;
    case 'BinaryExpression':
      return containsFractions(node.left) || containsFractions(node.right);
    case 'UnaryExpression':
      return containsFractions(node.operand);
    case 'FunctionCall':
      return node.args.some(arg => containsFractions(arg));
    default:
      return false;
  }
}

/**
 * Check if AST contains function calls
 */
function containsFunctions(node: ASTNode): boolean {
  switch (node.type) {
    case 'FunctionCall':
      return true;
    case 'BinaryExpression':
      return containsFunctions(node.left) || containsFunctions(node.right);
    case 'UnaryExpression':
      return containsFunctions(node.operand);
    case 'Fraction':
      return containsFunctions(node.numerator) || containsFunctions(node.denominator);
    default:
      return false;
  }
}

/**
 * Check if values contain floating point numbers
 */
function hasFloatingPointInValues(values: Record<string, number>): boolean {
  return Object.values(values).some(value => !Number.isInteger(value));
}

/**
 * Substitute mathematical constants in AST with their numerical values
 */
function substituteMathConstants(node: ASTNode, convertConstants: boolean = true): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      return node;

    case 'Identifier':
      if (node.name in MATH_CONSTANTS && convertConstants) {
        return {
          type: 'NumberLiteral',
          value: MATH_CONSTANTS[node.name]!,
        };
      }
      return node;

    case 'BinaryExpression':
      return {
        ...node,
        left: substituteMathConstants(node.left, convertConstants),
        right: substituteMathConstants(node.right, convertConstants),
      };

    case 'UnaryExpression':
      return {
        ...node,
        operand: substituteMathConstants(node.operand, convertConstants),
      };

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => substituteMathConstants(arg, convertConstants)),
      };

    case 'Fraction':
      return {
        ...node,
        numerator: substituteMathConstants(node.numerator, convertConstants),
        denominator: substituteMathConstants(node.denominator, convertConstants),
      };

    default:
      return node;
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
        if (n.scope === 'free' && !MATH_CONSTANTS[n.name] && n.name !== 'i' && n.name !== 'I') {
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
  let steps: StepTree = [];
  const values = options.values || {};

  try {
    // 1. Add original expression (ネストのルート)
    steps = [
      `Original expression: ${astToLatex(ast)}`,
      [
        // サブステップとして定数置換
        'Substituted mathematical constants (symbolic)',
      ],
    ];
    const astWithConstants = substituteMathConstants(ast, false);

    // Extract free variables after constant substitution
    const freeVars = extractFreeVariables(astWithConstants);

    // Check if expression contains imaginary unit 'i'
    const containsImaginary = containsImaginaryUnit(astWithConstants);

    // If there are free variables without values, or contains imaginary unit, return symbolic representation
    const unassignedVars = Array.from(freeVars).filter(varName => values[varName] === undefined);

    if (unassignedVars.length > 0 || containsImaginary) {
      // Apply comprehensive simplification for evaluate task
      const simplifiedAST = simplify(astWithConstants, {
        combineLikeTerms: true,
        expand: false, // Keep expressions compact for evaluation
        factor: true, // Factor when possible for cleaner representation
        simplifyFractions: true,
        applyIdentities: true,
      });
      const symbolicResult = astToLatex(simplifiedAST);

      // ネストしたサブステップを作成
      const substeps: StepTree = [];
      if (unassignedVars.length > 0) {
        substeps.push(`Expression contains undefined variables: ${unassignedVars.join(', ')}`);
      }
      if (containsImaginary) {
        substeps.push('Expression contains imaginary unit: cannot evaluate numerically');
      }
      substeps.push(`Simplified result: ${symbolicResult}`);

      // stepsの2番目の要素（サブステップ）に追加
      (steps[1] as StepTree[]).push(...substeps);

      return {
        steps,
        value: symbolicResult,
        valueType: 'symbolic',
        ast: simplifiedAST,
        error: null,
      };
    }

    // For evaluate task, always preserve symbolic representation
    const simplifiedAST = simplify(astWithConstants, {
      combineLikeTerms: true,
      simplifyFractions: true,
      applyIdentities: true,
    });
    const symbolicResult = astToLatex(simplifiedAST);

    // ネストしたサブステップ
    (steps[1] as StepTree[]).push('Final symbolic result');
    (steps[1] as StepTree[]).push(`Result: ${symbolicResult}`);

    return {
      steps,
      value: symbolicResult,
      valueType: 'exact',
      ast: simplifiedAST,
      error: null,
    };
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

/**
 * Approximate evaluation - converts mathematical constants to decimal values
 */
export function analyzeApprox(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'approx' }
): AnalyzeResult {
  let steps: StepTree = [];
  const values = options.values || {};
  const precision = options.precision || 6;

  try {
    // 1. Add original expression (ネストのルート)
    steps = [
      `Original expression: ${astToLatex(ast)}`,
      ['Substituted mathematical constants (decimal)'],
    ];
    const astWithConstants = substituteMathConstants(ast, true);

    // Extract free variables after constant substitution
    const freeVars = extractFreeVariables(astWithConstants);

    // Check if expression contains imaginary unit 'i'
    const containsImaginary = containsImaginaryUnit(astWithConstants);

    // If there are free variables without values, or contains imaginary unit, return symbolic representation
    const unassignedVars = Array.from(freeVars).filter(varName => values[varName] === undefined);

    if (unassignedVars.length > 0 || containsImaginary) {
      // Apply simplification to AST before converting to LaTeX
      const simplifiedAST = simplify(astWithConstants, {
        combineLikeTerms: true,
        simplifyFractions: true,
        applyIdentities: true,
      });
      const symbolicResult = astToLatex(simplifiedAST);

      // ネストしたサブステップを作成
      const substeps: StepTree = [];
      if (unassignedVars.length > 0) {
        substeps.push(`Expression contains undefined variables: ${unassignedVars.join(', ')}`);
      }
      if (containsImaginary) {
        substeps.push('Expression contains imaginary unit: cannot evaluate numerically');
      }
      substeps.push(`Simplified result with decimal constants: ${symbolicResult}`);

      (steps[1] as StepTree[]).push(...substeps);

      return {
        steps,
        value: symbolicResult,
        valueType: 'symbolic',
        ast: simplifiedAST,
        error: null,
      };
    }

    // Check if we should preserve exact representation (e.g., fractions) but not for functions
    const containsFunctionsToEvaluate = containsFunctions(astWithConstants);
    const shouldPreserveExact =
      containsFractions(astWithConstants) &&
      !hasFloatingPointInValues(values) &&
      !containsFunctionsToEvaluate;

    if (shouldPreserveExact) {
      // Simplify symbolically but keep exact representation
      const simplifiedAST = simplify(astWithConstants, {
        combineLikeTerms: true,
        simplifyFractions: true,
        applyIdentities: true,
      });
      const symbolicResult = astToLatex(simplifiedAST);

      (steps[1] as StepTree[]).push('Exact simplification applied with decimal constants');
      (steps[1] as StepTree[]).push(`Result: ${symbolicResult}`);

      return {
        steps,
        value: symbolicResult,
        valueType: 'exact',
        ast: simplifiedAST,
        error: null,
      };
    }

    // Add substitution steps (サブステップとしてまとめる)
    const substSteps: StepTree = [];
    Object.entries(values).forEach(([varName, varValue]) => {
      substSteps.push(`Substitution: ${varName} = ${formatNumber(varValue, precision)}`);
    });
    if (substSteps.length > 0) {
      (steps[1] as StepTree[]).push(substSteps);
    }

    // Evaluate the expression
    const evaluated = evaluateAST(astWithConstants, values);
    let resultValue: number | null = null;
    if (evaluated.type === 'NumberLiteral') {
      resultValue = evaluated.value;
    } else {
      // シンボリックなままの場合
      return {
        steps,
        value: astToLatex(evaluated),
        valueType: 'symbolic',
        ast: evaluated,
        error: null,
      };
    }

    // Format the result
    const formattedResult = formatNumber(resultValue, precision);
    (steps[1] as StepTree[]).push(`Approximate result: ${formattedResult}`);

    const analyzeResult: AnalyzeResult = {
      steps,
      value: formattedResult,
      valueType: Number.isInteger(resultValue) ? 'exact' : 'approximate',
      ast: {
        type: 'NumberLiteral',
        value: resultValue,
      },
      error: null,
    };

    if (!Number.isInteger(resultValue)) {
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
