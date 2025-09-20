/**
 * Differentiation Engine
 * Implements symbolic differentiation for mathematical expressions
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult } from '../types';
import { astToLatex } from '../utils/ast';
import { simplify as simplifyAST } from '../utils/unified-simplify';
import { getAnalysisVariable, extractFreeVariables } from '../utils/variables';

/**
 * Differentiate an AST node with respect to a variable
 */
export function differentiateAST(node: ASTNode, variable: string): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      // d/dx(c) = 0
      return {
        type: 'NumberLiteral',
        value: 0,
      };

    case 'Identifier':
      // d/dx(x) = 1, d/dx(y) = 0 where y ≠ x
      if (node.name === variable && node.scope === 'free') {
        return {
          type: 'NumberLiteral',
          value: 1,
        };
      } else {
        return {
          type: 'NumberLiteral',
          value: 0,
        };
      }

    case 'BinaryExpression':
      return differentiateBinaryExpression(node, variable);

    case 'UnaryExpression':
      return differentiateUnaryExpression(node, variable);

    case 'FunctionCall':
      return differentiateFunctionCall(node, variable);

    case 'Fraction':
      return differentiateFraction(node, variable);

    case 'Integral':
    case 'Sum':
    case 'Product':
      throw new Error(`Differentiation of ${node.type} not yet implemented`);

    default:
      throw new Error(
        `Unsupported AST node type for differentiation: ${(node as { type: string }).type}`
      );
  }
}

/**
 * Differentiate binary expressions using appropriate rules
 */
function differentiateBinaryExpression(
  node: { operator: string; left: ASTNode; right: ASTNode },
  variable: string
): ASTNode {
  const left = node.left;
  const right = node.right;

  switch (node.operator) {
    case '+':
    case '-':
      // (u ± v)' = u' ± v'
      return simplifyAST(
        {
          type: 'BinaryExpression',
          operator: node.operator as '+' | '-',
          left: differentiateAST(left, variable),
          right: differentiateAST(right, variable),
        },
        { factor: false }
      );

    case '*': {
      // Product rule: (uv)' = u'v + uv'
      const leftDerivative = differentiateAST(left, variable);
      const rightDerivative = differentiateAST(right, variable);

      return simplifyAST({
        type: 'BinaryExpression',
        operator: '+',
        left: simplifyAST(
          {
            type: 'BinaryExpression',
            operator: '*',
            left: leftDerivative,
            right: right,
          },
          { factor: false }
        ),
        right: simplifyAST(
          {
            type: 'BinaryExpression',
            operator: '*',
            left: left,
            right: rightDerivative,
          },
          { factor: false }
        ),
      });
    }

    case '/': {
      // Quotient rule: (u/v)' = (u'v - uv')/v²
      const uPrime = differentiateAST(left, variable);
      const vPrime = differentiateAST(right, variable);

      return simplifyAST({
        type: 'Fraction',
        numerator: simplifyAST({
          type: 'BinaryExpression',
          operator: '-',
          left: simplifyAST(
            {
              type: 'BinaryExpression',
              operator: '*',
              left: uPrime,
              right: right,
            },
            { factor: false }
          ),
          right: simplifyAST(
            {
              type: 'BinaryExpression',
              operator: '*',
              left: left,
              right: vPrime,
            },
            { factor: false }
          ),
        }),
        denominator: simplifyAST(
          {
            type: 'BinaryExpression',
            operator: '^',
            left: right,
            right: {
              type: 'NumberLiteral',
              value: 2,
            },
          },
          { factor: false }
        ),
      });
    }

    case '^':
      // Power rule and exponential rule
      return simplifyAST(differentiatePower(left, right, variable));

    default:
      throw new Error(`Differentiation of operator ${node.operator} not supported`);
  }
}

/**
 * Differentiate unary expressions
 */
function differentiateUnaryExpression(
  node: { operator: string; operand: ASTNode },
  variable: string
): ASTNode {
  const derivative = differentiateAST(node.operand, variable);

  switch (node.operator) {
    case '+':
      return derivative;
    case '-':
      return {
        type: 'UnaryExpression',
        operator: '-',
        operand: derivative,
      };
    default:
      throw new Error(`Unsupported unary operator for differentiation: ${node.operator}`);
  }
}

