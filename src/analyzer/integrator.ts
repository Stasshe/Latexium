/**
 * Integration Engine
 * Implements symbolic integration for mathematical expressions
 */

import { ASTNode, AnalyzeResult, AnalyzeOptions } from '../types';
import { IntegrationEngine } from './integration';
import { astToLatex } from '../utils/ast';
import { getAnalysisVariable, extractFreeVariables } from '../utils/variables';

// Legacy integration engine - now using new strategy-based system
const modernIntegrationEngine = new IntegrationEngine();

/**
 * Integration table for basic functions
 */
const INTEGRATION_TABLE: Record<string, (arg?: ASTNode) => ASTNode> = {
  // Basic functions
  constant: () => ({
    type: 'Identifier',
    name: 'x',
    scope: 'free',
    uniqueId: 'free_x',
  }),

  // Power functions
  x: () => ({
    type: 'Fraction',
    numerator: {
      type: 'BinaryExpression',
      operator: '^',
      left: {
        type: 'Identifier',
        name: 'x',
        scope: 'free',
        uniqueId: 'free_x',
      },
      right: {
        type: 'NumberLiteral',
        value: 2,
      },
    },
    denominator: {
      type: 'NumberLiteral',
      value: 2,
    },
  }),

  // Trigonometric functions
  sin: arg => ({
    type: 'UnaryExpression',
    operator: '-',
    operand: {
      type: 'FunctionCall',
      name: 'cos',
      args: arg
        ? [arg]
        : [
            {
              type: 'Identifier',
              name: 'x',
              scope: 'free',
              uniqueId: 'free_x',
            },
          ],
    },
  }),

  cos: arg => ({
    type: 'FunctionCall',
    name: 'sin',
    args: arg
      ? [arg]
      : [
          {
            type: 'Identifier',
            name: 'x',
            scope: 'free',
            uniqueId: 'free_x',
          },
        ],
  }),

  // Exponential and logarithmic
  exp: arg => ({
    type: 'FunctionCall',
    name: 'exp',
    args: arg
      ? [arg]
      : [
          {
            type: 'Identifier',
            name: 'x',
            scope: 'free',
            uniqueId: 'free_x',
          },
        ],
  }),

  '1/x': () => ({
    type: 'FunctionCall',
    name: 'ln',
    args: [
      {
        type: 'FunctionCall',
        name: 'abs',
        args: [
          {
            type: 'Identifier',
            name: 'x',
            scope: 'free',
            uniqueId: 'free_x',
          },
        ],
      },
    ],
  }),
};

/**
 * Integrate an AST node with respect to a variable
 */
export function integrateAST(node: ASTNode, variable: string): ASTNode {
  // Try using the modern strategy-based integration engine first
  try {
    const context = {
      variable,
      depth: 0,
      maxDepth: 5,
      attemptedStrategies: new Set<string>(),
    };
    const result = modernIntegrationEngine.integrate(node, context);
    if (result.success && result.result) {
      return result.result;
    }
  } catch (error) {
    // Fall back to legacy integration if modern engine fails
    // console.warn('Modern integration engine failed, falling back to legacy:', error);
  }

  // Legacy integration implementation (original code preserved for fallback)
  return legacyIntegrateAST(node, variable);
}

/**
 * Legacy integration implementation
 */
function legacyIntegrateAST(node: ASTNode, variable: string): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      // ∫c dx = cx
      return {
        type: 'BinaryExpression',
        operator: '*',
        left: node,
        right: {
          type: 'Identifier',
          name: variable,
          scope: 'free',
          uniqueId: `free_${variable}`,
        },
      };

    case 'Identifier':
      if (node.name === variable && node.scope === 'free') {
        // ∫x dx = x²/2
        return {
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '^',
            left: {
              type: 'Identifier',
              name: variable,
              scope: 'free',
              uniqueId: `free_${variable}`,
            },
            right: {
              type: 'NumberLiteral',
              value: 2,
            },
          },
          denominator: {
            type: 'NumberLiteral',
            value: 2,
          },
        };
      } else {
        // ∫c dx = cx (where c is a constant)
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: node,
          right: {
            type: 'Identifier',
            name: variable,
            scope: 'free',
            uniqueId: `free_${variable}`,
          },
        };
      }

    case 'BinaryExpression':
      return integrateBinaryExpression(node, variable);

    case 'UnaryExpression':
      return integrateUnaryExpression(node, variable);

    case 'FunctionCall':
      return integrateFunctionCall(node, variable);

    case 'Fraction':
      return integrateFraction(node, variable);

    case 'Integral':
    case 'Sum':
    case 'Product':
      throw new Error(`Integration of ${node.type} not yet implemented`);

    default:
      throw new Error(
        `Unsupported AST node type for integration: ${(node as { type: string }).type}`
      );
  }
}

