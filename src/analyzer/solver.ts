/**
 * Equation Solver
 * Implements solving for linear and quadratic equations
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult, StepTree } from '../types';
import { astToLatex } from '../utils/ast';
import { simplify as simplifyAST } from '../utils/unified-simplify';
import { getAnalysisVariable, extractFreeVariables } from '../utils/variables';

/**
 * Solve an equation AST
 */
export function solveEquation(equation: ASTNode, variable: string): ASTNode[] {
  // For now, we expect the equation to be in the form f(x) = 0
  // The equation should be rearranged so that everything is on one side

  // Determine the type of equation (linear, quadratic, etc.)
  const degree = getDegree(equation, variable);

  switch (degree) {
    case 0:
      // Constant equation: either no solution or infinitely many solutions
      return solveConstantEquation(equation);

    case 1:
      // Linear equation: ax + b = 0
      return solveLinearEquation(equation, variable);

    case 2:
      // Quadratic equation: ax² + bx + c = 0
      return solveQuadraticEquation(equation, variable);

    default:
      throw new Error(`Equations of degree ${degree} are not yet supported`);
  }
}

/**
 * Determine the degree of a polynomial equation with respect to a variable
 */
function getDegree(node: ASTNode, variable: string): number {
  switch (node.type) {
    case 'NumberLiteral':
      return 0;

    case 'Identifier':
      if (node.name === variable && node.scope === 'free') {
        return 1;
      }
      return 0;

    case 'BinaryExpression':
      switch (node.operator) {
        case '+':
        case '-':
          return Math.max(getDegree(node.left, variable), getDegree(node.right, variable));

        case '*':
          return getDegree(node.left, variable) + getDegree(node.right, variable);

        case '/':
          // Only handle cases where denominator doesn't contain the variable
          if (getDegree(node.right, variable) > 0) {
            throw new Error('Rational equations not yet supported');
          }
          return getDegree(node.left, variable);

        case '^':
          // Only handle integer powers for now
          if (
            node.left.type === 'Identifier' &&
            node.left.name === variable &&
            node.right.type === 'NumberLiteral' &&
            Number.isInteger(node.right.value)
          ) {
            return node.right.value;
          }
          // If base doesn't contain variable, degree is 0
          if (getDegree(node.left, variable) === 0) {
            return 0;
          }
          throw new Error('Complex power expressions not yet supported');

        default:
          throw new Error(`Operator ${node.operator} not supported in equation solving`);
      }

    case 'UnaryExpression':
      return getDegree(node.operand, variable);

    case 'FunctionCall':
      // Trigonometric and other functions would require numerical methods
      if (getDegree(node.args[0] || { type: 'NumberLiteral', value: 0 }, variable) > 0) {
        throw new Error('Transcendental equations not yet supported');
      }
      return 0;

    case 'Fraction':
      return getDegree(node.numerator, variable) - getDegree(node.denominator, variable);

    default:
      throw new Error(
        `Node type ${(node as { type: string }).type} not supported in equation solving`
      );
  }
}

/**
 * Solve constant equation (0 = c)
 */
function solveConstantEquation(equation: ASTNode): ASTNode[] {
  // Evaluate the constant
  const value = evaluateConstant(equation);

  if (Math.abs(value) < 1e-10) {
    // 0 = 0, infinitely many solutions (represented as empty array for now)
    throw new Error('Equation has infinitely many solutions');
  } else {
    // c = 0 where c ≠ 0, no solutions
    return [];
  }
}

/**
 * Solve linear equation: ax + b = 0
 */
function solveLinearEquation(equation: ASTNode, variable: string): ASTNode[] {
  const coefficients = extractLinearCoefficients(equation, variable);
  const a = coefficients.a;
  const b = coefficients.b;

  if (Math.abs(a) < 1e-10) {
    // Not actually linear, handle as constant
    return solveConstantEquation({
      type: 'NumberLiteral',
      value: b,
    });
  }

  // Solution: x = -b/a
  const solution: ASTNode = {
    type: 'Fraction',
    numerator: {
      type: 'UnaryExpression',
      operator: '-',
      operand: {
        type: 'NumberLiteral',
        value: b,
      },
    },
    denominator: {
      type: 'NumberLiteral',
      value: a,
    },
  };

  return [solution];
}

