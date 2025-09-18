/**
 * Factorization Utilities
 * Comprehensive factorization algorithms for polynomial expressions
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '../types';
import { gcd } from './unified-simplify';

/**
 * Deep clone an AST node
 */
function deepCloneAST(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      return { ...node };
    case 'Identifier':
      return { ...node };
    case 'BinaryExpression':
      return {
        ...node,
        left: deepCloneAST(node.left),
        right: deepCloneAST(node.right),
      };
    case 'UnaryExpression':
      return {
        ...node,
        operand: deepCloneAST(node.operand),
      };
    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => deepCloneAST(arg)),
      };
    case 'Fraction':
      return {
        ...node,
        numerator: deepCloneAST(node.numerator),
        denominator: deepCloneAST(node.denominator),
      };
    default:
      return node;
  }
}

/**
 * Main factorization function that attempts all available methods
 */
export function factorExpression(node: ASTNode, variable?: string): ASTNode {
  // Try different factorization methods in order of complexity
  const methods = [
    factorCommonFactors,
    (n: ASTNode): ASTNode | null => factorDifferenceOfSquares(n),
    (n: ASTNode): ASTNode | null => factorPerfectSquareTrinomial(n, variable),
    (n: ASTNode): ASTNode | null => factorQuadratic(n, variable),
    (n: ASTNode): ASTNode | null => factorByGrouping(n, variable),
    (n: ASTNode): ASTNode | null => factorCubicPolynomial(n, variable),
    (n: ASTNode): ASTNode | null => factorHighDegreePolynomial(n, variable),
  ];

  let result = deepCloneAST(node);
  let changed = true;

  // Apply factorization methods until no more changes occur
  while (changed) {
    changed = false;
    for (const method of methods) {
      const factored = method(result);
      if (factored && !areEquivalentExpressions(factored, result)) {
        result = factored;
        changed = true;
        break;
      }
    }
  }

  return result;
}

/**
 * Factor out common factors from polynomial terms
 * Example: 6x^2 + 9x → 3x(2x + 3)
 */
export function factorCommonFactors(node: ASTNode): ASTNode {
  if (node.type !== 'BinaryExpression' || (node.operator !== '+' && node.operator !== '-')) {
    return node;
  }

  const terms = extractAllTerms(node);
  if (terms.length < 2) {
    return node;
  }

  // Find common numeric coefficient
  const coefficients = terms
    .map(t => extractCoefficient(t.term))
    .filter(c => c !== null) as number[];

  if (coefficients.length === 0) {
    return node;
  }

  const commonNumericFactor = coefficients.reduce((a, b) => gcd(Math.abs(a), Math.abs(b)));

  // Find common variable factors
  const commonVariableFactor = findCommonVariableFactor(terms.map(t => t.term));

  // If no common factors found, return original
  if (commonNumericFactor <= 1 && !commonVariableFactor) {
    return node;
  }

  // Factor out common factors
  const factoredTerms = terms.map(({ term, sign }) => {
    let newTerm = term;

    // Remove common numeric factor
    if (commonNumericFactor > 1) {
      newTerm = divideByConstant(newTerm, commonNumericFactor);
    }

    // Remove common variable factor
    if (commonVariableFactor) {
      newTerm = divideByVariableFactor(newTerm, commonVariableFactor);
    }

    return { term: newTerm, sign };
  });

  // Build factored expression
  const factoredSum = buildExpressionFromTerms(factoredTerms);

  let commonFactor: ASTNode = { type: 'NumberLiteral', value: 1 };

  // Add numeric factor
  if (commonNumericFactor > 1) {
    commonFactor = { type: 'NumberLiteral', value: commonNumericFactor };
  }

  // Add variable factor
  if (commonVariableFactor) {
    if (commonFactor.type === 'NumberLiteral' && commonFactor.value === 1) {
      commonFactor = commonVariableFactor;
    } else {
      commonFactor = {
        type: 'BinaryExpression',
        operator: '*',
        left: commonFactor,
        right: commonVariableFactor,
      };
    }
  }

  // Return factored form
  if (commonFactor.type === 'NumberLiteral' && commonFactor.value === 1) {
    return factoredSum;
  }

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: commonFactor,
    right: factoredSum,
  };
}

