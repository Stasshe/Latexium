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
import { canDistribute, applyDistributiveLaw, expandPower } from './distribution';
import { factorCommonFactors, factorQuadratic, factorDifferenceOfSquares } from './factorization';
import { astToPolynomial, factorPolynomial, Polynomial } from './polynomial';
import {
  gcd,
  reduceFraction,
  addFractions,
  multiplyFractions,
  divideFractions,
  areEquivalentExpressions,
} from './simplification';

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

/**
 * Simplify variable multiplication patterns in AST structure
 * Converts patterns like x*x*x to x^3 in the actual AST
 */
function simplifyVariableMultiplicationAST(node: BinaryExpression): ASTNode | null {
  if (node.operator !== '*') return null;

  // Count occurrences of each variable in a multiplication chain
  const variableCounts = new Map<string, number>();

  function countVariables(expr: ASTNode): void {
    if (expr.type === 'Identifier') {
      const count = variableCounts.get(expr.name) || 0;
      variableCounts.set(expr.name, count + 1);
    } else if (expr.type === 'BinaryExpression' && expr.operator === '^') {
      // Handle power expressions like x^2
      if (expr.left.type === 'Identifier' && expr.right.type === 'NumberLiteral') {
        const count = variableCounts.get(expr.left.name) || 0;
        variableCounts.set(expr.left.name, count + expr.right.value);
      }
    } else if (expr.type === 'BinaryExpression' && expr.operator === '*') {
      countVariables(expr.left);
      countVariables(expr.right);
    }
  }

  countVariables(node);

  // Check if we have any repeated variables or powers to combine
  const hasSimplification = Array.from(variableCounts.values()).some(count => count > 1);
  if (!hasSimplification) return null;

  // Build simplified expression
  const parts: ASTNode[] = [];
  for (const [variable, count] of variableCounts) {
    if (count === 1) {
      parts.push({ type: 'Identifier', name: variable });
    } else {
      parts.push({
        type: 'BinaryExpression',
        operator: '^',
        left: { type: 'Identifier', name: variable },
        right: { type: 'NumberLiteral', value: count },
      });
    }
  }

  // Combine parts with multiplication
  if (parts.length === 1) {
    return parts[0]!;
  }

  let result = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    result = {
      type: 'BinaryExpression',
      operator: '*',
      left: result,
      right: parts[i]!,
    };
  }

  return result;
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
 * Enhanced AST simplification with advanced features
 */