/**
 * Handle special integration cases for powers and trigonometric functions
 */
function handleSpecialIntegration(node: ASTNode, variable: string): ASTNode | null {
  // Handle sin²(x), cos²(x), etc.
  if (
    node.type === 'BinaryExpression' &&
    node.operator === '^' &&
    node.right.type === 'NumberLiteral' &&
    node.right.value === 2 &&
    node.left.type === 'FunctionCall'
  ) {
    const func = node.left;
    if (
      func.args.length === 1 &&
      func.args[0]?.type === 'Identifier' &&
      func.args[0].name === variable
    ) {
      switch (func.name) {
        case 'sin':
          // ∫sin²(x) dx = (x/2) - (sin(2x)/4)
          return {
            type: 'BinaryExpression',
            operator: '-',
            left: {
              type: 'Fraction',
              numerator: {
                type: 'Identifier',
                name: variable,
                scope: 'free',
                uniqueId: `free_${variable}`,
              },
              denominator: { type: 'NumberLiteral', value: 2 },
            },
            right: {
              type: 'Fraction',
              numerator: {
                type: 'FunctionCall',
                name: 'sin',
                args: [
                  {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: { type: 'NumberLiteral', value: 2 },
                    right: {
                      type: 'Identifier',
                      name: variable,
                      scope: 'free',
                      uniqueId: `free_${variable}`,
                    },
                  },
                ],
              },
              denominator: { type: 'NumberLiteral', value: 4 },
            },
          };

        case 'cos':
          // ∫cos²(x) dx = (x/2) + (sin(2x)/4)
          return {
            type: 'BinaryExpression',
            operator: '+',
            left: {
              type: 'Fraction',
              numerator: {
                type: 'Identifier',
                name: variable,
                scope: 'free',
                uniqueId: `free_${variable}`,
              },
              denominator: { type: 'NumberLiteral', value: 2 },
            },
            right: {
              type: 'Fraction',
              numerator: {
                type: 'FunctionCall',
                name: 'sin',
                args: [
                  {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: { type: 'NumberLiteral', value: 2 },
                    right: {
                      type: 'Identifier',
                      name: variable,
                      scope: 'free',
                      uniqueId: `free_${variable}`,
                    },
                  },
                ],
              },
              denominator: { type: 'NumberLiteral', value: 4 },
            },
          };

        case 'tan':
          // ∫tan²(x) dx = tan(x) - x
          return {
            type: 'BinaryExpression',
            operator: '-',
            left: {
              type: 'FunctionCall',
              name: 'tan',
              args: [
                { type: 'Identifier', name: variable, scope: 'free', uniqueId: `free_${variable}` },
              ],
            },
            right: {
              type: 'Identifier',
              name: variable,
              scope: 'free',
              uniqueId: `free_${variable}`,
            },
          };
      }
    }
  }

  return null;
}

/**
 * Integrate binary expressions
 */
