/**
 * Differentiation Engine
 * Implements symbolic differentiation for mathematical expressions
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult, StepTree } from '../types';
import { stepsAstToLatex, astToLatex } from '../utils/ast';
import { simplify as simplifyAST } from '../utils/unified-simplify';
import { getAnalysisVariable, extractFreeVariables } from '../utils/variables';

/**
 * Differentiate an AST node with respect to a variable
 */
export function differentiateAST(node: ASTNode, variable: string, steps?: StepTree[]): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      // d/dx(c) = 0
      return {
        type: 'NumberLiteral',
        value: 0,
      };

    case 'Identifier':
      // d/dx(x) = 1, d/dx(y) = 0 where y ≠ x
      if (node.name === variable && (node.scope === 'free' || node.scope === undefined)) {
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

    case 'BinaryExpression': {
      const subSteps: StepTree[] = [];
      const result = differentiateBinaryExpression(node, variable, subSteps);
      if (steps) steps.push([`differentiateAST: BinaryExpression (${node.operator})`, subSteps]);
      return result;
    }

    case 'UnaryExpression':
      return differentiateUnaryExpression(node, variable, steps);

    case 'FunctionCall':
      return differentiateFunctionCall(node, variable, steps);

    case 'Fraction':
      return differentiateFraction(node, variable, steps);

    case 'Integral':
    case 'Sum':
    case 'Product':
      throw new Error(`Differentiation of ${node.type} not yet implemented`);

    case 'Derivative':
      // Differentiate the inner expression with respect to the variable
      return differentiateAST(node.expression, node.variable, steps);

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
  variable: string,
  steps?: StepTree[]
): ASTNode {
  const left = node.left;
  const right = node.right;
  switch (node.operator) {
    case '+':
    case '-': {
      // (u ± v)' = u' ± v'
      const subSteps: StepTree[] = [];
      const leftDiff = differentiateAST(left, variable, subSteps);
      const rightDiff = differentiateAST(right, variable, subSteps);
      if (steps) steps.push([`differentiateBinaryExpression: ${node.operator}`, subSteps]);
      const result = simplifyAST(
        {
          type: 'BinaryExpression',
          operator: node.operator as '+' | '-',
          left: leftDiff,
          right: rightDiff,
        } as const,
        { factor: false, expand: false }
      );
      if (steps) steps.push([`simplifyAST for ${node.operator}`, [JSON.stringify(result)]]);
      return result;
    }

    case '*': {
      // Product rule: (uv)' = u'v + uv'
      const subSteps: StepTree[] = [];
      const leftDerivative = differentiateAST(left, variable, subSteps);
      const rightDerivative = differentiateAST(right, variable, subSteps);
      if (steps) steps.push([`differentiateBinaryExpression: *`, subSteps]);
      const prodResult = {
        type: 'BinaryExpression' as const,
        operator: '+' as const,
        left: {
          type: 'BinaryExpression' as const,
          operator: '*' as const,
          left: leftDerivative,
          right: right,
        },
        right: {
          type: 'BinaryExpression' as const,
          operator: '*' as const,
          left: left,
          right: rightDerivative,
        },
      };
      if (steps) steps.push([`product rule AST`, [stepsAstToLatex(prodResult)]]);
      const result = simplifyAST(prodResult, { factor: false, expand: false });
      if (steps) steps.push([`simplifyAST for *`, [stepsAstToLatex(result)]]);
      return result;
    }

    case '/': {
      // /は必ずFractionノードになるので、ここはFractionノードに任せる
      // ただし、念のためFractionノードを返す
      const uPrime = differentiateAST(left, variable, steps);
      const vPrime = differentiateAST(right, variable, steps);
      const fracResult = {
        type: 'Fraction' as const,
        numerator: simplifyAST(
          {
            type: 'BinaryExpression' as const,
            operator: '-' as const,
            left: simplifyAST(
              {
                type: 'BinaryExpression' as const,
                operator: '*' as const,
                left: uPrime,
                right: right,
              },
              { factor: false, expand: false }
            ),
            right: simplifyAST(
              {
                type: 'BinaryExpression' as const,
                operator: '*' as const,
                left: left,
                right: vPrime,
              },
              { factor: false, expand: false }
            ),
          },
          { factor: false, expand: false }
        ),
        denominator: simplifyAST(
          {
            type: 'BinaryExpression' as const,
            operator: '^' as const,
            left: right,
            right: {
              type: 'NumberLiteral' as const,
              value: 2,
            },
          },
          { factor: false, expand: false }
        ),
      };
      if (steps) steps.push(`[quotient rule] AST: ${JSON.stringify(fracResult)}`);
      const result = simplifyAST(fracResult, { factor: false, expand: false });
      if (steps) steps.push(`[simplifyAST] for /: ${JSON.stringify(result)}`);
      return result;
    }

    case '^':
      // Power rule and exponential rule
      return simplifyAST(differentiatePower(left, right, variable), {
        factor: false,
        expand: false,
      });

    default:
      throw new Error(`Differentiation of operator ${node.operator} not supported`);
  }
}