export function simplifyAST(node: ASTNode): ASTNode {
  // Pre-process: Handle specific patterns that need early simplification
  node = preprocessSpecialPatterns(node);

  switch (node.type) {
    case 'NumberLiteral':
    case 'Identifier':
      return node;

    case 'BinaryExpression':
      return simplifyBinaryExpression(node);

    case 'UnaryExpression':
      return simplifyUnaryExpression(node);

    case 'FunctionCall':
      // Check if this is actually implicit multiplication rather than a function call
      // Pattern: single variable name followed by an expression (e.g., "x(y + z)")
      if (node.args.length === 1 && node.name.match(/^[a-zA-Z]$/) && node.args[0]) {
        // Convert FunctionCall to multiplication: x(expr) → x * expr
        const implicitMultiplication: BinaryExpression = {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'Identifier', name: node.name },
          right: node.args[0],
        };
        return simplifyAST(implicitMultiplication);
      }

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
 * Preprocess special patterns before main simplification
 */
function preprocessSpecialPatterns(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'BinaryExpression':
      // Handle coefficient * 1 patterns
      if (node.operator === '*' && node.right.type === 'NumberLiteral' && node.right.value === 1) {
        return preprocessSpecialPatterns(node.left);
      }
      if (node.operator === '*' && node.left.type === 'NumberLiteral' && node.left.value === 1) {
        return preprocessSpecialPatterns(node.right);
      }

      // Handle x^(n-1) patterns
      if (
        node.operator === '^' &&
        node.right.type === 'BinaryExpression' &&
        node.right.operator === '-' &&
        node.right.left.type === 'NumberLiteral' &&
        node.right.right.type === 'NumberLiteral'
      ) {
        const newExponent = node.right.left.value - node.right.right.value;
        return {
          ...node,
          left: preprocessSpecialPatterns(node.left),
          right: { type: 'NumberLiteral', value: newExponent },
        };
      }

      return {
        ...node,
        left: preprocessSpecialPatterns(node.left),
        right: preprocessSpecialPatterns(node.right),
      };

    case 'UnaryExpression':
      return {
        ...node,
        operand: preprocessSpecialPatterns(node.operand),
      };

    case 'Fraction':
      return {
        ...node,
        numerator: preprocessSpecialPatterns(node.numerator),
        denominator: preprocessSpecialPatterns(node.denominator),
      };

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => preprocessSpecialPatterns(arg)),
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
      if (node.operator === '^') {
        // Handle power expressions like x^2
        return { coefficient: 1, variablePart: node };
      }
      if (node.operator === '*') {
        // Check if left is number and right is variable part
        if (node.left.type === 'NumberLiteral') {
          return { coefficient: node.left.value, variablePart: node.right };
        }
        // Check if right is number and left is variable part
        if (node.right.type === 'NumberLiteral') {
          return { coefficient: node.right.value, variablePart: node.left };
        }
        // Handle complex multiplications like (a * b) where both might contain coefficients
        const leftCoeff = extractCoefficientAndVariable(node.left);
        const rightCoeff = extractCoefficientAndVariable(node.right);

        // If both have variable parts, combine into multiplication
        if (leftCoeff.variablePart && rightCoeff.variablePart) {
          const combinedVariable: ASTNode = {
            type: 'BinaryExpression',
            operator: '*',
            left: leftCoeff.variablePart,
            right: rightCoeff.variablePart,
          };
          return {
            coefficient: leftCoeff.coefficient * rightCoeff.coefficient,
            variablePart: combinedVariable,
          };
        }

        // If only one has variable part
        if (leftCoeff.variablePart) {
          return {
            coefficient: leftCoeff.coefficient * rightCoeff.coefficient,
            variablePart: leftCoeff.variablePart,
          };
        }
        if (rightCoeff.variablePart) {
          return {
            coefficient: leftCoeff.coefficient * rightCoeff.coefficient,
            variablePart: rightCoeff.variablePart,
          };
        }

        // Both are constants
        return { coefficient: leftCoeff.coefficient * rightCoeff.coefficient, variablePart: null };
      }
      return { coefficient: 1, variablePart: node };

    case 'UnaryExpression':
      if (node.operator === '-') {
        const inner = extractCoefficientAndVariable(node.operand);
        return { coefficient: -inner.coefficient, variablePart: inner.variablePart };
      }
      return { coefficient: 1, variablePart: node };

    case 'Fraction':
      // Handle fractions like 1/2 * x
      if (node.numerator.type === 'NumberLiteral' && node.denominator.type === 'NumberLiteral') {
        return { coefficient: node.numerator.value / node.denominator.value, variablePart: null };
      }
      return { coefficient: 1, variablePart: node };

    default:
      return { coefficient: 1, variablePart: node };
  }
}

/**
 * Normalize variable part to combine powers of the same variable
 * For example: x^2 * x -> x^3, x * x * x -> x^3
 */
function normalizeVariablePart(node: ASTNode): ASTNode {
  if (!node) return node;

  // If it's a simple identifier, return as is
  if (node.type === 'Identifier') {
    return node;
  }

  // If it's a power expression, return as is (already normalized)
  if (node.type === 'BinaryExpression' && node.operator === '^') {
    return node;
  }

  // If it's a multiplication chain, try to simplify variable powers
  if (node.type === 'BinaryExpression' && node.operator === '*') {
    const simplified = simplifyVariableMultiplicationAST(node);
    return simplified || node;
  }

  return node;
}