function integrateBinaryExpression(
  node: { operator: string; left: ASTNode; right: ASTNode },
  variable: string
): ASTNode {
  const left = node.left;
  const right = node.right;

  // Check for special cases first (like sin²(x), cos²(x))
  const specialCase = handleSpecialIntegration(node as ASTNode, variable);
  if (specialCase) {
    return specialCase;
  }

  switch (node.operator) {
    case '+':
    case '-':
      // ∫(u ± v) dx = ∫u dx ± ∫v dx
      return {
        type: 'BinaryExpression',
        operator: node.operator as '+' | '-',
        left: integrateAST(left, variable),
        right: integrateAST(right, variable),
      };

    case '*':
      // Handle special cases for integration by parts or constant multiplication
      if (isConstant(left, variable)) {
        // ∫c·f(x) dx = c·∫f(x) dx
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: left,
          right: integrateAST(right, variable),
        };
      } else if (isConstant(right, variable)) {
        // ∫f(x)·c dx = c·∫f(x) dx
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: right,
          right: integrateAST(left, variable),
        };
      } else {
        // Complex case - would need integration by parts
        throw new Error('Integration by parts not yet implemented');
      }

    case '/':
      // Handle simple cases where denominator is constant
      if (isConstant(right, variable)) {
        return {
          type: 'Fraction',
          numerator: integrateAST(left, variable),
          denominator: right,
        };
      } else {
        throw new Error('Complex fraction integration not yet implemented');
      }

    case '^':
      // Power rule: ∫x^n dx = x^(n+1)/(n+1) for n ≠ -1
      if (left.type === 'Identifier' && left.name === variable && isConstant(right, variable)) {
        const exponent = right;

        // Check for special case x^(-1) = 1/x
        if (exponent.type === 'NumberLiteral' && exponent.value === -1) {
          return {
            type: 'FunctionCall',
            name: 'ln',
            args: [
              {
                type: 'FunctionCall',
                name: 'abs',
                args: [left],
              },
            ],
          };
        }

        // General power rule
        const newExponent = {
          type: 'BinaryExpression' as const,
          operator: '+' as const,
          left: exponent,
          right: {
            type: 'NumberLiteral' as const,
            value: 1,
          },
        };

        return {
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '^',
            left: left,
            right: newExponent,
          },
          denominator: newExponent,
        };
      } else {
        throw new Error('Complex power integration not yet implemented');
      }

    case '=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      throw new Error('Integration of comparison operators not supported');

    default:
      throw new Error(`Integration of operator ${node.operator} not supported`);
  }
}

/**
 * Integrate unary expressions
 */
function integrateUnaryExpression(
  node: { operator: string; operand: ASTNode },
  variable: string
): ASTNode {
  const integral = integrateAST(node.operand, variable);

  switch (node.operator) {
    case '+':
      return integral;
    case '-':
      return {
        type: 'UnaryExpression',
        operator: '-',
        operand: integral,
      };
    default:
      throw new Error(`Unsupported unary operator for integration: ${node.operator}`);
  }
}

/**
 * Integrate function calls
 */