/**
 * Factor difference of squares: a² - b² → (a + b)(a - b)
 */
export function factorDifferenceOfSquares(node: ASTNode): ASTNode | null {
  if (node.type !== 'BinaryExpression' || node.operator !== '-') {
    return null;
  }

  const leftSquare = isSquareExpression(node.left);
  const rightSquare = isSquareExpression(node.right);

  if (!leftSquare || !rightSquare) {
    return null;
  }

  return {
    type: 'BinaryExpression',
    operator: '*',
    left: {
      type: 'BinaryExpression',
      operator: '+',
      left: leftSquare,
      right: rightSquare,
    },
    right: {
      type: 'BinaryExpression',
      operator: '-',
      left: leftSquare,
      right: rightSquare,
    },
  };
}

/**
 * Factor perfect square trinomials: a² + 2ab + b² → (a + b)²
 */
export function factorPerfectSquareTrinomial(
  node: ASTNode,
  variable: string = 'x'
): ASTNode | null {
  const quadForm = analyzeQuadraticForm(node, variable);
  if (!quadForm) {
    return null;
  }

  const { a, b, c } = quadForm;

  // Check if it's a perfect square: b² = 4ac
  const discriminant = b * b - 4 * a * c;
  if (Math.abs(discriminant) > 1e-10) {
    return null; // Not a perfect square
  }

  const linearTerm = -b / (2 * a);

  // Build (√a * x + √c)²
  const sqrtA = Math.sqrt(Math.abs(a));
  const sqrtC = Math.sqrt(Math.abs(c));

  if (!Number.isInteger(sqrtA) || !Number.isInteger(sqrtC)) {
    return null; // Not perfect integer squares
  }

  let factor: ASTNode;
  if (sqrtA === 1) {
    factor = {
      type: 'BinaryExpression',
      operator: linearTerm >= 0 ? '+' : '-',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: Math.abs(linearTerm) },
    };
  } else {
    const linearPart: ASTNode = {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: sqrtA },
      right: { type: 'Identifier', name: variable },
    };

    factor = {
      type: 'BinaryExpression',
      operator: linearTerm >= 0 ? '+' : '-',
      left: linearPart,
      right: { type: 'NumberLiteral', value: Math.abs(linearTerm) },
    };
  }

  return {
    type: 'BinaryExpression',
    operator: '^',
    left: factor,
    right: { type: 'NumberLiteral', value: 2 },
  };
}

/**
 * Factor general quadratic expressions: ax² + bx + c → (px + q)(rx + s)
 */
export function factorQuadratic(node: ASTNode, variable: string = 'x'): ASTNode | null {
  const quadForm = analyzeQuadraticForm(node, variable);
  if (!quadForm) {
    return null;
  }

  const { a, b, c } = quadForm;

  // Calculate discriminant
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null; // No real factorization
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);

  // Check for rational roots using the rational root theorem
  const possibleNumerators = getFactors(Math.abs(c));
  const possibleDenominators = getFactors(Math.abs(a));

  for (const p of possibleNumerators) {
    for (const q of possibleDenominators) {
      for (const signP of [1, -1]) {
        const root = (signP * p) / q;
        if (Math.abs(evaluateQuadratic(a, b, c, root)) < 1e-10) {
          // Found a rational root, find the other root
          const otherRoot = (-b - (signP * p * Math.sqrt(discriminant)) / q) / (2 * a);
          return buildQuadraticFactorization(a, root, otherRoot, variable);
        }
      }
    }
  }

  // Try integer factorization for perfect discriminants
  if (Number.isInteger(sqrtDiscriminant)) {
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);
    return buildQuadraticFactorization(a, root1, root2, variable);
  }

  return null;
}

/**
 * Factor by grouping: ax + ay + bx + by → a(x + y) + b(x + y) → (a + b)(x + y)
 */