/**
 * Solve quadratic equation: ax² + bx + c = 0
 */
function solveQuadraticEquation(equation: ASTNode, variable: string): ASTNode[] {
  const coefficients = extractQuadraticCoefficients(equation, variable);
  const a = coefficients.a;
  const b = coefficients.b;
  const c = coefficients.c;

  if (Math.abs(a) < 1e-10) {
    // Not actually quadratic, solve as linear
    return solveLinearEquation(equation, variable);
  }

  // Calculate discriminant: b² - 4ac
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    // No real solutions
    return [];
  } else if (Math.abs(discriminant) < 1e-10) {
    // One solution: x = -b/(2a)
    const solution: ASTNode = {
      type: 'Fraction',
      numerator: {
        type: 'UnaryExpression',
        operator: '-',
        operand: {
          type: 'NumberLiteral',
          value: b,
        },
      },
      denominator: {
        type: 'NumberLiteral',
        value: 2 * a,
      },
    };
    return [solution];
  } else {
    // Two solutions: x = (-b ± √discriminant)/(2a)
    const sqrtDiscriminant: ASTNode = {
      type: 'FunctionCall',
      name: 'sqrt',
      args: [
        {
          type: 'NumberLiteral',
          value: discriminant,
        },
      ],
    };

    const solution1: ASTNode = {
      type: 'Fraction',
      numerator: {
        type: 'BinaryExpression',
        operator: '+',
        left: {
          type: 'UnaryExpression',
          operator: '-',
          operand: {
            type: 'NumberLiteral',
            value: b,
          },
        },
        right: sqrtDiscriminant,
      },
      denominator: {
        type: 'NumberLiteral',
        value: 2 * a,
      },
    };

    const solution2: ASTNode = {
      type: 'Fraction',
      numerator: {
        type: 'BinaryExpression',
        operator: '-',
        left: {
          type: 'UnaryExpression',
          operator: '-',
          operand: {
            type: 'NumberLiteral',
            value: b,
          },
        },
        right: sqrtDiscriminant,
      },
      denominator: {
        type: 'NumberLiteral',
        value: 2 * a,
      },
    };

    return [solution1, solution2];
  }
}

/**
 * Extract linear coefficients from ax + b
 */
interface LinearCoefficients {
  a: number; // coefficient of x
  b: number; // constant term
}

function extractLinearCoefficients(node: ASTNode, variable: string): LinearCoefficients {
  let a = 0;
  let b = 0;

  function extract(n: ASTNode, sign: number = 1): void {
    switch (n.type) {
      case 'NumberLiteral':
        b += sign * n.value;
        break;

      case 'Identifier':
        if (n.name === variable && n.scope === 'free') {
          a += sign;
        } else {
          // Treat as constant
          b += sign * evaluateConstant(n);
        }
        break;

      case 'BinaryExpression':
        switch (n.operator) {
          case '+':
            extract(n.left, sign);
            extract(n.right, sign);
            break;

          case '-':
            extract(n.left, sign);
            extract(n.right, -sign);
            break;

          case '*':
            // Handle coefficient * variable or fraction * variable
            if (isConstant(n.left, variable)) {
              const coeff = evaluateConstant(n.left);
              extract(n.right, sign * coeff);
            } else if (isConstant(n.right, variable)) {
              const coeff = evaluateConstant(n.right);
              extract(n.left, sign * coeff);
            } else if (
              n.left.type === 'Fraction' &&
              n.right.type === 'Identifier' &&
              n.right.name === variable
            ) {
              // Handle (a/b) * x
              const numerValue = evaluateConstant(n.left.numerator);
              const denomValue = evaluateConstant(n.left.denominator);
              const coeff = numerValue / denomValue;
              a += sign * coeff;
            } else if (
              n.right.type === 'Fraction' &&
              n.left.type === 'Identifier' &&
              n.left.name === variable
            ) {
              // Handle x * (a/b)
              const numerValue = evaluateConstant(n.right.numerator);
              const denomValue = evaluateConstant(n.right.denominator);
              const coeff = numerValue / denomValue;
              a += sign * coeff;
            } else {
              throw new Error('Complex multiplication not supported in linear extraction');
            }
            break;

          default:
            throw new Error(`Operator ${n.operator} not supported in linear extraction`);
        }
        break;

      case 'UnaryExpression':
        if (n.operator === '-') {
          extract(n.operand, -sign);
        } else {
          extract(n.operand, sign);
        }
        break;

      case 'Fraction': {
        // Handle fractions like (1/2)*x + 3/4
        const numerValue = evaluateConstant(n.numerator);
        const denomValue = evaluateConstant(n.denominator);
        const fracValue = numerValue / denomValue;
        b += sign * fracValue;
        break;
      }

      default:
        throw new Error(
          `Node type ${(n as { type: string }).type} not supported in linear extraction`
        );
    }
  }

  extract(node);
  return { a, b };
}