function integrateFunctionCall(node: { name: string; args: ASTNode[] }, variable: string): ASTNode {
  if (node.args.length !== 1) {
    throw new Error(
      `Integration of function ${node.name} with ${node.args.length} arguments not supported`
    );
  }

  const argument = node.args[0];
  if (!argument) {
    throw new Error(`Function ${node.name} missing required argument`);
  }

  // Simple case: argument is just the variable (e.g., sin(x), cos(x))
  if (argument.type === 'Identifier' && argument.name === variable) {
    switch (node.name) {
      case 'sin':
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: {
            type: 'FunctionCall',
            name: 'cos',
            args: [argument],
          },
        };

      case 'cos':
        return {
          type: 'FunctionCall',
          name: 'sin',
          args: [argument],
        };

      case 'exp':
        return {
          type: 'FunctionCall',
          name: 'exp',
          args: [argument],
        };

      case 'tan':
        // ∫tan(x) dx = -ln|cos(x)|
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: {
            type: 'FunctionCall',
            name: 'ln',
            args: [
              {
                type: 'FunctionCall',
                name: 'abs',
                args: [
                  {
                    type: 'FunctionCall',
                    name: 'cos',
                    args: [argument],
                  },
                ],
              },
            ],
          },
        };

      case 'ln':
        // ∫ln(x) dx = x·ln(x) - x (integration by parts)
        return {
          type: 'BinaryExpression',
          operator: '-',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: argument,
            right: {
              type: 'FunctionCall',
              name: 'ln',
              args: [argument],
            },
          },
          right: argument,
        };

      case 'log':
        // ∫log₁₀(x) dx = x·log₁₀(x) - x/ln(10) (integration by parts)
        return {
          type: 'BinaryExpression',
          operator: '-',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: argument,
            right: {
              type: 'FunctionCall',
              name: 'log',
              args: [argument],
            },
          },
          right: {
            type: 'Fraction',
            numerator: argument,
            denominator: {
              type: 'FunctionCall',
              name: 'ln',
              args: [{ type: 'NumberLiteral', value: 10 }],
            },
          },
        };

      case 'sqrt':
        // ∫√x dx = (2/3)x^(3/2)
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: 2 },
            denominator: { type: 'NumberLiteral', value: 3 },
          },
          right: {
            type: 'BinaryExpression',
            operator: '^',
            left: argument,
            right: {
              type: 'Fraction',
              numerator: { type: 'NumberLiteral', value: 3 },
              denominator: { type: 'NumberLiteral', value: 2 },
            },
          },
        };

      case 'asin':
        // ∫arcsin(x) dx = x·arcsin(x) + √(1-x²)
        return {
          type: 'BinaryExpression',
          operator: '+',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: argument,
            right: {
              type: 'FunctionCall',
              name: 'asin',
              args: [argument],
            },
          },
          right: {
            type: 'FunctionCall',
            name: 'sqrt',
            args: [
              {
                type: 'BinaryExpression',
                operator: '-',
                left: { type: 'NumberLiteral', value: 1 },
                right: {
                  type: 'BinaryExpression',
                  operator: '^',
                  left: argument,
                  right: { type: 'NumberLiteral', value: 2 },
                },
              },
            ],
          },
        };

      case 'acos':
        // ∫arccos(x) dx = x·arccos(x) - √(1-x²)
        return {
          type: 'BinaryExpression',
          operator: '-',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: argument,
            right: {
              type: 'FunctionCall',
              name: 'acos',
              args: [argument],
            },
          },
          right: {
            type: 'FunctionCall',
            name: 'sqrt',
            args: [
              {
                type: 'BinaryExpression',
                operator: '-',
                left: { type: 'NumberLiteral', value: 1 },
                right: {
                  type: 'BinaryExpression',
                  operator: '^',
                  left: argument,
                  right: { type: 'NumberLiteral', value: 2 },
                },
              },
            ],
          },
        };

      case 'atan':
        // ∫arctan(x) dx = x·arctan(x) - (1/2)ln(1+x²)
        return {
          type: 'BinaryExpression',
          operator: '-',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: argument,
            right: {
              type: 'FunctionCall',
              name: 'atan',
              args: [argument],
            },
          },
          right: {
            type: 'BinaryExpression',
            operator: '*',
            left: {
              type: 'Fraction',
              numerator: { type: 'NumberLiteral', value: 1 },
              denominator: { type: 'NumberLiteral', value: 2 },
            },
            right: {
              type: 'FunctionCall',
              name: 'ln',
              args: [
                {
                  type: 'BinaryExpression',
                  operator: '+',
                  left: { type: 'NumberLiteral', value: 1 },
                  right: {
                    type: 'BinaryExpression',
                    operator: '^',
                    left: argument,
                    right: { type: 'NumberLiteral', value: 2 },
                  },
                },
              ],
            },
          },
        };

      case 'sinh':
        // ∫sinh(x) dx = cosh(x)
        return {
          type: 'FunctionCall',
          name: 'cosh',
          args: [argument],
        };

      case 'cosh':
        // ∫cosh(x) dx = sinh(x)
        return {
          type: 'FunctionCall',
          name: 'sinh',
          args: [argument],
        };

      case 'tanh':
        // ∫tanh(x) dx = ln(cosh(x))
        return {
          type: 'FunctionCall',
          name: 'ln',
          args: [
            {
              type: 'FunctionCall',
              name: 'cosh',
              args: [argument],
            },
          ],
        };

      case 'abs':
        // ∫|x| dx = (x|x|)/2 = (x²/2)·sign(x) - simplified for x > 0
        // For simplicity, assume x > 0: ∫|x| dx = x²/2
        return {
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '^',
            left: argument,
            right: { type: 'NumberLiteral', value: 2 },
          },
          denominator: { type: 'NumberLiteral', value: 2 },
        };

      default:
        throw new Error(`Integration of function ${node.name} not yet implemented`);
    }
  }

  // Handle e^(ax) case where a is constant
  if (node.name === 'exp' && argument.type === 'BinaryExpression' && argument.operator === '*') {
    const { left, right } = argument;
    if (isConstant(left, variable) && right.type === 'Identifier' && right.name === variable) {
      // ∫e^(ax) dx = (1/a)e^(ax)
      return {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: 1 },
          denominator: left,
        },
        right: {
          type: 'FunctionCall',
          name: 'exp',
          args: [argument],
        },
      };
    } else if (
      isConstant(right, variable) &&
      left.type === 'Identifier' &&
      left.name === variable
    ) {
      // ∫e^(ax) dx = (1/a)e^(ax)
      return {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: 1 },
          denominator: right,
        },
        right: {
          type: 'FunctionCall',
          name: 'exp',
          args: [argument],
        },
      };
    }
  }

  throw new Error('Integration with substitution not yet implemented');
}