/**
 * Differentiate unary expressions
 */
function differentiateUnaryExpression(
  node: { operator: string; operand: ASTNode },
  variable: string,
  steps?: StepTree[]
): ASTNode {
  const derivative = differentiateAST(node.operand, variable, steps);

  switch (node.operator) {
    case '+':
      return derivative;
    case '-': {
      const result = simplifyAST(
        {
          type: 'UnaryExpression' as const,
          operator: '-' as const,
          operand: derivative,
        },
        { factor: false, expand: false }
      );
      if (steps) steps.push(`[simplifyAST] for unary -: ${JSON.stringify(result)}`);
      return result;
    }
    default:
      throw new Error(`Unsupported unary operator for differentiation: ${node.operator}`);
  }
}

/**
 * Differentiate function calls using chain rule
 */
function differentiateFunctionCall(
  node: { name: string; args: ASTNode[] },
  variable: string,
  steps?: StepTree[]
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

  const argumentDerivative = differentiateAST(argument, variable, steps);

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
      // sqrt(u)は指数ノードに変換されている前提で、d/dx(u^{1/2}) = (1/2)u^{-1/2} * u'
      innerDerivative = {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: 1 },
          denominator: { type: 'NumberLiteral', value: 2 },
        },
        right: {
          type: 'BinaryExpression',
          operator: '^',
          left: argument,
          right: {
            type: 'BinaryExpression',
            operator: '-',
            left: { type: 'NumberLiteral', value: 1 / 2 },
            right: { type: 'NumberLiteral', value: 1 },
          },
        },
      };
      break;

    default:
      throw new Error(`Differentiation of function ${node.name} not supported`);
  }

  // Always apply chain rule: f(g(x))' = f'(g(x)) * g'(x)
  // If argumentDerivative is zero, the whole derivative is zero
  if (isZero(argumentDerivative)) {
    if (steps) steps.push(`[chain rule] argumentDerivative is zero, result=0`);
    return { type: 'NumberLiteral', value: 0 };
  }

  // If argumentDerivative is one, just return innerDerivative
  if (isOne(argumentDerivative)) {
    if (steps)
      steps.push(
        `[chain rule] argumentDerivative is one, result=${stepsAstToLatex(innerDerivative)}`
      );
    return innerDerivative;
  }

  const chainResult = {
    type: 'BinaryExpression' as const,
    operator: '*' as const,
    left: innerDerivative,
    right: argumentDerivative,
  };
  if (steps) steps.push(`[chain rule] AST: ${JSON.stringify(chainResult)}`);
  const result = simplifyAST(chainResult, { factor: false, expand: false });
  if (steps) steps.push(`[simplifyAST] for chain: ${JSON.stringify(result)}`);
  return result;
}

/**
 * Differentiate fractions using quotient rule
 */
