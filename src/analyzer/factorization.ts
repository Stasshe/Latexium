/**
 * Factorization Analyzer
 * Handles factorization and distribution tasks using the new advanced system
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult } from '../types';
import { astToLatex } from '../utils/ast';
import { expandExpression } from '../utils/distribution';
import { simplify } from '../utils/unified-simplify';

/**
 * Analyze factorization task
 */
export function analyzeFactorization(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'factor' }
): AnalyzeResult {
  const steps: string[] = [];

  try {
    // Get variable to factor by (default to 'x')
    const variable = options.variable || 'x';

    steps.push(`Original expression: ${astToLatex(ast)}`);

    // First, expand the expression to ensure all terms are visible
    const expanded = expandExpression(ast);
    const expandedLatex = astToLatex(expanded);

    if (expandedLatex !== astToLatex(ast)) {
      steps.push(`After expansion: ${expandedLatex}`);
    }

    // Use unified-simplify with factorization enabled
    const simplified = simplify(expanded, { factor: true, expand: false }, steps);
    const simplifiedLatex = astToLatex(simplified);

    steps.push(`Final factored form: ${simplifiedLatex}`);
    return {
      steps,
      value: simplifiedLatex,
      valueType: 'symbolic',
      ast: simplified,
      error: null,
    };
  } catch (error) {
    steps.push(
      `Error during factorization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Factorization failed',
    };
  }
}

/**
 * Analyze distribution/expansion task
 */
export function analyzeDistribution(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'distribute' }
): AnalyzeResult {
  const steps: string[] = [];

  try {
    steps.push(`Original expression: ${astToLatex(ast)}`);

    // First apply distribution for multiplication
    const expanded = expandExpression(ast);
    const expandedLatex = astToLatex(expanded);

    // Always apply simplification to handle addition, like terms, etc.
    const simplified = simplify(expanded, { combineLikeTerms: true }, steps);
    const simplifiedLatex = astToLatex(simplified);

    // Track changes step by step
    if (expandedLatex !== astToLatex(ast)) {
      steps.push(`After distribution/expansion: ${expandedLatex}`);
    }

    if (simplifiedLatex !== expandedLatex) {
      steps.push(`After combining like terms: ${simplifiedLatex}`);
    }

    // If no changes occurred at all, note that
    if (simplifiedLatex === astToLatex(ast)) {
      steps.push('Expression is already in simplified form');
    }

    return {
      steps,
      value: simplifiedLatex,
      valueType: 'symbolic',
      ast: simplified,
      error: null,
    };
  } catch (error) {
    steps.push(
      `Error during distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Distribution failed',
    };
  }
}

/**
 * Analyze polynomial structure
 */
export function analyzePolynomial(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'analyze-polynomial' }
): AnalyzeResult {
  const steps: string[] = [];

  try {
    const variable = options.variable || 'x';
    const originalLatex = astToLatex(ast);

    steps.push(`Analyzing polynomial: ${originalLatex}`);
    steps.push(`Variable: ${variable}`);

    // Expand first to get standard form
    const expanded = expandExpression(ast);
    const expandedLatex = astToLatex(expanded);

    if (expandedLatex !== originalLatex) {
      steps.push(`Expanded form: ${expandedLatex}`);
    }

    // Analyze degree and coefficients (simplified approach)
    const degreeInfo = analyzePolynomialDegree(expanded, variable);

    if (degreeInfo) {
      steps.push(`Degree: ${degreeInfo.degree}`);
      steps.push(`Leading coefficient: ${degreeInfo.leadingCoeff}`);

      if (degreeInfo.degree === 0) {
        steps.push('This is a constant (degree 0)');
      } else if (degreeInfo.degree === 1) {
        steps.push('This is a linear polynomial');
      } else if (degreeInfo.degree === 2) {
        steps.push('This is a quadratic polynomial');
      } else if (degreeInfo.degree === 3) {
        steps.push('This is a cubic polynomial');
      } else {
        steps.push(`This is a polynomial of degree ${degreeInfo.degree}`);
      }
    } else {
      steps.push('Could not determine polynomial structure');
    }

    return {
      steps,
      value: expandedLatex,
      valueType: 'symbolic',
      ast: expanded,
      error: null,
    };
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Polynomial analysis failed',
    };
  }
}

/**
 * Simplified polynomial degree analysis
 */
function analyzePolynomialDegree(
  ast: ASTNode,
  variable: string
): { degree: number; leadingCoeff: number } | null {
  // This is a simplified implementation
  // A more sophisticated version would use the polynomial utilities

  let maxDegree = 0;
  const leadingCoeff = 1;

  function findDegree(node: ASTNode): number {
    switch (node.type) {
      case 'NumberLiteral':
        return 0;

      case 'Identifier':
        return node.name === variable ? 1 : 0;

      case 'BinaryExpression':
        switch (node.operator) {
          case '+':
          case '-':
            return Math.max(findDegree(node.left), findDegree(node.right));

          case '*':
            return findDegree(node.left) + findDegree(node.right);

          case '^':
            if (
              node.left.type === 'Identifier' &&
              node.left.name === variable &&
              node.right.type === 'NumberLiteral'
            ) {
              return node.right.value;
            }
            return findDegree(node.left);

          default:
            return 0;
        }

      default:
        return 0;
    }
  }

  maxDegree = findDegree(ast);

  return { degree: maxDegree, leadingCoeff };
}

/**
 * Generate step-by-step factorization explanation
 */
function getFactorizationSteps(original: ASTNode, factored: ASTNode, variable: string): string[] {
  const steps: string[] = [];

  // Analyze what type of factorization was performed
  const originalLatex = astToLatex(original);
  const factoredLatex = astToLatex(factored);

  // Simple heuristics to determine factorization type
  if (factoredLatex.includes('(') && factoredLatex.includes(')')) {
    if (factoredLatex.includes('^{2}')) {
      steps.push('Identified perfect square trinomial pattern');
      steps.push('Applied formula: a² ± 2ab + b² = (a ± b)²');
    } else if (factoredLatex.includes(' + ') && factoredLatex.includes(' - ')) {
      steps.push('Identified difference of squares pattern');
      steps.push('Applied formula: a² - b² = (a + b)(a - b)');
    } else if (factoredLatex.match(/\([^)]*\)\([^)]*\)/)) {
      steps.push('Factored using quadratic factorization');
      steps.push('Found linear factors using roots or factorization techniques');
    }
  } else if (factoredLatex.includes('(')) {
    steps.push('Factored out common factors');
    steps.push('Applied distributive property: ab + ac = a(b + c)');
  }

  return steps;
}