export function factorByGrouping(node: ASTNode, variable?: string): ASTNode | null {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') {
    return null;
  }

  const terms = extractAllTerms(node);
  if (terms.length !== 4) {
    return null; // Grouping typically works with 4 terms
  }

  // Try different grouping patterns
  const groupings: [number, number, number, number][] = [
    [0, 1, 2, 3], // (term1 + term2) + (term3 + term4)
    [0, 2, 1, 3], // (term1 + term3) + (term2 + term4)
    [0, 3, 1, 2], // (term1 + term4) + (term2 + term3)
  ];

  for (const [i1, i2, i3, i4] of groupings) {
    const term1 = terms[i1];
    const term2 = terms[i2];
    const term3 = terms[i3];
    const term4 = terms[i4];

    if (!term1 || !term2 || !term3 || !term4) continue;

    const group1Terms = [term1, term2];
    const group2Terms = [term3, term4];

    const group1 = buildExpressionFromTerms(group1Terms);
    const group2 = buildExpressionFromTerms(group2Terms);

    const factor1 = factorCommonFactors(group1);
    const factor2 = factorCommonFactors(group2);

    // Check if both groups have the same factored form
    if (
      factor1.type === 'BinaryExpression' &&
      factor1.operator === '*' &&
      factor2.type === 'BinaryExpression' &&
      factor2.operator === '*' &&
      areEquivalentExpressions(factor1.right, factor2.right)
    ) {
      // Found common factor
      const commonFactor = factor1.right;
      const coefficientSum: ASTNode = {
        type: 'BinaryExpression',
        operator: '+',
        left: factor1.left,
        right: factor2.left,
      };

      return {
        type: 'BinaryExpression',
        operator: '*',
        left: coefficientSum,
        right: commonFactor,
      };
    }
  }

  return null;
}

/**
 * Factor cubic polynomials using various methods
 */
export function factorCubicPolynomial(node: ASTNode, variable: string = 'x'): ASTNode | null {
  const cubicForm = analyzeCubicForm(node, variable);
  if (!cubicForm) {
    return null;
  }

  const { a, b, c, d } = cubicForm;

  // Try rational root theorem
  const possibleRoots = getRationalRoots(d, a);

  for (const root of possibleRoots) {
    if (Math.abs(evaluateCubic(a, b, c, d, root)) < 1e-10) {
      // Found a root, perform polynomial division
      const quotient = divideCubicByLinear(a, b, c, d, root);
      if (quotient) {
        const linearFactor = buildLinearFactor(variable, root);
        const quadraticFactor = buildQuadraticFromCoefficients(quotient, variable);

        // Try to factor the quadratic part further
        const factoredQuadratic = factorQuadratic(quadraticFactor, variable);

        return {
          type: 'BinaryExpression',
          operator: '*',
          left: linearFactor,
          right: factoredQuadratic || quadraticFactor,
        };
      }
    }
  }

  return null;
}

/**
 * Factor high-degree polynomials (degree 4 and above)
 */
export function factorHighDegreePolynomial(node: ASTNode, variable: string = 'x'): ASTNode | null {
  // This is a placeholder for more advanced factorization algorithms
  // Could implement methods like:
  // - Factorization by substitution
  // - Ferrari's method for quartics
  // - Numerical methods for higher degrees

  // For now, try rational root theorem for any polynomial
  const polynomial = analyzePolynomialForm(node, variable);
  if (!polynomial || polynomial.degree < 4) {
    return null;
  }

  const coefficients = polynomial.coefficients;
  const constantTerm = coefficients[0] || 0;
  const leadingCoeff = coefficients[polynomial.degree] || 1;

  const possibleRoots = getRationalRoots(constantTerm, leadingCoeff);

  for (const root of possibleRoots) {
    if (Math.abs(evaluatePolynomial(coefficients, root)) < 1e-10) {
      // Found a root, factor it out
      const quotient = dividePolynomialByLinear(coefficients, root);
      if (quotient) {
        const linearFactor = buildLinearFactor(variable, root);
        const quotientPoly = buildPolynomialFromCoefficients(quotient, variable);

        // Recursively factor the quotient
        const factoredQuotient = factorExpression(quotientPoly, variable);

        return {
          type: 'BinaryExpression',
          operator: '*',
          left: linearFactor,
          right: factoredQuotient,
        };
      }
    }
  }

  return null;
}

// ===== Helper Functions =====

/**
 * Convert AST to polynomial representation for analysis
 */
