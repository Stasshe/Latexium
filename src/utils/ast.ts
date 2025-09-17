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
      // Convert mathematical constants to LaTeX format
      switch (node.name) {
        case 'π':
          return '\\pi';
        case 'e':
          return 'e'; // e is typically not escaped in LaTeX
        case 'i':
          return 'i'; // imaginary unit
        default:
          return node.name;
      }

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

/**
 * Extract coefficient and variable part from a term
 * Returns { coefficient: number, variablePart: ASTNode | null }
 */
function extractCoefficientAndVariable(node: ASTNode): {
  coefficient: number;
  variablePart: ASTNode | null;
} {
  switch (node.type) {
    case 'NumberLiteral':
      return { coefficient: node.value, variablePart: null };

    case 'Identifier':
      return { coefficient: 1, variablePart: node };

    case 'BinaryExpression':
      if (node.operator === '*') {
        // Check if left is number and right is variable part
        if (node.left.type === 'NumberLiteral') {
          return { coefficient: node.left.value, variablePart: node.right };
        }
        // Check if right is number and left is variable part
        if (node.right.type === 'NumberLiteral') {
          return { coefficient: node.right.value, variablePart: node.left };
        }
      }
      return { coefficient: 1, variablePart: node };

    default:
      return { coefficient: 1, variablePart: node };
  }
}

/**
 * Combine like terms in addition
 */
function combineLikeTerms(terms: ASTNode[]): ASTNode[] {
  const termMap = new Map<string, { coefficient: number; variablePart: ASTNode | null }>();

  for (const term of terms) {
    const { coefficient, variablePart } = extractCoefficientAndVariable(term);

    // Use LaTeX representation of variable part as key
    const key = variablePart ? astToLatex(variablePart) : 'constant';

    if (termMap.has(key)) {
      const existing = termMap.get(key)!;
      existing.coefficient += coefficient;
    } else {
      termMap.set(key, { coefficient, variablePart });
    }
  }

  // Convert back to AST nodes
  const result: ASTNode[] = [];
  for (const [key, { coefficient, variablePart }] of termMap) {
    if (coefficient === 0) continue; // Skip zero terms

    if (!variablePart) {
      // Constant term
      result.push({ type: 'NumberLiteral', value: coefficient });
    } else if (coefficient === 1) {
      // Coefficient is 1, just use variable part
      result.push(variablePart);
    } else if (coefficient === -1) {
      // Coefficient is -1, use unary minus
      result.push({
        type: 'UnaryExpression',
        operator: '-',
        operand: variablePart,
      });
    } else {
      // General case: coefficient * variable
      result.push({
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'NumberLiteral', value: coefficient },
        right: variablePart,
      });
    }
  }

  return result;
}

/**
 * Extract all terms from an addition expression
 */
function extractAdditionTerms(node: ASTNode): ASTNode[] {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...extractAdditionTerms(node.left), ...extractAdditionTerms(node.right)];
  }
  return [node];
}

/**
 * Build addition expression from terms
 */
function buildAdditionFromTerms(terms: ASTNode[]): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }
  if (terms.length === 1) {
    return terms[0]!;
  }

  let result = terms[0]!;
  for (let i = 1; i < terms.length; i++) {
    result = {
      type: 'BinaryExpression',
      operator: '+',
      left: result,
      right: terms[i]!,
    };
  }
  return result;
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
      // Extract all terms from the addition
      const allTerms = extractAdditionTerms(node);

      // Check for immediate simplifications first
      if (allTerms.length === 2) {
        const [term1, term2] = allTerms;

        // x + 0 = x
        if (term2!.type === 'NumberLiteral' && term2!.value === 0) return term1!;
        if (term1!.type === 'NumberLiteral' && term1!.value === 0) return term2!;

        // Fraction addition: a/b + c/d = (ad + bc)/(bd)
        if (term1!.type === 'Fraction' && term2!.type === 'Fraction') {
          const newNumerator: ASTNode = {
            type: 'BinaryExpression',
            operator: '+',
            left: {
              type: 'BinaryExpression',
              operator: '*',
              left: term1!.numerator,
              right: term2!.denominator,
            },
            right: {
              type: 'BinaryExpression',
              operator: '*',
              left: term2!.numerator,
              right: term1!.denominator,
            },
          };

          const newDenominator: ASTNode = {
            type: 'BinaryExpression',
            operator: '*',
            left: term1!.denominator,
            right: term2!.denominator,
          };

          return simplifyAST({
            type: 'Fraction',
            numerator: newNumerator,
            denominator: newDenominator,
          });
        }
      }

      // Combine like terms for all terms
      const combinedTerms = combineLikeTerms(allTerms);

      // If we reduced the number of terms, rebuild the expression
      if (combinedTerms.length < allTerms.length) {
        return simplifyAST(buildAdditionFromTerms(combinedTerms));
      }

      // No simplification possible
      return node;
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