/**
 * Combine like terms in addition
 */
function combineLikeTerms(terms: ASTNode[]): ASTNode[] {
  const termMap = new Map<string, { coefficient: number; variablePart: ASTNode | null }>();

  for (const term of terms) {
    const { coefficient, variablePart } = extractCoefficientAndVariable(term);

    // Normalize the variable part to combine powers
    const normalizedVarPart = variablePart ? normalizeVariablePart(variablePart) : null;

    // Use LaTeX representation of normalized variable part as key
    const key = normalizedVarPart ? astToLatex(normalizedVarPart) : 'constant';

    if (termMap.has(key)) {
      const existing = termMap.get(key)!;
      existing.coefficient += coefficient;
    } else {
      termMap.set(key, { coefficient, variablePart: normalizedVarPart });
    }
  }

  // Convert back to AST nodes
  const result: ASTNode[] = [];
  for (const [key, { coefficient, variablePart }] of termMap) {
    if (Math.abs(coefficient) < 1e-10) continue; // Skip zero terms

    if (!variablePart) {
      // Constant term
      result.push({ type: 'NumberLiteral', value: coefficient });
    } else if (Math.abs(coefficient - 1) < 1e-10) {
      // Coefficient is 1, just use variable part
      result.push(variablePart);
    } else if (Math.abs(coefficient + 1) < 1e-10) {
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
 * Extract all terms from an addition/subtraction expression
 * Converts subtraction to addition of negative terms
 */
function extractAdditionTerms(node: ASTNode): ASTNode[] {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...extractAdditionTerms(node.left), ...extractAdditionTerms(node.right)];
  }
  if (node.type === 'BinaryExpression' && node.operator === '-') {
    // Convert a - b to a + (-b)
    const leftTerms = extractAdditionTerms(node.left);
    const rightTerms = extractAdditionTerms(node.right);
    const negatedRightTerms = rightTerms.map(term => ({
      type: 'UnaryExpression' as const,
      operator: '-' as const,
      operand: term,
    }));
    return [...leftTerms, ...negatedRightTerms];
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

  // Try advanced factorization first
  // Currently disabled to avoid undefined function error
  // const factorized = tryAdvancedFactorization({ ...node, left, right });
  // if (factorized) {
  //   return factorized;
  // }

  // 特殊ケースの簡約
  switch (node.operator) {
    case '+': {
      // Extract all terms from the addition
      const allTerms = extractAdditionTerms(node);

      // Check for immediate simplifications first
      if (allTerms.length === 2) {
        const [term1, term2] = allTerms;

        // x + 0 = x, 0 + x = x
        if (term2!.type === 'NumberLiteral' && term2!.value === 0) return term1!;
        if (term1!.type === 'NumberLiteral' && term1!.value === 0) return term2!;

        // Enhanced fraction addition using simplification.ts functions
        if (term1!.type === 'Fraction' && term2!.type === 'Fraction') {
          const frac1 = term1! as Fraction;
          const frac2 = term2! as Fraction;

          // Extract numeric values if possible
          if (
            frac1.numerator.type === 'NumberLiteral' &&
            frac1.denominator.type === 'NumberLiteral' &&
            frac2.numerator.type === 'NumberLiteral' &&
            frac2.denominator.type === 'NumberLiteral'
          ) {
            const result = addFractions(
              frac1.numerator.value,
              frac1.denominator.value,
              frac2.numerator.value,
              frac2.denominator.value
            );

            if (result.den === 1) {
              return { type: 'NumberLiteral', value: result.num };
            }

            return {
              type: 'Fraction',
              numerator: { type: 'NumberLiteral', value: result.num },
              denominator: { type: 'NumberLiteral', value: result.den },
            };
          }

          // Fallback to standard fraction addition for symbolic expressions
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

      // Remove zero terms from all terms
      const nonZeroTerms = allTerms.filter(
        term => !(term.type === 'NumberLiteral' && term.value === 0)
      );

      // If all terms are zero, return 0
      if (nonZeroTerms.length === 0) {
        return { type: 'NumberLiteral', value: 0 };
      }

      // If only one term left, return it
      if (nonZeroTerms.length === 1) {
        return nonZeroTerms[0]!;
      }

      // Combine like terms for all terms
      const combinedTerms = combineLikeTerms(nonZeroTerms);

      // If we reduced the number of terms, rebuild the expression
      if (combinedTerms.length < nonZeroTerms.length) {
        return simplifyAST(buildAdditionFromTerms(combinedTerms));
      }

      // If terms changed, rebuild
      if (nonZeroTerms.length < allTerms.length) {
        return simplifyAST(buildAdditionFromTerms(nonZeroTerms));
      }

      // Try factoring common factors
      // Inner system use formula as all multiplications are expanded.
      // const factoredExpr = factorCommonFactors(buildAdditionFromTerms(nonZeroTerms));
      // if (!areEquivalentExpressions(factoredExpr, buildAdditionFromTerms(nonZeroTerms))) {
      //   return simplifyAST(factoredExpr);
      // }

      // No simplification possible
      return { ...node, left, right };
    }

    case '-': {
      // x - 0 = x
      if (right.type === 'NumberLiteral' && right.value === 0) return left;
      // 0 - x = -x
      if (left.type === 'NumberLiteral' && left.value === 0) {
        return {
          type: 'UnaryExpression',
          operator: '-',
          operand: right,
        };
      }
      // x - x = 0
      if (areEquivalentNodes(left, right)) {
        return { type: 'NumberLiteral', value: 0 };
      }

      // Enhanced fraction subtraction: a/b - c/d = (ad - bc)/(bd)
      if (left.type === 'Fraction' && right.type === 'Fraction') {
        const frac1 = left as Fraction;
        const frac2 = right as Fraction;

        if (
          frac1.numerator.type === 'NumberLiteral' &&
          frac1.denominator.type === 'NumberLiteral' &&
          frac2.numerator.type === 'NumberLiteral' &&
          frac2.denominator.type === 'NumberLiteral'
        ) {
          // Same denominator: a/b - c/b = (a-c)/b
          if (frac1.denominator.value === frac2.denominator.value) {
            const resultNum = frac1.numerator.value - frac2.numerator.value;
            const resultDen = frac1.denominator.value;

            if (resultNum === 0) {
              return { type: 'NumberLiteral', value: 0 };
            }

            const reduced = reduceFraction(resultNum, resultDen);

            if (reduced.den === 1) {
              return { type: 'NumberLiteral', value: reduced.num };
            }

            return {
              type: 'Fraction',
              numerator: { type: 'NumberLiteral', value: reduced.num },
              denominator: { type: 'NumberLiteral', value: reduced.den },
            };
          }

          // Different denominators: use general subtraction formula
          const result = addFractions(
            frac1.numerator.value,
            frac1.denominator.value,
            -frac2.numerator.value,
            frac2.denominator.value
          );

          if (result.num === 0) {
            return { type: 'NumberLiteral', value: 0 };
          }

          if (result.den === 1) {
            return { type: 'NumberLiteral', value: result.num };
          }

          return {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: result.num },
            denominator: { type: 'NumberLiteral', value: result.den },
          };
        }
      }

      // Combine like terms for subtraction (convert to addition)
      // Extract all terms treating subtraction as addition of negative terms
      const allTerms = extractAdditionTerms({ ...node, left, right });

      // Remove zero terms
      const nonZeroTerms = allTerms.filter(
        term => !(term.type === 'NumberLiteral' && term.value === 0)
      );

      // If all terms are zero, return 0
      if (nonZeroTerms.length === 0) {
        return { type: 'NumberLiteral', value: 0 };
      }

      // If only one term left, return it
      if (nonZeroTerms.length === 1) {
        return nonZeroTerms[0]!;
      }

      // Combine like terms
      const combinedTerms = combineLikeTerms(nonZeroTerms);

      // If we reduced the number of terms, rebuild the expression
      if (combinedTerms.length < nonZeroTerms.length || combinedTerms.length < allTerms.length) {
        return simplifyAST(buildAdditionFromTerms(combinedTerms));
      }

      // Try difference of squares factorization
      const diffSquares = factorDifferenceOfSquares({ ...node, left, right });
      if (diffSquares) {
        return simplifyAST(diffSquares);
      }

      break;
    }

    case '*': {
      // 0 * x = 0, x * 0 = 0
      if (left.type === 'NumberLiteral' && left.value === 0) return left;
      if (right.type === 'NumberLiteral' && right.value === 0) return right;
      // 1 * x = x, x * 1 = x
      if (left.type === 'NumberLiteral' && left.value === 1) return right;
      if (right.type === 'NumberLiteral' && right.value === 1) return left;

      // Enhanced fraction multiplication using simplification.ts functions
      if (left.type === 'Fraction' && right.type === 'NumberLiteral') {
        const frac = left as Fraction;
        if (frac.numerator.type === 'NumberLiteral' && frac.denominator.type === 'NumberLiteral') {
          const result = multiplyFractions(
            frac.numerator.value,
            frac.denominator.value,
            right.value,
            1
          );

          if (result.den === 1) {
            return { type: 'NumberLiteral', value: result.num };
          }

          return {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: result.num },
            denominator: { type: 'NumberLiteral', value: result.den },
          };
        }

        // Fallback for symbolic expressions
        return simplifyAST({
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '*',
            left: left.numerator,
            right: right,
          },
          denominator: left.denominator,
        });
      }

      // Handle fraction * fraction multiplication: (a/b) * (c/d) = (a*c)/(b*d)
      if (left.type === 'Fraction' && right.type === 'Fraction') {
        const frac1 = left as Fraction;
        const frac2 = right as Fraction;

        if (
          frac1.numerator.type === 'NumberLiteral' &&
          frac1.denominator.type === 'NumberLiteral' &&
          frac2.numerator.type === 'NumberLiteral' &&
          frac2.denominator.type === 'NumberLiteral'
        ) {
          const result = multiplyFractions(
            frac1.numerator.value,
            frac1.denominator.value,
            frac2.numerator.value,
            frac2.denominator.value
          );

          if (result.den === 1) {
            return { type: 'NumberLiteral', value: result.num };
          }

          return {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: result.num },
            denominator: { type: 'NumberLiteral', value: result.den },
          };
        }

        // Fallback for symbolic expressions
        return simplifyAST({
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '*',
            left: frac1.numerator,
            right: frac2.numerator,
          },
          denominator: {
            type: 'BinaryExpression',
            operator: '*',
            left: frac1.denominator,
            right: frac2.denominator,
          },
        });
      }

      // Handle number * fraction multiplication: c * (a/b) = (c*a)/b
      if (left.type === 'NumberLiteral' && right.type === 'Fraction') {
        const frac = right as Fraction;
        if (frac.numerator.type === 'NumberLiteral' && frac.denominator.type === 'NumberLiteral') {
          const result = multiplyFractions(
            left.value,
            1,
            frac.numerator.value,
            frac.denominator.value
          );

          return {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: result.num },
            denominator: { type: 'NumberLiteral', value: result.den },
          };
        }

        // Fallback for symbolic expressions
        return simplifyAST({
          type: 'Fraction',
          numerator: {
            type: 'BinaryExpression',
            operator: '*',
            left: left,
            right: right.numerator,
          },
          denominator: right.denominator,
        });
      }

      // Coefficient ordering and combination
      // π * 2 → 2π, x * 2 → 2x (coefficient goes first)
      if (right.type === 'NumberLiteral' && left.type === 'Identifier') {
        return { ...node, left: right, right: left };
      }

      // 2 * π → 2π, but keep as is for LaTeX display
      if (
        left.type === 'NumberLiteral' &&
        right.type === 'Identifier' &&
        (right.name === 'pi' || right.name === 'π' || right.name === 'e')
      ) {
        // Keep the structure for LaTeX display as coefficient * constant
        return { ...node, left, right };
      }

      // Handle nested multiplications: (2 * x) * 3 → 6x
      if (
        left.type === 'BinaryExpression' &&
        left.operator === '*' &&
        left.left.type === 'NumberLiteral' &&
        right.type === 'NumberLiteral'
      ) {
        const newCoeff = left.left.value * right.value;
        return simplifyAST({
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: newCoeff },
          right: left.right,
        });
      }

      // Handle nested multiplications: 2 * (3 * x) → 6x
      if (
        right.type === 'BinaryExpression' &&
        right.operator === '*' &&
        right.left.type === 'NumberLiteral' &&
        left.type === 'NumberLiteral'
      ) {
        const newCoeff = left.value * right.left.value;
        return simplifyAST({
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: newCoeff },
          right: right.right,
        });
      }

      // Same variable multiplication: x * x → x^2
      if (left.type === 'Identifier' && right.type === 'Identifier' && left.name === right.name) {
        return {
          type: 'BinaryExpression',
          operator: '^',
          left: left,
          right: { type: 'NumberLiteral', value: 2 },
        };
      }

      // Handle complex variable multiplication chains: x*x*x → x^3
      const simplifiedVarMult = simplifyVariableMultiplicationAST({ ...node, left, right });
      if (simplifiedVarMult) {
        return simplifiedVarMult; // Don't recursively simplify to avoid stack overflow
      }

      // Apply distributive law if applicable
      const currentMultNode: BinaryExpression = { ...node, left, right };
      if (canDistribute(currentMultNode)) {
        const distributed = applyDistributiveLaw(currentMultNode);
        if (distributed !== currentMultNode) {
          return simplifyAST(distributed);
        }
      }

      break;
    }

    case '/':
      // 0 / x = 0 (x ≠ 0)
      if (left.type === 'NumberLiteral' && left.value === 0) return left;
      // x / 1 = x
      if (right.type === 'NumberLiteral' && right.value === 1) return left;
      // x / x = 1 (x ≠ 0)
      if (areEquivalentNodes(left, right)) {
        return { type: 'NumberLiteral', value: 1 };
      }

      // Enhanced fraction division using simplification.ts functions
      if (left.type === 'Fraction' && right.type === 'Fraction') {
        const frac1 = left as Fraction;
        const frac2 = right as Fraction;

        if (
          frac1.numerator.type === 'NumberLiteral' &&
          frac1.denominator.type === 'NumberLiteral' &&
          frac2.numerator.type === 'NumberLiteral' &&
          frac2.denominator.type === 'NumberLiteral'
        ) {
          const result = divideFractions(
            frac1.numerator.value,
            frac1.denominator.value,
            frac2.numerator.value,
            frac2.denominator.value
          );

          if (result.den === 1) {
            return { type: 'NumberLiteral', value: result.num };
          }

          return {
            type: 'Fraction',
            numerator: { type: 'NumberLiteral', value: result.num },
            denominator: { type: 'NumberLiteral', value: result.den },
          };
        }
      }

      break;

    case '^':
      // x^0 = 1
      if (right.type === 'NumberLiteral' && right.value === 0) {
        return { type: 'NumberLiteral', value: 1 };
      }
      // x^1 = x
      if (right.type === 'NumberLiteral' && right.value === 1) return left;
      // 0^x = 0 (x > 0)
      if (
        left.type === 'NumberLiteral' &&
        left.value === 0 &&
        right.type === 'NumberLiteral' &&
        right.value > 0
      ) {
        return left;
      }

      // Handle power expansion for simple integer exponents
      if (
        right.type === 'NumberLiteral' &&
        Number.isInteger(right.value) &&
        right.value > 1 &&
        right.value <= 4
      ) {
        const expanded = expandPower(left, right.value);
        if (expanded !== left) {
          return simplifyAST(expanded);
        }
      }

      // Simplify power expressions like x^(3-1) → x^2
      if (
        right.type === 'BinaryExpression' &&
        right.operator === '-' &&
        right.left.type === 'NumberLiteral' &&
        right.right.type === 'NumberLiteral'
      ) {
        const simplifiedPower = right.left.value - right.right.value;
        if (simplifiedPower === 0) {
          return { type: 'NumberLiteral', value: 1 };
        }
        if (simplifiedPower === 1) {
          return left;
        }
        return {
          ...node,
          left,
          right: { type: 'NumberLiteral', value: simplifiedPower },
        };
      }
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