function convertToPolynomial(node: ASTNode, variable: string): Map<number, number> | null {
  const coefficients = new Map<number, number>();

  function analyzeNode(n: ASTNode, sign: number = 1): boolean {
    switch (n.type) {
      case 'NumberLiteral':
        addCoefficient(coefficients, 0, sign * n.value);
        return true;

      case 'Identifier':
        if (n.name === variable) {
          addCoefficient(coefficients, 1, sign);
          return true;
        } else {
          // Treat other variables as constants (simplified approach)
          addCoefficient(coefficients, 0, sign);
          return true;
        }

      case 'BinaryExpression':
        switch (n.operator) {
          case '+':
            return analyzeNode(n.left, sign) && analyzeNode(n.right, sign);

          case '-':
            return analyzeNode(n.left, sign) && analyzeNode(n.right, -sign);

          case '*':
            return analyzeMultiplication(n, sign, coefficients, variable);

          case '^':
            return analyzePower(n, sign, coefficients, variable);

          default:
            return false;
        }

      default:
        return false;
    }
  }

  if (analyzeNode(node)) {
    return coefficients;
  }

  return null;
}

/**
 * Add coefficient to polynomial map
 */
function addCoefficient(coefficients: Map<number, number>, power: number, coeff: number): void {
  const existing = coefficients.get(power) || 0;
  const newCoeff = existing + coeff;

  if (Math.abs(newCoeff) < 1e-12) {
    coefficients.delete(power);
  } else {
    coefficients.set(power, newCoeff);
  }
}

/**
 * Analyze multiplication for polynomial conversion
 */
function analyzeMultiplication(
  node: BinaryExpression,
  sign: number,
  coefficients: Map<number, number>,
  variable: string
): boolean {
  // Try to extract coefficient * variable^power patterns
  const leftCoeff = extractNumericValue(node.left);
  const rightCoeff = extractNumericValue(node.right);

  if (leftCoeff !== null) {
    // Left is numeric, analyze right
    const rightPoly = convertToPolynomial(node.right, variable);
    if (rightPoly) {
      for (const [power, coeff] of rightPoly) {
        addCoefficient(coefficients, power, sign * leftCoeff * coeff);
      }
      return true;
    }
  }

  if (rightCoeff !== null) {
    // Right is numeric, analyze left
    const leftPoly = convertToPolynomial(node.left, variable);
    if (leftPoly) {
      for (const [power, coeff] of leftPoly) {
        addCoefficient(coefficients, power, sign * rightCoeff * coeff);
      }
      return true;
    }
  }

  // Handle variable * variable cases
  if (
    node.left.type === 'Identifier' &&
    node.left.name === variable &&
    node.right.type === 'Identifier' &&
    node.right.name === variable
  ) {
    addCoefficient(coefficients, 2, sign);
    return true;
  }

  return false;
}

/**
 * Analyze power expressions for polynomial conversion
 */
function analyzePower(
  node: BinaryExpression,
  sign: number,
  coefficients: Map<number, number>,
  variable: string
): boolean {
  if (
    node.left.type === 'Identifier' &&
    node.left.name === variable &&
    node.right.type === 'NumberLiteral' &&
    Number.isInteger(node.right.value) &&
    node.right.value >= 0
  ) {
    addCoefficient(coefficients, node.right.value, sign);
    return true;
  }

  return false;
}

/**
 * Extract numeric value from simple expressions
 */
function extractNumericValue(node: ASTNode): number | null {
  if (node.type === 'NumberLiteral') {
    return node.value;
  }

  if (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    node.operand.type === 'NumberLiteral'
  ) {
    return -node.operand.value;
  }

  return null;
}

/**
 * Get polynomial degree
 */
function getPolynomialDegree(poly: Map<number, number>): number {
  let maxDegree = 0;
  for (const power of poly.keys()) {
    maxDegree = Math.max(maxDegree, power);
  }
  return maxDegree;
}

/**
 * Get coefficient for specific power
 */
function getCoefficient(poly: Map<number, number>, power: number): number {
  return poly.get(power) || 0;
}

/**
 * Extract all terms from an addition/subtraction expression with signs
 */
function extractAllTerms(node: ASTNode): { term: ASTNode; sign: number }[] {
  if (node.type !== 'BinaryExpression') {
    return [{ term: node, sign: 1 }];
  }

  const expr = node as BinaryExpression;

  if (expr.operator === '+') {
    return [...extractAllTerms(expr.left), ...extractAllTerms(expr.right)];
  }

  if (expr.operator === '-') {
    const leftTerms = extractAllTerms(expr.left);
    const rightTerms = extractAllTerms(expr.right).map(t => ({
      term: t.term,
      sign: -t.sign,
    }));
    return [...leftTerms, ...rightTerms];
  }

  return [{ term: node, sign: 1 }];
}