/**
 * Differentiate function calls using chain rule
 */
function differentiateFunctionCall(
  node: { name: string; args: ASTNode[] },
  variable: string
): ASTNode {
  if (node.args.length !== 1) {
    throw new Error(
      `Differentiation of function ${node.name} with ${node.args.length} arguments not supported`
    );
  }

  const argument = node.args[0];
  if (!argument) {
    throw new Error(`Function ${node.name} missing required argument`);
  }

  const argumentDerivative = differentiateAST(argument, variable);

  // Chain rule: f(g(x))' = f'(g(x)) * g'(x)
  let innerDerivative: ASTNode;

  switch (node.name) {
    case 'sin':
      // d/dx(sin(u)) = cos(u) * u'
      innerDerivative = {
        type: 'FunctionCall',
        name: 'cos',
        args: [argument],
      };
      break;

    case 'cos':
      // d/dx(cos(u)) = -sin(u) * u'
      innerDerivative = {
        type: 'UnaryExpression',
        operator: '-',
        operand: {
          type: 'FunctionCall',
          name: 'sin',
          args: [argument],
        },
      };
      break;

    case 'tan':
      // d/dx(tan(u)) = sec²(u) * u' = (1/cos²(u)) * u'
      innerDerivative = {
        type: 'Fraction',
        numerator: {
          type: 'NumberLiteral',
          value: 1,
        },
        denominator: {
          type: 'BinaryExpression',
          operator: '^',
          left: {
            type: 'FunctionCall',
            name: 'cos',
            args: [argument],
          },
          right: {
            type: 'NumberLiteral',
            value: 2,
          },
        },
      };
      break;

    case 'exp':
      // d/dx(exp(u)) = exp(u) * u'
      innerDerivative = {
        type: 'FunctionCall',
        name: 'exp',
        args: [argument],
      };
      break;

    case 'ln':
      // d/dx(ln(u)) = (1/u) * u'
      innerDerivative = {
        type: 'Fraction',
        numerator: {
          type: 'NumberLiteral',
          value: 1,
        },
        denominator: argument,
      };
      break;

    case 'log':
      // d/dx(log(u)) = (1/(u*ln(10))) * u'
      innerDerivative = {
        type: 'Fraction',
        numerator: {
          type: 'NumberLiteral',
          value: 1,
        },
        denominator: {
          type: 'BinaryExpression',
          operator: '*',
          left: argument,
          right: {
            type: 'NumberLiteral',
            value: Math.LN10, // ln(10)
          },
        },
      };
      break;

    case 'sqrt':
      // d/dx(sqrt(u)) = (1/(2*sqrt(u))) * u'
      innerDerivative = {
        type: 'Fraction',
        numerator: {
          type: 'NumberLiteral',
          value: 1,
        },
        denominator: {
          type: 'BinaryExpression',
          operator: '*',
          left: {
            type: 'NumberLiteral',
            value: 2,
          },
          right: {
            type: 'FunctionCall',
            name: 'sqrt',
            args: [argument],
          },
        },
      };
      break;

    default:
      throw new Error(`Differentiation of function ${node.name} not supported`);
  }

  // Apply chain rule: multiply by argument derivative
  if (isZero(argumentDerivative)) {
    return argumentDerivative;
  }

  if (isOne(argumentDerivative)) {
    return innerDerivative;
  }

  return simplifyAST({
    type: 'BinaryExpression',
    operator: '*',
    left: innerDerivative,
    right: argumentDerivative,
  });
}

/**
 * Differentiate fractions using quotient rule
 */