/**
 * Extract quadratic coefficients from ax² + bx + c
 */
interface QuadraticCoefficients {
  a: number; // coefficient of x²
  b: number; // coefficient of x
  c: number; // constant term
}

function extractQuadraticCoefficients(node: ASTNode, variable: string): QuadraticCoefficients {
  let a = 0;
  let b = 0;
  let c = 0;

  function extract(n: ASTNode, sign: number = 1): void {
    switch (n.type) {
      case 'NumberLiteral':
        c += sign * n.value;
        break;

      case 'Identifier':
        if (n.name === variable && n.scope === 'free') {
          b += sign;
        } else {
          c += sign * evaluateConstant(n);
        }
        break;

      case 'BinaryExpression':
        switch (n.operator) {
          case '+':
            extract(n.left, sign);
            extract(n.right, sign);
            break;

          case '-':
            extract(n.left, sign);
            extract(n.right, -sign);
            break;

          case '*':
            // Handle various multiplication cases
            extractMultiplication(n, sign);
            break;

          case '^':
            // Handle x^2 term
            if (
              n.left.type === 'Identifier' &&
              n.left.name === variable &&
              n.right.type === 'NumberLiteral' &&
              n.right.value === 2
            ) {
              a += sign;
            } else {
              throw new Error('Complex power not supported in quadratic extraction');
            }
            break;

          default:
            throw new Error(`Operator ${n.operator} not supported in quadratic extraction`);
        }
        break;

      case 'UnaryExpression':
        if (n.operator === '-') {
          extract(n.operand, -sign);
        } else {
          extract(n.operand, sign);
        }
        break;

      case 'Fraction': {
        // Handle fractions like (1/2)*x² + (3/4)*x + 1/8
        const numerValue = evaluateConstant(n.numerator);
        const denomValue = evaluateConstant(n.denominator);
        const fracValue = numerValue / denomValue;
        c += sign * fracValue;
        break;
      }

      default:
        throw new Error(
          `Node type ${(n as { type: string }).type} not supported in quadratic extraction`
        );
    }
  }

  function extractMultiplication(n: { left: ASTNode; right: ASTNode }, sign: number): void {
    const left = n.left;
    const right = n.right;

    // Case 1: coefficient * x²
    if (
      isConstant(left, variable) &&
      right.type === 'BinaryExpression' &&
      right.operator === '^' &&
      right.left.type === 'Identifier' &&
      right.left.name === variable &&
      right.right.type === 'NumberLiteral' &&
      right.right.value === 2
    ) {
      a += sign * evaluateConstant(left);
      return;
    }

    // Case 2: x² * coefficient
    if (
      isConstant(right, variable) &&
      left.type === 'BinaryExpression' &&
      left.operator === '^' &&
      left.left.type === 'Identifier' &&
      left.left.name === variable &&
      left.right.type === 'NumberLiteral' &&
      left.right.value === 2
    ) {
      a += sign * evaluateConstant(right);
      return;
    }

    // Case 3: coefficient * x
    if (isConstant(left, variable) && right.type === 'Identifier' && right.name === variable) {
      b += sign * evaluateConstant(left);
      return;
    }

    // Case 4: x * coefficient
    if (isConstant(right, variable) && left.type === 'Identifier' && left.name === variable) {
      b += sign * evaluateConstant(right);
      return;
    }

    // Case 5: coefficient * coefficient
    if (isConstant(left, variable) && isConstant(right, variable)) {
      c += sign * evaluateConstant(left) * evaluateConstant(right);
      return;
    }

    // Case 6: x * x = x²
    if (
      left.type === 'Identifier' &&
      left.name === variable &&
      right.type === 'Identifier' &&
      right.name === variable
    ) {
      a += sign;
      return;
    }

    throw new Error('Complex multiplication not supported in quadratic extraction');
  }

  extract(node);
  return { a, b, c };
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
 * Evaluate a constant expression
 */
function evaluateConstant(node: ASTNode): number {
  switch (node.type) {
    case 'NumberLiteral':
      return node.value;

    case 'Identifier':
      // Handle mathematical constants
      if (node.name === 'e') return Math.E;
      if (node.name === 'π' || node.name === 'pi') return Math.PI;
      throw new Error(`Unknown constant: ${node.name}`);

    case 'BinaryExpression': {
      const left = evaluateConstant(node.left);
      const right = evaluateConstant(node.right);
      switch (node.operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '^':
          return Math.pow(left, right);
        default:
          throw new Error(`Unsupported operator: ${node.operator}`);
      }
    }

    case 'UnaryExpression': {
      const operand = evaluateConstant(node.operand);
      switch (node.operator) {
        case '+':
          return operand;
        case '-':
          return -operand;
        default:
          throw new Error(`Unsupported unary operator: ${(node as { operator: string }).operator}`);
      }
    }

    case 'FunctionCall': {
      const arg = evaluateConstant(node.args[0] || { type: 'NumberLiteral', value: 0 });
      switch (node.name) {
        case 'sin':
          return Math.sin(arg);
        case 'cos':
          return Math.cos(arg);
        case 'tan':
          return Math.tan(arg);
        case 'exp':
          return Math.exp(arg);
        case 'ln':
          return Math.log(arg);
        case 'log':
          return Math.log10(arg);
        case 'sqrt':
          return Math.sqrt(arg);
        case 'abs':
          return Math.abs(arg);
        default:
          throw new Error(`Unsupported function: ${node.name}`);
      }
    }

    case 'Fraction': {
      const numerator = evaluateConstant(node.numerator);
      const denominator = evaluateConstant(node.denominator);
      if (denominator === 0) {
        throw new Error('Division by zero in fraction evaluation');
      }
      return numerator / denominator;
    }

    default:
      throw new Error(`Cannot evaluate node type: ${(node as { type: string }).type}`);
  }
}

/**
 * Analyze AST with equation solving task
 */
export function analyzeSolve(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'solve' }
): AnalyzeResult {
  const steps: StepTree[] = [];

  try {
    // Automatic variable inference for solving
    const variable = options.solveFor || getAnalysisVariable(ast, options.variable);
    const freeVars = extractFreeVariables(ast);

    // Add informative steps about variable selection
    if (!options.solveFor && !options.variable && freeVars.size > 1) {
      steps.push(
        `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Solving for '${variable}'.`
      );
    } else if (!options.solveFor && !options.variable && freeVars.size === 1) {
      steps.push(`Auto-detected variable: ${variable}`);
    }

    steps.push(`Solving equation for ${variable}`);
    steps.push(`Equation: ${astToLatex(ast)} = 0`);

    // Determine equation type
    const degree = getDegree(ast, variable);
    steps.push(
      `Detected ${degree === 0 ? 'constant' : degree === 1 ? 'linear' : degree === 2 ? 'quadratic' : `degree ${degree}`} equation`
    );

    // Solve the equation
    const solutions = solveEquation(ast, variable);

    if (solutions.length === 0) {
      steps.push('No real solutions found');
      return {
        steps,
        value: 'No solutions',
        valueType: 'symbolic',
        ast: null,
        error: null,
      };
    }

    // Apply simplification to solutions
    const simplifiedSolutions = solutions.map(sol => simplifyAST(sol));
    const solutionStrings = simplifiedSolutions.map(sol => astToLatex(sol));
    steps.push(`Solutions: ${variable} = ${solutionStrings.join(', ')}`);

    return {
      steps,
      value: solutionStrings.join(', '),
      valueType: 'symbolic',
      ast: simplifiedSolutions.length === 1 ? simplifiedSolutions[0] || null : null,
      error: null,
    };
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Equation solving error',
    };
  }
}
