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
import { simplify } from './unified-simplify';

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

/**
 * Simplify variable multiplication patterns for better LaTeX display
 * Converts patterns like x*x*x to x^3
 */
function simplifyVariableMultiplication(node: BinaryExpression): string | null {
  if (node.operator !== '*') return null;

  // Count occurrences of each variable in a multiplication chain
  const variableCounts = new Map<string, number>();

  function countVariables(expr: ASTNode): void {
    if (expr.type === 'Identifier') {
      const count = variableCounts.get(expr.name) || 0;
      variableCounts.set(expr.name, count + 1);
    } else if (expr.type === 'BinaryExpression' && expr.operator === '*') {
      countVariables(expr.left);
      countVariables(expr.right);
    }
  }

  countVariables(node);

  // If we have repeated variables, convert to exponent form
  const parts: string[] = [];
  for (const [variable, count] of variableCounts) {
    if (count === 1) {
      parts.push(variable);
    } else {
      parts.push(`${variable}^{${count}}`);
    }
  }

  // Only return simplified form if we actually simplified something
  if (Array.from(variableCounts.values()).some(count => count > 1)) {
    return parts.join('');
  }

  return null;
}

function binaryExpressionToLatex(node: BinaryExpression): string {
  const left = astToLatex(node.left);
  const right = astToLatex(node.right);

  switch (node.operator) {
    case '+':
      return `${left} + ${right}`;
    case '-':
      return `${left} - ${right}`;
    case '*': {
      // Handle coefficient * constant/variable patterns
      if (node.left.type === 'NumberLiteral') {
        // Number * π/e should display as "2π" or "2e"
        if (
          node.right.type === 'Identifier' &&
          (node.right.name === 'π' || node.right.name === 'pi' || node.right.name === 'e')
        ) {
          return `${left}${node.right.name === 'pi' ? '\\pi' : node.right.name}`;
        }
        // Number * variable should display as "2x"
        if (node.right.type === 'Identifier') {
          return `${left}${right}`;
        }
        // Number * expression should have parentheses for addition/subtraction
        if (
          node.right.type === 'BinaryExpression' &&
          (node.right.operator === '+' || node.right.operator === '-')
        ) {
          return `${left}(${right})`;
        }
        // Number * expression should have space (unless it's a simple variable product)
        if (
          node.right.type === 'BinaryExpression' &&
          node.right.operator === '*' &&
          node.right.left.type === 'Identifier' &&
          node.right.right.type === 'Identifier'
        ) {
          // Special case: number * (var * var) should be "2xy" not "2 x y"
          return `${left}${right}`;
        }
        // Handle deeper nested variable multiplication
        if (node.right.type === 'BinaryExpression' && node.right.operator === '*') {
          // Check if the entire right side is only variables
          const isAllVariables = (expr: ASTNode): boolean => {
            if (expr.type === 'Identifier') return true;
            if (expr.type === 'BinaryExpression' && expr.operator === '*') {
              return isAllVariables(expr.left) && isAllVariables(expr.right);
            }
            return false;
          };

          if (isAllVariables(node.right)) {
            return `${left}${right}`;
          }
        }
        return `${left} ${right}`;
      }

      // Variable/constant * number should reorder for display
      if (node.right.type === 'NumberLiteral' && node.left.type === 'Identifier') {
        if (node.left.name === 'π' || node.left.name === 'pi' || node.left.name === 'e') {
          return `${right}${node.left.name === 'pi' ? '\\pi' : node.left.name}`;
        }
        return `${right}${left}`;
      }

      // Variable * Variable should be combined without space (xy, not x y)
      if (node.left.type === 'Identifier' && node.right.type === 'Identifier') {
        // Same variable: x * x -> x^2 representation in LaTeX
        if (node.left.name === node.right.name) {
          return `${left}^{2}`;
        }
        return `${left}${right}`;
      }

      // Handle complex variable multiplication patterns and convert to exponent form
      const simplifiedMultiplication = simplifyVariableMultiplication(node);
      if (simplifiedMultiplication !== null) {
        return simplifiedMultiplication;
      }

      // Default: LaTeXでは通常乗算記号を省略し、スペースで区切る
      return `${left} ${right}`;
    }
    case '/':
      return `\\frac{${left}}{${right}}`;
    case '^': {
      // Add parentheses around complex base expressions for clarity
      let baseStr = left;
      if (
        node.left.type === 'BinaryExpression' &&
        (node.left.operator === '+' ||
          node.left.operator === '-' ||
          node.left.operator === '*' ||
          node.left.operator === '/')
      ) {
        baseStr = `(${left})`;
      }

      // Simplify exponent display for simple numbers
      if (
        node.right.type === 'NumberLiteral' &&
        Number.isInteger(node.right.value) &&
        node.right.value >= 0 &&
        node.right.value <= 9
      ) {
        return `${baseStr}^{${right}}`;
      }
      return `${baseStr}^{${right}}`;
    }
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
 * Legacy compatibility function - Use unified-simplify.ts instead
 * Now properly delegates to the unified simplify function
 */
export function simplifyAST(node: ASTNode): ASTNode {
  return simplify(node);
}