function differentiateFraction(
  node: { numerator: ASTNode; denominator: ASTNode },
  variable: string
): ASTNode {
  // (u/v)' = (u'v - uv')/v²
  const u = node.numerator;
  const v = node.denominator;
  const uPrime = differentiateAST(u, variable);
  const vPrime = differentiateAST(v, variable);

  // Check for special cases to simplify early
  const uPrimeIsZero = isZero(uPrime);
  const vPrimeIsZero = isZero(vPrime);

  // If v is constant (v' = 0), then (u/c)' = u'/c
  if (vPrimeIsZero) {
    return {
      type: 'Fraction',
      numerator: uPrime,
      denominator: v,
    };
  }

  // If u is constant (u' = 0), then (c/v)' = -c*v'/v²
  if (uPrimeIsZero) {
    return {
      type: 'Fraction',
      numerator: {
        type: 'UnaryExpression',
        operator: '-',
        operand: {
          type: 'BinaryExpression',
          operator: '*',
          left: u,
          right: vPrime,
        },
      },
      denominator: {
        type: 'BinaryExpression',
        operator: '^',
        left: v,
        right: {
          type: 'NumberLiteral',
          value: 2,
        },
      },
    };
  }

  // General case: (u/v)' = (u'v - uv')/v²
  return {
    type: 'Fraction',
    numerator: {
      type: 'BinaryExpression',
      operator: '-',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: uPrime,
        right: v,
      },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: u,
        right: vPrime,
      },
    },
    denominator: {
      type: 'BinaryExpression',
      operator: '^',
      left: v,
      right: {
        type: 'NumberLiteral',
        value: 2,
      },
    },
  };
}

/**
 * Differentiate power expressions
 */
function differentiatePower(base: ASTNode, exponent: ASTNode, variable: string): ASTNode {
  const baseDerivative = differentiateAST(base, variable);
  const exponentDerivative = differentiateAST(exponent, variable);

  // If both base and exponent are constants
  if (isConstant(base, variable) && isConstant(exponent, variable)) {
    return {
      type: 'NumberLiteral',
      value: 0,
    };
  }

  // If exponent is constant: d/dx(u^n) = n * u^(n-1) * u'
  if (isConstant(exponent, variable)) {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: exponent,
        right: {
          type: 'BinaryExpression',
          operator: '^',
          left: base,
          right: {
            type: 'BinaryExpression',
            operator: '-',
            left: exponent,
            right: {
              type: 'NumberLiteral',
              value: 1,
            },
          },
        },
      },
      right: baseDerivative,
    };
  }

  // If base is constant: d/dx(a^u) = a^u * ln(a) * u'
  if (isConstant(base, variable)) {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'BinaryExpression',
          operator: '^',
          left: base,
          right: exponent,
        },
        right: {
          type: 'FunctionCall',
          name: 'ln',
          args: [base],
        },
      },
      right: exponentDerivative,
    };
  }

  // General case: d/dx(u^v) = u^v * (v' * ln(u) + v * u'/u)
  return {
    type: 'BinaryExpression',
    operator: '*',
    left: {
      type: 'BinaryExpression',
      operator: '^',
      left: base,
      right: exponent,
    },
    right: {
      type: 'BinaryExpression',
      operator: '+',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: exponentDerivative,
        right: {
          type: 'FunctionCall',
          name: 'ln',
          args: [base],
        },
      },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: exponent,
        right: {
          type: 'Fraction',
          numerator: baseDerivative,
          denominator: base,
        },
      },
    },
  };
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
 * Check if a node represents zero
 */
function isZero(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && node.value === 0;
}

/**
 * Check if a node represents one
 */
function isOne(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && node.value === 1;
}

/**
 * Analyze AST with differentiation task
 */
export function analyzeDifferentiate(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'differentiate' }
): AnalyzeResult {
  const steps: string[] = [];

  try {
    // Automatic variable inference
    const variable = getAnalysisVariable(ast, options.variable);
    const freeVars = extractFreeVariables(ast);

    // Add informative steps about variable selection
    if (!options.variable && freeVars.size > 1) {
      steps.push(
        `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Using '${variable}' for differentiation.`
      );
    } else if (!options.variable && freeVars.size === 1) {
      steps.push(`Auto-detected variable: ${variable}`);
    }

    steps.push(`Differentiating with respect to ${variable}`);
    steps.push(`Expression: ${astToLatex(ast)}`);

    // Perform differentiation
    const derivative = differentiateAST(ast, variable);

    // Apply simplification to the derivative
    const simplifiedDerivative = simplifyAST(derivative);
    const derivativeLatex = astToLatex(simplifiedDerivative);

    steps.push(`Derivative: ${derivativeLatex}`);

    return {
      steps,
      value: derivativeLatex,
      valueType: 'symbolic',
      ast: simplifiedDerivative,
      error: null,
    };
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Differentiation error',
    };
  }
}