/**
 * Build expression from terms with signs
 */
function buildExpressionFromTerms(terms: { term: ASTNode; sign: number }[]): ASTNode {
  if (terms.length === 0) {
    return { type: 'NumberLiteral', value: 0 };
  }

  if (terms.length === 1) {
    const { term, sign } = terms[0]!;
    if (sign === 1) {
      return term;
    }
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: -1 },
      right: term,
    };
  }

  let result =
    terms[0]!.sign === 1
      ? terms[0]!.term
      : {
          type: 'BinaryExpression' as const,
          operator: '*' as const,
          left: { type: 'NumberLiteral' as const, value: -1 },
          right: terms[0]!.term,
        };

  for (let i = 1; i < terms.length; i++) {
    const { term, sign } = terms[i]!;
    if (sign === 1) {
      result = {
        type: 'BinaryExpression',
        operator: '+',
        left: result,
        right: term,
      };
    } else {
      result = {
        type: 'BinaryExpression',
        operator: '-',
        left: result,
        right: term,
      };
    }
  }

  return result;
}

/**
 * Extract numeric coefficient from a term
 */
function extractCoefficient(node: ASTNode): number | null {
  if (node.type === 'NumberLiteral') {
    return node.value;
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (node.left.type === 'NumberLiteral') {
      return node.left.value;
    }
    if (node.right.type === 'NumberLiteral') {
      return node.right.value;
    }
  }

  if (node.type === 'Identifier') {
    return 1;
  }

  return null;
}

/**
 * Check if expression is a square (x^2 or x*x)
 */
function isSquareExpression(node: ASTNode): ASTNode | null {
  if (node.type === 'BinaryExpression' && node.operator === '^') {
    if (node.right.type === 'NumberLiteral' && node.right.value === 2) {
      return node.left;
    }
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (areEquivalentExpressions(node.left, node.right)) {
      return node.left;
    }
  }

  return null;
}

/**
 * Find common variable factors among terms
 */
function findCommonVariableFactor(terms: ASTNode[]): ASTNode | null {
  // This is a simplified implementation
  // Would need more sophisticated analysis for complex variable factors
  return null;
}

/**
 * Divide term by constant
 */
function divideByConstant(node: ASTNode, divisor: number): ASTNode {
  if (node.type === 'NumberLiteral') {
    return { type: 'NumberLiteral', value: node.value / divisor };
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    if (node.left.type === 'NumberLiteral') {
      return {
        ...node,
        left: { type: 'NumberLiteral', value: node.left.value / divisor },
      };
    }
    if (node.right.type === 'NumberLiteral') {
      return {
        ...node,
        right: { type: 'NumberLiteral', value: node.right.value / divisor },
      };
    }
  }

  // If no coefficient found, create division
  return {
    type: 'BinaryExpression',
    operator: '/',
    left: node,
    right: { type: 'NumberLiteral', value: divisor },
  };
}

/**
 * Divide term by variable factor
 */
function divideByVariableFactor(node: ASTNode, factor: ASTNode): ASTNode {
  // Simplified implementation
  return node;
}

/**
 * Analyze quadratic form ax² + bx + c
 */
function analyzeQuadraticForm(
  node: ASTNode,
  variable: string
): { a: number; b: number; c: number } | null {
  const poly = convertToPolynomial(node, variable);
  if (!poly) return null;

  const degree = getPolynomialDegree(poly);
  if (degree !== 2) return null;

  const a = getCoefficient(poly, 2);
  const b = getCoefficient(poly, 1);
  const c = getCoefficient(poly, 0);

  if (Math.abs(a) < 1e-12) return null; // Not a quadratic

  return { a, b, c };
}

/**
 * Analyze cubic form ax³ + bx² + cx + d
 */
