/**
 * Symbolic Differentiation Utility
 * Provides a function to differentiate an AST node with respect to a variable
 */

import { ASTNode, StepTree } from '../types';
import { stepsAstToLatex } from './ast';
import { simplify as simplifyAST } from './unified-simplify';

/**
 * Differentiate an AST node with respect to a variable
 * @param node
 * @param variable
 * @param steps
 * @returns
 */
export function differentiate(node: ASTNode, variable: string, steps: StepTree[]): ASTNode {
  const derivative = differentiateAST(node, variable, steps);
  const simplified = simplifyAST(derivative, { factor: false, expand: false }, steps);
  steps.push(`Simplified derivative: ${stepsAstToLatex(simplified)}`);
  return simplified;
}

/**
 * Differentiate an AST node with respect to a variable
 */
function differentiateAST(node: ASTNode, variable: string, steps?: StepTree[]): ASTNode {
  switch (node.type) {
    case 'NumberLiteral': {
      if (steps) steps.push(`d/d${variable}(${node.value}) = 0`);
      return { type: 'NumberLiteral', value: 0 };
    }
    case 'Identifier': {
      let val = 0;
      if (node.name === variable && (node.scope === 'free' || node.scope === undefined)) {
        val = 1;
      }
      if (steps) steps.push(`d/d${variable}(${node.name}) = ${val}`);
      return { type: 'NumberLiteral', value: val };
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
        ]);
      return result;
    }
    case '*': {
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
        ]);
      return result;
    }
    case '/': {
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
        ]);
      return result;
    }
    case '^': {
      const result = simplifyAST(differentiatePower(left, right, variable), {
        factor: false,
        expand: false,
      });
      if (steps) steps.push([`Power rule: d/d${variable}(u^v)`]);
      return result;
    }
    default:
      throw new Error(`Differentiation of operator ${node.operator} not supported`);
  }
}

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
      if (steps) steps.push([`Unary minus: d/d${variable}(-u) = -u'`]);
      return result;
    }
    default:
      throw new Error(`Unsupported unary operator for differentiation: ${node.operator}`);
  }
}

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
  let innerDerivative: ASTNode;
  switch (node.name) {
    case 'sin':
      innerDerivative = { type: 'FunctionCall', name: 'cos', args: [argument] };
      break;
    case 'cos':
      innerDerivative = {
        type: 'UnaryExpression',
        operator: '-',
        operand: { type: 'FunctionCall', name: 'sin', args: [argument] },
      };
      break;
    case 'tan':
      innerDerivative = {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: 1 },
        denominator: {
          type: 'BinaryExpression',
          operator: '^',
          left: { type: 'FunctionCall', name: 'cos', args: [argument] },
          right: { type: 'NumberLiteral', value: 2 },
        },
      };
      break;
    case 'exp':
      innerDerivative = { type: 'FunctionCall', name: 'exp', args: [argument] };
      break;
    case 'ln':
      innerDerivative = {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: 1 },
        denominator: argument,
      };
      break;
    case 'log':
      innerDerivative = {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: 1 },
        denominator: {
          type: 'BinaryExpression',
          operator: '*',
          left: argument,
          right: { type: 'NumberLiteral', value: Math.LN10 },
        },
      };
      break;
    case 'sqrt':
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
  if (isZero(argumentDerivative)) {
    if (steps) steps.push([`Chain rule: argument derivative is zero, so result is 0`]);
    return { type: 'NumberLiteral', value: 0 };
  }
  if (isOne(argumentDerivative)) {
    if (steps) steps.push([`Chain rule: argument derivative is one, so result is innerDerivative`]);
    return innerDerivative;
  }
  const chainResult = {
    type: 'BinaryExpression' as const,
    operator: '*' as const,
    left: innerDerivative,
    right: argumentDerivative,
  };
  const result = simplifyAST(chainResult, { factor: false, expand: false });
  if (steps) steps.push([`Chain rule`]);
  return result;
}

function differentiateFraction(
  node: { numerator: ASTNode; denominator: ASTNode },
  variable: string,
  steps?: StepTree[]
): ASTNode {
  const u = node.numerator;
  const v = node.denominator;
  const uPrime = differentiateAST(u, variable, steps);
  const vPrime = differentiateAST(v, variable, steps);
  const uPrimeIsZero = isZero(uPrime);
  const vPrimeIsZero = isZero(vPrime);
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
      steps.push([`Fraction rule: denominator is constant, so d/d${variable}(u/v) = u'/v`]);
    return result;
  }
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
      steps.push([`Fraction rule: numerator is constant, so d/d${variable}(c/v) = -c v'/v^2`]);
    return result;
  }
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
  if (steps) steps.push([`Fraction rule: d/d${variable}(u/v) = (u'v - uv')/v^2`]);
  return result;
}

function differentiatePower(base: ASTNode, exponent: ASTNode, variable: string): ASTNode {
  const baseDerivative = differentiateAST(base, variable);
  const exponentDerivative = differentiateAST(exponent, variable);
  if (isConstant(base, variable) && isConstant(exponent, variable)) {
    return { type: 'NumberLiteral', value: 0 };
  }
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
              right: { type: 'NumberLiteral', value: 1 },
            },
          },
        },
        right: baseDerivative,
      },
      { factor: false, expand: false }
    );
  }
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

function isConstant(node: ASTNode, variable: string): boolean {
  switch (node.type) {
    case 'NumberLiteral':
      return true;
    case 'Identifier':
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

function isZero(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && node.value === 0;
}

function isOne(node: ASTNode): boolean {
  return node.type === 'NumberLiteral' && node.value === 1;
}
