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

/**
 * Check if two AST nodes are equivalent (represent the same expression)
 */
function areEquivalentNodes(left: ASTNode, right: ASTNode): boolean {
  if (left.type !== right.type) return false;

  switch (left.type) {
    case 'NumberLiteral':
      return (right as typeof left).value === left.value;
    case 'Identifier':
      return (right as typeof left).name === left.name;
    case 'BinaryExpression': {
      const rightBinary = right as typeof left;
      return (
        left.operator === rightBinary.operator &&
        areEquivalentNodes(left.left, rightBinary.left) &&
        areEquivalentNodes(left.right, rightBinary.right)
      );
    }
    case 'UnaryExpression': {
      const rightUnary = right as typeof left;
      return (
        left.operator === rightUnary.operator &&
        areEquivalentNodes(left.operand, rightUnary.operand)
      );
    }
    case 'FunctionCall': {
      const rightFunction = right as typeof left;
      return (
        left.name === rightFunction.name &&
        left.args.length === rightFunction.args.length &&
        left.args.every((arg, i) => areEquivalentNodes(arg, rightFunction.args[i]!))
      );
    }
    case 'Fraction': {
      const rightFraction = right as typeof left;
      return (
        areEquivalentNodes(left.numerator, rightFraction.numerator) &&
        areEquivalentNodes(left.denominator, rightFraction.denominator)
      );
    }
    default:
      return false;
  }
}

/**
 * Calculate Greatest Common Divisor
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
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
    case '+': {
      // 0 + x = x, x + 0 = x
      if (left.type === 'NumberLiteral' && left.value === 0) return right;
      if (right.type === 'NumberLiteral' && right.value === 0) return left;

      // 分数の加算: a/b + c/d = (ad + bc)/(bd)
      if (left.type === 'Fraction' && right.type === 'Fraction') {
        const newNumerator: ASTNode = {
          type: 'BinaryExpression',
          operator: '+',
          left: {
            type: 'BinaryExpression',
            operator: '*',
            left: left.numerator,
            right: right.denominator,
          },
          right: {
            type: 'BinaryExpression',
            operator: '*',
            left: right.numerator,
            right: left.denominator,
          },
        };

        const newDenominator: ASTNode = {
          type: 'BinaryExpression',
          operator: '*',
          left: left.denominator,
          right: right.denominator,
        };

        return simplifyAST({
          type: 'Fraction',
          numerator: newNumerator,
          denominator: newDenominator,
        });
      }

      // 同類項の結合: 2x + 3x = 5x (基本ケース)
      if (areEquivalentNodes(left, right)) {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: 2 },
          right: left,
        };
      }
      break;
    }

    case '-':
      // x - 0 = x
      if (right.type === 'NumberLiteral' && right.value === 0) return left;
      // x - x = 0
      if (areEquivalentNodes(left, right)) {
        return { type: 'NumberLiteral', value: 0 };
      }
      break;

    case '*':
      // 0 * x = 0, x * 0 = 0
      if (left.type === 'NumberLiteral' && left.value === 0) return left;
      if (right.type === 'NumberLiteral' && right.value === 0) return right;
      // 1 * x = x, x * 1 = x
      if (left.type === 'NumberLiteral' && left.value === 1) return right;
      if (right.type === 'NumberLiteral' && right.value === 1) return left;
      break;

    case '/':
      // x / 1 = x
      if (right.type === 'NumberLiteral' && right.value === 1) return left;
      // x / x = 1 (x ≠ 0)
      if (areEquivalentNodes(left, right)) {
        return { type: 'NumberLiteral', value: 1 };
      }
      break;

    case '^':
      // x^0 = 1
      if (right.type === 'NumberLiteral' && right.value === 0) {
        return { type: 'NumberLiteral', value: 1 };
      }
      // x^1 = x
      if (right.type === 'NumberLiteral' && right.value === 1) return left;
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

  // 複分数の簡約: (a/b)/(c/d) = (a/b) * (d/c) = (ad)/(bc)
  if (numerator.type === 'Fraction' && denominator.type === 'Fraction') {
    const newNumerator: ASTNode = {
      type: 'BinaryExpression',
      operator: '*',
      left: numerator.numerator,
      right: denominator.denominator,
    };
    const newDenominator: ASTNode = {
      type: 'BinaryExpression',
      operator: '*',
      left: numerator.denominator,
      right: denominator.numerator,
    };

    return simplifyAST({
      type: 'Fraction',
      numerator: newNumerator,
      denominator: newDenominator,
    });
  }

  // 分母が1の場合: x/1 = x
  if (denominator.type === 'NumberLiteral' && denominator.value === 1) {
    return numerator;
  }

  // 分子・分母が同じ数値の場合: 5/3 = 1.666...
  if (numerator.type === 'NumberLiteral' && denominator.type === 'NumberLiteral') {
    if (denominator.value === 0) {
      throw new Error('Division by zero');
    }

    // 約分を試行
    const num = numerator.value;
    const den = denominator.value;
    const commonDivisor = gcd(num, den);

    if (commonDivisor > 1) {
      const simplifiedNum = num / commonDivisor;
      const simplifiedDen = den / commonDivisor;

      if (simplifiedDen === 1) {
        return { type: 'NumberLiteral', value: simplifiedNum };
      }

      return {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: simplifiedNum },
        denominator: { type: 'NumberLiteral', value: simplifiedDen },
      };
    }

    // 約分できない場合も分数形式で保持
    return { ...node, numerator, denominator };
  }

  // 分子・分母が同じ表現の場合: x/x = 1
  if (areEquivalentNodes(numerator, denominator)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  // 分子が0の場合: 0/x = 0
  if (numerator.type === 'NumberLiteral' && numerator.value === 0) {
    return numerator;
  }

  return { ...node, numerator, denominator };
}
