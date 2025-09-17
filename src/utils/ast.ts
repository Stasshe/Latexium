/**
 * AST Utilities
 * Provides utility functions for AST manipulation
 */

import {
  ASTNode,
  BinaryExpression,
  Fraction,
  FunctionCall,
  Integral,
  UnaryExpression,
} from '../types';

/**
 * Convert AST to LaTeX string representation
 */
export function astToLatex(node: ASTNode): string {
  switch (node.type) {
    case 'NumberLiteral':
      return node.value.toString();

    case 'Identifier':
      return node.name;

    case 'BinaryExpression':
      return binaryExpressionToLatex(node);

    case 'UnaryExpression':
      return unaryExpressionToLatex(node);

    case 'FunctionCall':
      return functionCallToLatex(node);

    case 'Fraction':
      return `\\frac{${astToLatex(node.numerator)}}{${astToLatex(node.denominator)}}`;

    case 'Integral':
      return integralToLatex(node);

    case 'Sum':
      return `\\sum_{${node.variable}=${astToLatex(node.lowerBound)}}^{${astToLatex(node.upperBound)}} ${astToLatex(node.expression)}`;

    case 'Product':
      return `\\prod_{${node.variable}=${astToLatex(node.lowerBound)}}^{${astToLatex(node.upperBound)}} ${astToLatex(node.expression)}`;

    default:
      throw new Error(`Unsupported AST node type: ${(node as { type: string }).type}`);
  }
}

function binaryExpressionToLatex(node: BinaryExpression): string {
  const left = astToLatex(node.left);
  const right = astToLatex(node.right);

  switch (node.operator) {
    case '+':
      return `${left} + ${right}`;
    case '-':
      return `${left} - ${right}`;
    case '*':
      // LaTeXでは通常乗算記号を省略
      return `${left} ${right}`;
    case '/':
      return `\\frac{${left}}{${right}}`;
    case '^':
      return `${left}^{${right}}`;
    case '=':
      return `${left} = ${right}`;
    case '>':
      return `${left} > ${right}`;
    case '<':
      return `${left} < ${right}`;
    case '>=':
      return `${left} \\geq ${right}`;
    case '<=':
      return `${left} \\leq ${right}`;
    default:
      throw new Error(`Unsupported binary operator: ${node.operator}`);
  }
}

function unaryExpressionToLatex(node: UnaryExpression): string {
  const operand = astToLatex(node.operand);
  return node.operator === '-' ? `-${operand}` : `+${operand}`;
}

function functionCallToLatex(node: FunctionCall): string {
  const args = node.args.map(arg => astToLatex(arg)).join(', ');

  // 特殊な関数の処理
  switch (node.name) {
    case 'sin':
    case 'cos':
    case 'tan':
    case 'asin':
    case 'acos':
    case 'atan':
    case 'sinh':
    case 'cosh':
    case 'tanh':
      return `\\${node.name}(${args})`;
    case 'log':
      return `\\log(${args})`;
    case 'ln':
      return `\\ln(${args})`;
    case 'exp':
      return `\\exp(${args})`;
    case 'sqrt':
      return `\\sqrt{${args}}`;
    default:
      return `${node.name}(${args})`;
  }
}

function integralToLatex(node: Integral): string {
  if (node.lowerBound && node.upperBound) {
    return `\\int_{${astToLatex(node.lowerBound)}}^{${astToLatex(node.upperBound)}} ${astToLatex(node.integrand)} \\, d${node.variable}`;
  } else {
    return `\\int ${astToLatex(node.integrand)} \\, d${node.variable}`;
  }
}

/**
 * Deep clone an AST node
 */
export function cloneAST(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      return { ...node };

    case 'Identifier':
      return { ...node };

    case 'BinaryExpression':
      return {
        ...node,
        left: cloneAST(node.left),
        right: cloneAST(node.right),
      };

    case 'UnaryExpression':
      return {
        ...node,
        operand: cloneAST(node.operand),
      };

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => cloneAST(arg)),
      };

    case 'Fraction':
      return {
        ...node,
        numerator: cloneAST(node.numerator),
        denominator: cloneAST(node.denominator),
      };

    case 'Integral': {
      const integralClone: Integral = {
        ...node,
        integrand: cloneAST(node.integrand),
      };
      if (node.lowerBound !== undefined) {
        integralClone.lowerBound = cloneAST(node.lowerBound);
      }
      if (node.upperBound !== undefined) {
        integralClone.upperBound = cloneAST(node.upperBound);
      }
      return integralClone;
    }

    case 'Sum':
      return {
        ...node,
        expression: cloneAST(node.expression),
        lowerBound: cloneAST(node.lowerBound),
        upperBound: cloneAST(node.upperBound),
      };

    case 'Product':
      return {
        ...node,
        expression: cloneAST(node.expression),
        lowerBound: cloneAST(node.lowerBound),
        upperBound: cloneAST(node.upperBound),
      };

    default:
      throw new Error(`Unsupported AST node type for cloning: ${(node as { type: string }).type}`);
  }
}