function analyzeCubicForm(
  node: ASTNode,
  variable: string
): { a: number; b: number; c: number; d: number } | null {
  const poly = convertToPolynomial(node, variable);
  if (!poly) return null;

  const degree = getPolynomialDegree(poly);
  if (degree !== 3) return null;

  const a = getCoefficient(poly, 3);
  const b = getCoefficient(poly, 2);
  const c = getCoefficient(poly, 1);
  const d = getCoefficient(poly, 0);

  if (Math.abs(a) < 1e-12) return null; // Not a cubic

  return { a, b, c, d };
}

/**
 * Analyze general polynomial form
 */
function analyzePolynomialForm(
  node: ASTNode,
  variable: string
): { degree: number; coefficients: number[] } | null {
  const poly = convertToPolynomial(node, variable);
  if (!poly) return null;

  const degree = getPolynomialDegree(poly);
  const coefficients: number[] = [];

  for (let i = 0; i <= degree; i++) {
    coefficients[i] = getCoefficient(poly, i);
  }

  return { degree, coefficients };
}

/**
 * Get factors of a number
 */
function getFactors(n: number): number[] {
  const factors: number[] = [];
  const absN = Math.abs(n);

  for (let i = 1; i <= Math.sqrt(absN); i++) {
    if (absN % i === 0) {
      factors.push(i);
      if (i !== absN / i) {
        factors.push(absN / i);
      }
    }
  }

  return factors.sort((a, b) => a - b);
}

/**
 * Get possible rational roots using rational root theorem
 */
function getRationalRoots(constantTerm: number, leadingCoeff: number): number[] {
  const pFactors = getFactors(constantTerm);
  const qFactors = getFactors(leadingCoeff);

  const roots: number[] = [];

  for (const p of pFactors) {
    for (const q of qFactors) {
      roots.push(p / q, -p / q);
    }
  }

  return [...new Set(roots)].sort((a, b) => a - b);
}

/**
 * Evaluate quadratic at given x
 */
function evaluateQuadratic(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c;
}

/**
 * Evaluate cubic at given x
 */
function evaluateCubic(a: number, b: number, c: number, d: number, x: number): number {
  return a * x * x * x + b * x * x + c * x + d;
}

/**
 * Evaluate polynomial at given x
 */
function evaluatePolynomial(coefficients: number[], x: number): number {
  let result = 0;
  for (let i = 0; i < coefficients.length; i++) {
    result += coefficients[i]! * Math.pow(x, i);
  }
  return result;
}

/**
 * Build linear factor (x - root)
 */
function buildLinearFactor(variable: string, root: number): ASTNode {
  if (root === 0) {
    return { type: 'Identifier', name: variable };
  }

  if (root > 0) {
    return {
      type: 'BinaryExpression',
      operator: '-',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: root },
    };
  } else {
    return {
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'Identifier', name: variable },
      right: { type: 'NumberLiteral', value: -root },
    };
  }
}

/**
 * Build quadratic factorization from leading coefficient and roots
 */
function buildQuadraticFactorization(
  a: number,
  root1: number,
  root2: number,
  variable: string
): ASTNode {
  const factor1 = buildLinearFactor(variable, root1);
  const factor2 = buildLinearFactor(variable, root2);

  if (a === 1) {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: factor1,
      right: factor2,
    };
  } else {
    return {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'NumberLiteral', value: a },
      right: {
        type: 'BinaryExpression',
        operator: '*',
        left: factor1,
        right: factor2,
      },
    };
  }
}

/**
 * Divide cubic by linear factor (synthetic division)
 */
function divideCubicByLinear(
  a: number,
  b: number,
  c: number,
  d: number,
  root: number
): [number, number, number] | null {
  // Synthetic division: (ax³ + bx² + cx + d) ÷ (x - root)
  const q2 = a;
  const q1 = b + root * q2;
  const q0 = c + root * q1;
  const remainder = d + root * q0;

  if (Math.abs(remainder) > 1e-10) {
    return null; // Not an exact division
  }

  return [q0, q1, q2]; // Coefficients of quotient (constant, x, x²)
}

/**
 * Divide polynomial by linear factor
 */
function dividePolynomialByLinear(coefficients: number[], root: number): number[] | null {
  // Synthetic division for general polynomial
  const quotient: number[] = [];
  let remainder = 0;

  for (let i = coefficients.length - 1; i >= 0; i--) {
    remainder = remainder * root + coefficients[i]!;
    if (i > 0) {
      quotient.unshift(remainder);
    }
  }

  if (Math.abs(remainder) > 1e-10) {
    return null; // Not an exact division
  }

  return quotient;
}