/**
 * Extract numeric coefficient from a multiplication expression
 * Returns {coefficient: number | null, remainingPart: ASTNode}
 */
function extractNumericCoefficient(node: ASTNode): {
  coefficient: number | null;
  remainingPart: ASTNode;
} {
  if (node.type === 'NumberLiteral') {
    return {
      coefficient: node.value,
      remainingPart: { type: 'NumberLiteral', value: 1 },
    };
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (node.left.type === 'NumberLiteral') {
      return {
        coefficient: node.left.value,
        remainingPart: node.right,
      };
    }
    if (node.right.type === 'NumberLiteral') {
      return {
        coefficient: node.right.value,
        remainingPart: node.left,
      };
    }
  }

  return {
    coefficient: null,
    remainingPart: node,
  };
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

  // 分子が0の場合: 0/x = 0
  if (numerator.type === 'NumberLiteral' && numerator.value === 0) {
    return numerator;
  }

  // 分子が0を含む式の場合 (e.g., 0*a - b*0)
  if (numerator.type === 'BinaryExpression') {
    // Check for expressions that evaluate to zero
    if (
      (numerator.operator === '-' || numerator.operator === '+') &&
      ((numerator.left.type === 'NumberLiteral' && numerator.left.value === 0) ||
        (numerator.right.type === 'NumberLiteral' && numerator.right.value === 0))
    ) {
      if (
        numerator.operator === '-' &&
        numerator.left.type === 'NumberLiteral' &&
        numerator.left.value === 0 &&
        numerator.right.type === 'NumberLiteral' &&
        numerator.right.value === 0
      ) {
        return { type: 'NumberLiteral', value: 0 };
      }

      if (
        numerator.operator === '+' &&
        ((numerator.left.type === 'NumberLiteral' && numerator.left.value === 0) ||
          (numerator.right.type === 'NumberLiteral' && numerator.right.value === 0))
      ) {
        const nonZeroTerm =
          numerator.left.type === 'NumberLiteral' && numerator.left.value === 0
            ? numerator.right
            : numerator.left;
        if (nonZeroTerm.type === 'NumberLiteral' && nonZeroTerm.value === 0) {
          return { type: 'NumberLiteral', value: 0 };
        }
      }
    }

    // Check for multiplication by zero: 0 * anything = 0
    if (
      numerator.operator === '*' &&
      ((numerator.left.type === 'NumberLiteral' && numerator.left.value === 0) ||
        (numerator.right.type === 'NumberLiteral' && numerator.right.value === 0))
    ) {
      return { type: 'NumberLiteral', value: 0 };
    }
  }

  // Enhanced symbolic fraction simplification for coefficient extraction
  // Handle cases like: 2x/4y → x/2y
  if (
    numerator.type === 'BinaryExpression' &&
    numerator.operator === '*' &&
    denominator.type === 'BinaryExpression' &&
    denominator.operator === '*'
  ) {
    const numCoeff = extractNumericCoefficient(numerator);
    const denCoeff = extractNumericCoefficient(denominator);

    if (numCoeff.coefficient !== null && denCoeff.coefficient !== null) {
      const reduced = reduceFraction(numCoeff.coefficient, denCoeff.coefficient);

      let newNumerator: ASTNode;
      let newDenominator: ASTNode;

      if (reduced.num === 1) {
        newNumerator = numCoeff.remainingPart;
      } else {
        newNumerator = {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: reduced.num },
          right: numCoeff.remainingPart,
        };
      }

      if (reduced.den === 1) {
        newDenominator = denCoeff.remainingPart;
      } else {
        newDenominator = {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: reduced.den },
          right: denCoeff.remainingPart,
        };
      }

      return simplifyAST({
        type: 'Fraction',
        numerator: newNumerator,
        denominator: newDenominator,
      });
    }
  }

  // Handle simple coefficient cases: 2x/4 → x/2
  if (
    numerator.type === 'BinaryExpression' &&
    numerator.operator === '*' &&
    denominator.type === 'NumberLiteral'
  ) {
    const numCoeff = extractNumericCoefficient(numerator);
    if (numCoeff.coefficient !== null) {
      const reduced = reduceFraction(numCoeff.coefficient, denominator.value);

      let result: ASTNode;
      if (reduced.den === 1) {
        if (reduced.num === 1) {
          result = numCoeff.remainingPart;
        } else {
          result = {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: reduced.num },
            right: numCoeff.remainingPart,
          };
        }
      } else {
        let newNumerator: ASTNode;
        if (reduced.num === 1) {
          newNumerator = numCoeff.remainingPart;
        } else {
          newNumerator = {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: reduced.num },
            right: numCoeff.remainingPart,
          };
        }

        result = {
          type: 'Fraction',
          numerator: newNumerator,
          denominator: { type: 'NumberLiteral', value: reduced.den },
        };
      }

      return simplifyAST(result);
    }
  }

  // Handle cases: 2/4y → 1/2y
  if (
    numerator.type === 'NumberLiteral' &&
    denominator.type === 'BinaryExpression' &&
    denominator.operator === '*'
  ) {
    const denCoeff = extractNumericCoefficient(denominator);
    if (denCoeff.coefficient !== null) {
      const reduced = reduceFraction(numerator.value, denCoeff.coefficient);

      let result: ASTNode;
      if (reduced.num === 0) {
        result = { type: 'NumberLiteral', value: 0 };
      } else if (reduced.den === 1) {
        if (reduced.num === 1) {
          result = denCoeff.remainingPart;
        } else {
          result = {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: reduced.num },
            right: denCoeff.remainingPart,
          };
        }
      } else {
        let newDenominator: ASTNode;
        if (reduced.den === 1) {
          newDenominator = denCoeff.remainingPart;
        } else {
          newDenominator = {
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: reduced.den },
            right: denCoeff.remainingPart,
          };
        }

        result = {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: reduced.num },
          denominator: newDenominator,
        };
      }

      return simplifyAST(result);
    }
  }

  // Enhanced numeric fraction reduction using simplification.ts
  if (numerator.type === 'NumberLiteral' && denominator.type === 'NumberLiteral') {
    if (denominator.value === 0) {
      throw new Error('Division by zero');
    }

    const num = numerator.value;
    const den = denominator.value;

    // Use the enhanced fraction reduction from simplification.ts
    try {
      const reduced = reduceFraction(num, den);

      if (reduced.den === 1) {
        return { type: 'NumberLiteral', value: reduced.num };
      }

      return {
        type: 'Fraction',
        numerator: { type: 'NumberLiteral', value: reduced.num },
        denominator: { type: 'NumberLiteral', value: reduced.den },
      };
    } catch (error) {
      // Fallback to original behavior if simplification fails
      if (Number.isInteger(num) && Number.isInteger(den)) {
        const commonDivisor = gcd(Math.abs(num), Math.abs(den));

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
      }

      // 約分できない場合も分数形式で保持
      return { ...node, numerator, denominator };
    }
  }

  // 分子・分母が同じ表現の場合: x/x = 1
  if (areEquivalentNodes(numerator, denominator)) {
    return { type: 'NumberLiteral', value: 1 };
  }

  return { ...node, numerator, denominator };
}
