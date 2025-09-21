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
    case 'NumberLiteral': {
      // d/dx(c) = 0
      if (steps) steps.push(`d/d${variable}(${node.value}) = 0`);
      return {
        type: 'NumberLiteral',
        value: 0,
      };
    }
    case 'Identifier': {
      // d/dx(x) = 1, d/dx(y) = 0 where y ≠ x
      let val = 0;
      if (node.name === variable && (node.scope === 'free' || node.scope === undefined)) {
        val = 1;
      }
      if (steps) steps.push(`d/d${variable}(${node.name}) = ${val}`);
      return {
        type: 'NumberLiteral',
        value: val,
      };
    }
    case 'BinaryExpression': {
      const subSteps: StepTree[] = [];
      const result = differentiateBinaryExpression(node, variable, subSteps);
      if (steps && subSteps.length > 0)
        steps.push(...[`BinaryExpression (${node.operator})`, ...subSteps]);
      return result;
    }
    case 'UnaryExpression': {
      const subSteps: StepTree[] = [];
      const result = differentiateUnaryExpression(node, variable, subSteps);
      if (steps && subSteps.length > 0)
        steps.push(...[`UnaryExpression (${node.operator})`, ...subSteps]);
      return result;
    }
    case 'FunctionCall': {
      const subSteps: StepTree[] = [];
      const result = differentiateFunctionCall(node, variable, subSteps);
      if (steps && subSteps.length > 0) steps.push(...[`FunctionCall (${node.name})`, ...subSteps]);
      return result;
    }
    case 'Fraction': {
      const subSteps: StepTree[] = [];
      const result = differentiateFraction(node, variable, subSteps);
      if (steps && subSteps.length > 0) steps.push(...[`Fraction`, subSteps]);
      return result;
    }
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
      const leftSteps: StepTree[] = [];
      const rightSteps: StepTree[] = [];
      const leftDiff = differentiateAST(left, variable, leftSteps);
      const rightDiff = differentiateAST(right, variable, rightSteps);
      const result = simplifyAST(
        {
          type: 'BinaryExpression',
          operator: node.operator as '+' | '-',
          left: leftDiff,
          right: rightDiff,
        } as const,
        { factor: false, expand: false }
      );
      if (steps)
        steps.push([
          `Sum/Difference rule: d/d${variable}(u ${node.operator} v) = u' ${node.operator} v'`,
          ['Left', ...leftSteps],
          ['Right', ...rightSteps],
          stepsAstToLatex(result),
        ]);
      return result;
    }

    case '*': {
      // Product rule: (uv)' = u'v + uv'
      const leftSteps: StepTree[] = [];
      const rightSteps: StepTree[] = [];
      const leftDerivative = differentiateAST(left, variable, leftSteps);
      const rightDerivative = differentiateAST(right, variable, rightSteps);
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
      const result = simplifyAST(prodResult, { factor: false, expand: false });
      if (steps)
        steps.push([
          `Product rule: d/d${variable}(uv) = u'v + uv'`,
          ['Left', ...leftSteps],
          ['Right', ...rightSteps],
          stepsAstToLatex(result),
        ]);
      return result;
    }

    case '/': {
      // /は必ずFractionノードになるので、ここはFractionノードに任せる
      // ただし、念のためFractionノードを返す
      const uSteps: StepTree[] = [];
      const vSteps: StepTree[] = [];
      const uPrime = differentiateAST(left, variable, uSteps);
      const vPrime = differentiateAST(right, variable, vSteps);
      const fracResult = {
        type: 'Fraction' as const,
        numerator: simplifyAST(
          {
            type: 'BinaryExpression' as const,
            operator: '-' as const,
            left: simplifyAST(
              {
                type: 'BinaryExpression' as const,
                operator: '*',
                left: uPrime,
                right: right,
              },
              { factor: false, expand: false }
            ),
            right: simplifyAST(
              {
                type: 'BinaryExpression' as const,
                operator: '*',
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
      const result = simplifyAST(fracResult, { factor: false, expand: false });
      if (steps)
        steps.push([
          `Quotient rule: d/d${variable}(u/v) = (u'v - uv')/v^2`,
          ['Numerator', ...uSteps],
          ['Denominator', ...vSteps],
          stepsAstToLatex(result),
        ]);
      return result;
    }

    case '^': {
      // Power rule and exponential rule
      const result = simplifyAST(differentiatePower(left, right, variable), {
        factor: false,
        expand: false,
      });
      if (steps) steps.push([`Power rule: d/d${variable}(u^v)`, stepsAstToLatex(result)]);
      return result;
    }

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
      if (steps) steps.push([`Unary plus: d/d${variable}(+u) = u'`]);
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
      if (steps) steps.push([`Unary minus: d/d${variable}(-u) = -u'`, stepsAstToLatex(result)]);
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
  let ruleLatex = '';

  switch (node.name) {
    case 'sin':
      // d/dx(sin(u)) = cos(u) * u'
      innerDerivative = {
        type: 'FunctionCall',
        name: 'cos',
        args: [argument],
      };
      ruleLatex = `d/d${variable}(\\sin(u)) = \\cos(u)u'`;
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
      ruleLatex = `d/d${variable}(\\cos(u)) = -\\sin(u)u'`;
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
      ruleLatex = `d/d${variable}(\\tan(u)) = \\frac{1}{\\cos^2(u)}u'`;
      break;

    case 'exp':
      // d/dx(exp(u)) = exp(u) * u'
      innerDerivative = {
        type: 'FunctionCall',
        name: 'exp',
        args: [argument],
      };
      ruleLatex = `d/d${variable}(\\exp(u)) = \\exp(u)u'`;
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
      ruleLatex = `d/d${variable}(\\ln(u)) = \\frac{1}{u}u'`;
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
      ruleLatex = `d/d${variable}(\\log(u)) = \\frac{1}{u\\ln(10)}u'`;
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
      ruleLatex = `d/d${variable}(\\sqrt{u}) = \\frac{1}{2}u^{-1/2}u'`;
      break;

    default:
      throw new Error(`Differentiation of function ${node.name} not supported`);
  }

  // Always apply chain rule: f(g(x))' = f'(g(x)) * g'(x)
  // If argumentDerivative is zero, the whole derivative is zero
  if (isZero(argumentDerivative)) {
    if (steps) steps.push([`Chain rule: argument derivative is zero, so result is 0`]);
    return { type: 'NumberLiteral', value: 0 };
  }

  // If argumentDerivative is one, just return innerDerivative
  if (isOne(argumentDerivative)) {
    if (steps)
      steps.push([
        `Chain rule: argument derivative is one, so result is ${stepsAstToLatex(innerDerivative)}`,
      ]);
    return innerDerivative;
  }

  const chainResult = {
    type: 'BinaryExpression' as const,
    operator: '*' as const,
    left: innerDerivative,
    right: argumentDerivative,
  };
  const result = simplifyAST(chainResult, { factor: false, expand: false });
  if (steps) steps.push([`Chain rule: ${ruleLatex}`, stepsAstToLatex(result)]);
  return result;
}
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
    if (steps)
      steps.push([
        `Fraction rule: denominator is constant, so d/d${variable}(u/v) = u'/v`,
        stepsAstToLatex(result),
      ]);
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
            operator: '*',
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
    if (steps)
      steps.push([
        `Fraction rule: numerator is constant, so d/d${variable}(c/v) = -c v'/v^2`,
        stepsAstToLatex(result),
      ]);
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
  if (steps)
    steps.push([`Fraction rule: d/d${variable}(u/v) = (u'v - uv')/v^2`, stepsAstToLatex(result)]);
  if (steps) steps.push(`[simplifyAST] for fraction (general): ${stepsAstToLatex(result)}`);
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
  const steps: StepTree[] = [];
  try {
    let variable: string;
    let expr: ASTNode;
    if (ast.type === 'Derivative') {
      variable = ast.variable;
      expr = ast.expression;
      steps.push(`Differentiating with respect to ${variable}`);
      steps.push(`Expression: ${astToLatex(expr)}`);
    } else {
      variable = getAnalysisVariable(ast, options.variable);
      expr = ast;
      const freeVars = extractFreeVariables(ast);
      if (!options.variable && freeVars.size > 1) {
        steps.push(
          `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Using '${variable}' for differentiation.`
        );
      } else if (!options.variable && freeVars.size === 1) {
        steps.push(`Auto-detected variable: ${variable}`);
      }
      steps.push(`Differentiating with respect to ${variable}`);
      steps.push(`Expression: ${astToLatex(expr)}`);
    }
    // Perform differentiation
    const diffSteps: StepTree[] = [];
    const derivative = differentiateAST(expr, variable, diffSteps);
    steps.push(...diffSteps);
    // Apply simplification to the derivative
    const simplifiedDerivative = simplifyAST(derivative, { factor: false, expand: false });
    steps.push(`final simplifyAST: ${astToLatex(simplifiedDerivative)}`);
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