/**
 * Build quadratic from coefficients
 */
function buildQuadraticFromCoefficients(
  coeffs: [number, number, number],
  variable: string
): ASTNode {
  const [c, b, a] = coeffs;

  // Build ax² + bx + c
  let result: ASTNode;

  // Start with constant term
  if (c !== 0) {
    result = { type: 'NumberLiteral', value: c };
  } else {
    result = { type: 'NumberLiteral', value: 0 };
  }

  // Add linear term
  if (b !== 0) {
    const linearTerm: ASTNode =
      b === 1
        ? ({ type: 'Identifier', name: variable } as Identifier)
        : ({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: b } as NumberLiteral,
            right: { type: 'Identifier', name: variable } as Identifier,
          } as BinaryExpression);

    result =
      result.type === 'NumberLiteral' && result.value === 0
        ? linearTerm
        : ({
            type: 'BinaryExpression',
            operator: '+',
            left: result,
            right: linearTerm,
          } as BinaryExpression);
  }

  // Add quadratic term
  if (a !== 0) {
    const quadraticTerm: ASTNode =
      a === 1
        ? ({
            type: 'BinaryExpression',
            operator: '^',
            left: { type: 'Identifier', name: variable } as Identifier,
            right: { type: 'NumberLiteral', value: 2 } as NumberLiteral,
          } as BinaryExpression)
        : ({
            type: 'BinaryExpression',
            operator: '*',
            left: { type: 'NumberLiteral', value: a } as NumberLiteral,
            right: {
              type: 'BinaryExpression',
              operator: '^',
              left: { type: 'Identifier', name: variable } as Identifier,
              right: { type: 'NumberLiteral', value: 2 } as NumberLiteral,
            } as BinaryExpression,
          } as BinaryExpression);

    result =
      result.type === 'NumberLiteral' && result.value === 0
        ? quadraticTerm
        : ({
            type: 'BinaryExpression',
            operator: '+',
            left: result,
            right: quadraticTerm,
          } as BinaryExpression);
  }

  return result;
}

/**
 * Build polynomial from coefficients array
 */
function buildPolynomialFromCoefficients(coefficients: number[], variable: string): ASTNode {
  let result: ASTNode | null = null;

  for (let i = 0; i < coefficients.length; i++) {
    const coeff = coefficients[i]!;
    if (coeff === 0) continue;

    let term: ASTNode;

    if (i === 0) {
      // Constant term
      term = { type: 'NumberLiteral', value: coeff };
    } else if (i === 1) {
      // Linear term
      term =
        coeff === 1
          ? { type: 'Identifier', name: variable }
          : {
              type: 'BinaryExpression',
              operator: '*',
              left: { type: 'NumberLiteral', value: coeff },
              right: { type: 'Identifier', name: variable },
            };
    } else {
      // Higher degree terms
      const powerTerm: ASTNode = {
        type: 'BinaryExpression',
        operator: '^',
        left: { type: 'Identifier', name: variable },
        right: { type: 'NumberLiteral', value: i },
      };

      term =
        coeff === 1
          ? powerTerm
          : {
              type: 'BinaryExpression',
              operator: '*',
              left: { type: 'NumberLiteral', value: coeff },
              right: powerTerm,
            };
    }

    if (result === null) {
      result = term;
    } else {
      result = {
        type: 'BinaryExpression',
        operator: '+',
        left: result,
        right: term,
      };
    }
  }

  return result || { type: 'NumberLiteral', value: 0 };
}

/**
 * Check if two expressions are equivalent
 */
function areEquivalentExpressions(left: ASTNode, right: ASTNode): boolean {
  if (left.type !== right.type) return false;

  switch (left.type) {
    case 'NumberLiteral':
      return Math.abs(left.value - (right as NumberLiteral).value) < 1e-10;

    case 'Identifier':
      return left.name === (right as Identifier).name;

    case 'BinaryExpression': {
      const rightBinary = right as BinaryExpression;
      return (
        left.operator === rightBinary.operator &&
        areEquivalentExpressions(left.left, rightBinary.left) &&
        areEquivalentExpressions(left.right, rightBinary.right)
      );
    }

    default:
      return false;
  }
}