function differentiateFraction(
  node: { numerator: ASTNode; denominator: ASTNode },
  variable: string,
  steps?: StepTree[]
): ASTNode {
  // (u/v)' = (u'v - uv')/v²
  const u = node.numerator;
  const v = node.denominator;
  const uPrime = differentiateAST(u, variable, steps);
  const vPrime = differentiateAST(v, variable, steps);

  // Check for special cases to simplify early
  const uPrimeIsZero = isZero(uPrime);
  const vPrimeIsZero = isZero(vPrime);

  // If v is constant (v' = 0), then (u/c)' = u'/c
  if (vPrimeIsZero) {
    const result = simplifyAST(
      {
        type: 'Fraction' as const,
        numerator: uPrime,
        denominator: v,
      },
      { factor: false, expand: false }
    );
    if (steps) steps.push(`[simplifyAST] for fraction (v const): ${JSON.stringify(result)}`);
    return result;
  }

  // If u is constant (u' = 0), then (c/v)' = -c*v'/v²
  if (uPrimeIsZero) {
    const result = simplifyAST(
      {
        type: 'Fraction' as const,
        numerator: {
          type: 'UnaryExpression' as const,
          operator: '-' as const,
          operand: {
            type: 'BinaryExpression' as const,
            operator: '*' as const,
            left: u,
            right: vPrime,
          },
        },
        denominator: {
          type: 'BinaryExpression' as const,
          operator: '^' as const,
          left: v,
          right: {
            type: 'NumberLiteral' as const,
            value: 2,
          },
        },
      },
      { factor: false, expand: false }
    );
    if (steps) steps.push(`[simplifyAST] for fraction (u const): ${JSON.stringify(result)}`);
    return result;
  }

  // General case: (u/v)' = (u'v - uv')/v²
  const result = simplifyAST(
    {
      type: 'Fraction' as const,
      numerator: {
        type: 'BinaryExpression' as const,
        operator: '-' as const,
        left: {
          type: 'BinaryExpression' as const,
          operator: '*' as const,
          left: uPrime,
          right: v,
        },
        right: {
          type: 'BinaryExpression' as const,
          operator: '*' as const,
          left: u,
          right: vPrime,
        },
      },
      denominator: {
        type: 'BinaryExpression' as const,
        operator: '^' as const,
        left: v,
        right: {
          type: 'NumberLiteral' as const,
          value: 2,
        },
      },
    },
    { factor: false, expand: false }
  );
  if (steps) steps.push(`[simplifyAST] for fraction (general): ${JSON.stringify(result)}`);
  return result;
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
    return simplifyAST(
      {
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
      },
      { factor: false, expand: false }
    );
  }

  // If base is constant: d/dx(a^u) = a^u * ln(a) * u'
  if (isConstant(base, variable)) {
    return simplifyAST(
      {
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
      },
      { factor: false, expand: false }
    );
  }

  // General case: d/dx(u^v) = u^v * (v' * ln(u) + v * u'/u)
  return simplifyAST(
    {
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
    },
    { factor: false, expand: false }
  );
}

/**
 * Check if a node is constant with respect to a variable
 */
function isConstant(node: ASTNode, variable: string): boolean {
  switch (node.type) {
    case 'NumberLiteral':
      return true;
    case 'Identifier':
      // scopeがfreeまたはundefinedなら変数自身、そうでなければ定数扱い
      return node.name !== variable || (node.scope !== 'free' && node.scope !== undefined);
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
  // If ast is Derivative node, extract variable and expression
  if (ast.type === 'Derivative') {
    const steps: StepTree[] = [];
    try {
      const variable = ast.variable;
      steps.push([`Differentiating with respect to ${variable}`]);
      steps.push([`Expression: ${astToLatex(ast.expression)}`]);
      const diffSteps: StepTree[] = [];
      const derivative = differentiateAST(ast.expression, variable, diffSteps);
      steps.push([`differentiateAST`, diffSteps]);
      const simplifiedDerivative = simplifyAST(derivative, { factor: false, expand: false });
      steps.push([`final simplifyAST`, [`${astToLatex(simplifiedDerivative)}`]]);
      const derivativeLatex = astToLatex(simplifiedDerivative);
      steps.push([`Derivative: ${derivativeLatex}`]);
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
  const steps: StepTree[] = [];

  try {
    // Automatic variable inference
    const variable = getAnalysisVariable(ast, options.variable);
    const freeVars = extractFreeVariables(ast);

    // Add informative steps about variable selection
    if (!options.variable && freeVars.size > 1) {
      steps.push([
        `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Using '${variable}' for differentiation.`,
      ]);
    } else if (!options.variable && freeVars.size === 1) {
      steps.push([`Auto-detected variable: ${variable}`]);
    }

    steps.push([`Differentiating with respect to ${variable}`]);
    steps.push([`Expression: ${astToLatex(ast)}`]);

    // Perform differentiation
    const diffSteps: StepTree[] = [];
    const derivative = differentiateAST(ast, variable, diffSteps);
    steps.push([`differentiateAST`, diffSteps]);

    // Apply simplification to the derivative
    const simplifiedDerivative = simplifyAST(derivative, { factor: false, expand: false });
    steps.push([`final simplifyAST`, [`${stepsAstToLatex(simplifiedDerivative)}`]]);
    const derivativeLatex = astToLatex(simplifiedDerivative);

    steps.push([`Derivative: ${derivativeLatex}`]);

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