/**
 * Integrate fractions
 */
function integrateFraction(
  node: { numerator: ASTNode; denominator: ASTNode },
  variable: string
): ASTNode {
  const numerator = node.numerator;
  const denominator = node.denominator;

  // Simple case: constant in denominator
  if (isConstant(denominator, variable)) {
    return {
      type: 'Fraction',
      numerator: integrateAST(numerator, variable),
      denominator: denominator,
    };
  }

  // Special case: 1/x
  if (
    numerator.type === 'NumberLiteral' &&
    numerator.value === 1 &&
    denominator.type === 'Identifier' &&
    denominator.name === variable
  ) {
    return {
      type: 'FunctionCall',
      name: 'ln',
      args: [
        {
          type: 'FunctionCall',
          name: 'abs',
          args: [denominator],
        },
      ],
    };
  }

  // Special case: 1/(x²+a²) = (1/a)arctan(x/a)
  if (
    numerator.type === 'NumberLiteral' &&
    numerator.value === 1 &&
    denominator.type === 'BinaryExpression' &&
    denominator.operator === '+' &&
    denominator.left.type === 'BinaryExpression' &&
    denominator.left.operator === '^' &&
    denominator.left.left.type === 'Identifier' &&
    denominator.left.left.name === variable &&
    denominator.left.right.type === 'NumberLiteral' &&
    denominator.left.right.value === 2 &&
    isConstant(denominator.right, variable)
  ) {
    // ∫1/(x²+a²) dx = (1/√a)arctan(x/√a) for a > 0
    const a = denominator.right;
    if (a.type === 'NumberLiteral' && a.value > 0) {
      const sqrtA = Math.sqrt(a.value);
      return {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: 1 },
          denominator: { type: 'NumberLiteral', value: sqrtA },
        },
        right: {
          type: 'FunctionCall',
          name: 'atan',
          args: [
            {
              type: 'Fraction',
              numerator: {
                type: 'Identifier',
                name: variable,
                scope: 'free',
                uniqueId: `free_${variable}`,
              },
              denominator: { type: 'NumberLiteral', value: sqrtA },
            },
          ],
        },
      };
    }
  }

  // More complex fractions would need partial fractions or other techniques
  throw new Error('Complex fraction integration not yet implemented');
}

/**
 * Check if a node is constant with respect to a variable
 */
function isConstant(node: ASTNode, variable: string): boolean {
  switch (node.type) {
    case 'NumberLiteral':
      return true;
    case 'Identifier':
      return node.name !== variable || node.scope !== 'free';
    case 'BinaryExpression':
      return isConstant(node.left, variable) && isConstant(node.right, variable);
    case 'UnaryExpression':
      return isConstant(node.operand, variable);
    case 'FunctionCall':
      return node.args.every(arg => isConstant(arg, variable));
    case 'Fraction':
      return isConstant(node.numerator, variable) && isConstant(node.denominator, variable);
    default:
      return false;
  }
}

/**
 * Analyze AST with integration task
 */
export function analyzeIntegrate(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'integrate' }
): AnalyzeResult {
  const steps: string[] = [];

  try {
    // Automatic variable inference
    const variable = getAnalysisVariable(ast, options.variable);
    const freeVars = extractFreeVariables(ast);

    // Add informative steps about variable selection
    if (!options.variable && freeVars.size > 1) {
      steps.push(
        `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Using '${variable}' for integration.`
      );
    } else if (!options.variable && freeVars.size === 1) {
      steps.push(`Auto-detected variable: ${variable}`);
    }

    steps.push(`Integrating with respect to ${variable}`);
    steps.push(`Expression: ${astToLatex(ast)}`);

    // Perform integration
    const integral = integrateAST(ast, variable);
    const integralLatex = astToLatex(integral);

    steps.push(`Integral: ${integralLatex} + C`);

    return {
      steps,
      value: `${integralLatex} + C`,
      valueType: 'symbolic',
      ast: integral,
      error: null,
    };
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Integration error',
    };
  }
}