/**
 * Basic AST simplification
 */
export function simplifyAST(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
    case 'Identifier':
      return node;

    case 'BinaryExpression':
      return simplifyBinaryExpression(node);

    case 'UnaryExpression':
      return simplifyUnaryExpression(node);

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => simplifyAST(arg)),
      };

    case 'Fraction':
      return simplifyFraction(node);

    case 'Integral': {
      const integralSimplified: Integral = {
        ...node,
        integrand: simplifyAST(node.integrand),
      };
      if (node.lowerBound !== undefined) {
        integralSimplified.lowerBound = simplifyAST(node.lowerBound);
      }
      if (node.upperBound !== undefined) {
        integralSimplified.upperBound = simplifyAST(node.upperBound);
      }
      return integralSimplified;
    }

    case 'Sum':
    case 'Product':
      return {
        ...node,
        expression: simplifyAST(node.expression),
        lowerBound: simplifyAST(node.lowerBound),
        upperBound: simplifyAST(node.upperBound),
      };

    default:
      return node;
  }
}

function simplifyBinaryExpression(node: BinaryExpression): ASTNode {
  const left = simplifyAST(node.left);
  const right = simplifyAST(node.right);

  // 数値同士の計算
  if (left.type === 'NumberLiteral' && right.type === 'NumberLiteral') {
    switch (node.operator) {
      case '+':
        return { type: 'NumberLiteral', value: left.value + right.value };
      case '-':
        return { type: 'NumberLiteral', value: left.value - right.value };
      case '*':
        return { type: 'NumberLiteral', value: left.value * right.value };
      case '/':
        if (right.value === 0) break; // ゼロ除算回避
        return { type: 'NumberLiteral', value: left.value / right.value };
      case '^':
        return { type: 'NumberLiteral', value: Math.pow(left.value, right.value) };
    }
  }

  // 特殊ケースの簡約
  switch (node.operator) {
    case '+':
      if (left.type === 'NumberLiteral' && left.value === 0) return right;
      if (right.type === 'NumberLiteral' && right.value === 0) return left;
      break;
    case '-':
      if (right.type === 'NumberLiteral' && right.value === 0) return left;
      break;
    case '*':
      if (left.type === 'NumberLiteral' && left.value === 0) return left; // 0 * x = 0
      if (right.type === 'NumberLiteral' && right.value === 0) return right; // x * 0 = 0
      if (left.type === 'NumberLiteral' && left.value === 1) return right; // 1 * x = x
      if (right.type === 'NumberLiteral' && right.value === 1) return left; // x * 1 = x
      break;
    case '/':
      if (right.type === 'NumberLiteral' && right.value === 1) return left; // x / 1 = x
      break;
    case '^':
      if (right.type === 'NumberLiteral' && right.value === 0)
        return { type: 'NumberLiteral', value: 1 }; // x^0 = 1
      if (right.type === 'NumberLiteral' && right.value === 1) return left; // x^1 = x
      break;
  }

  return { ...node, left, right };
}

function simplifyUnaryExpression(node: UnaryExpression): ASTNode {
  const operand = simplifyAST(node.operand);

  if (operand.type === 'NumberLiteral') {
    return {
      type: 'NumberLiteral',
      value: node.operator === '-' ? -operand.value : operand.value,
    };
  }

  return { ...node, operand };
}

function simplifyFraction(node: Fraction): ASTNode {
  const numerator = simplifyAST(node.numerator);
  const denominator = simplifyAST(node.denominator);

  // 分母が1の場合
  if (denominator.type === 'NumberLiteral' && denominator.value === 1) {
    return numerator;
  }

  // 分子・分母が同じ数値の場合
  if (numerator.type === 'NumberLiteral' && denominator.type === 'NumberLiteral') {
    if (denominator.value === 0) {
      throw new Error('Division by zero');
    }
    return { type: 'NumberLiteral', value: numerator.value / denominator.value };
  }

  return { ...node, numerator, denominator };
}
