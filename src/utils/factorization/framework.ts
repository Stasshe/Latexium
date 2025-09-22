/**
 * Advanced Factorization Strategy Framework
 * A comprehensive strategy-based factorization system for polynomial expressions
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier, StepTree } from '../../types';
import { astToLatex, stepsAstToLatex } from '../ast';

import { FACTORIZATION } from '@/config';

/**
 * Base interface for all factorization strategies
 */
export interface FactorizationStrategy {
  name: string;
  description: string;
  priority: number; // Higher priority strategies are tried first
  canApply(node: ASTNode, context: FactorizationContext): boolean;
  apply(node: ASTNode, context: FactorizationContext): FactorizationResult;
}

/**
 * Context for factorization operations
 */
export interface FactorizationContext {
  variable: string;
  maxIterations: number;
  currentIteration: number;
  steps: StepTree[];
  preferences: FactorizationPreferences;
}

/**
 * Preferences for factorization behavior
 */
export interface FactorizationPreferences {
  preferCompleteFactorization: boolean;
  allowIrrationalFactors: boolean;
  allowComplexFactors: boolean;
  simplifyCoefficients: boolean;
  extractCommonFactors: boolean;
}

/**
 * Result of a factorization strategy
 */
export interface FactorizationResult {
  success: boolean;
  ast: ASTNode;
  changed: boolean;
  steps: StepTree[];
  strategyUsed: string;
  canContinue: boolean; // Whether further factorization might be possible
}

/**
 * Polynomial representation for analysis
 */
export interface PolynomialInfo {
  degree: number;
  coefficients: Map<number, number>;
  leadingCoeff: number;
  constantTerm: number;
  isUnivariate: boolean;
  variables: Set<string>;
}

/**
 * Main factorization engine using strategy pattern
 */
export class FactorizationEngine {
  private strategies: FactorizationStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Register a factorization strategy
   */
  registerStrategy(strategy: FactorizationStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Factor an expression using all available strategies
   */
  factor(
    node: ASTNode,
    variable: string = 'x',
    preferences: Partial<FactorizationPreferences> = {}
  ): FactorizationResult {
    const context: FactorizationContext = {
      variable,
      maxIterations: 10,
      currentIteration: 0,
      steps: [],
      preferences: {
        preferCompleteFactorization: true,
        allowIrrationalFactors: false,
        allowComplexFactors: false,
        simplifyCoefficients: true,
        extractCommonFactors: true,
        ...preferences,
      },
    };

    context.steps.push(`Starting factorization of: ${astToLatex(node)}`);

    let currentNode: ASTNode;
    try {
      currentNode = this.deepClone(node);
    } catch (cloneError) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [
          `Error during factorization: ${cloneError instanceof Error ? cloneError.message : 'Unknown clone error'}`,
        ],
        strategyUsed: 'Error',
        canContinue: false,
      };
    }

    let hasChanged = false;
    const totalSteps: StepTree = [...context.steps];

    while (context.currentIteration < context.maxIterations) {
      context.currentIteration++;
      let iterationChanged = false;
      const shouldContinue = true;

      for (const strategy of this.strategies) {
        if (strategy.canApply(currentNode, context)) {
          context.steps.push(`Attempting ${strategy.name}...`);

          const result = strategy.apply(currentNode, context);

          if (result.success && result.changed) {
            currentNode = result.ast;
            hasChanged = true;
            iterationChanged = true;
            if (Array.isArray(result.steps)) {
              totalSteps.push(...result.steps);
            } else {
              totalSteps.push(result.steps);
            }

            // Safe LaTeX conversion with error handling
            try {
              const latexStr = astToLatex(currentNode);
              context.steps.push(`✓ Applied ${strategy.name}: ${latexStr}`);
            } catch (latexError) {
              context.steps.push(`✓ Applied ${strategy.name}: [LaTeX conversion failed]`);
              throw new Error(
                `LaTeX conversion failed after ${strategy.name}: ${latexError instanceof Error ? latexError.message : 'Unknown error'}`
              );
            }

            // Continue to next iteration to try other strategies on the new result
            break;
          } else if (!result.success) {
            context.steps.push(
              `✗ ${strategy.name} failed: ${stepsAstToLatex(result.ast)}`,
              result.steps
            );
          }
        }
      }

      if (!iterationChanged) {
        context.steps.push('No further factorization possible');
        break;
      }

      // Stop if any applied strategy requested to stop
      if (!shouldContinue) {
        context.steps.push('Factorization complete');
        break;
      }
    }

    if (context.currentIteration >= context.maxIterations) {
      context.steps.push('Maximum iterations reached');
    }
    context.steps.push('Attempting recursive factorization of subexpressions...');
    currentNode = this.recursivelyFactorSubexpressions(currentNode, context);
    // Ensure all context steps are included in totalSteps
    if (Array.isArray(context.steps)) {
      totalSteps.push(...context.steps.slice(totalSteps.length));
    }

    return {
      success: true,
      ast: currentNode,
      changed: hasChanged,
      steps: totalSteps,
      strategyUsed: hasChanged ? 'Multiple strategies' : 'No change',
      canContinue: false,
    };
  }

  /**
   * Recursively factor subexpressions in the result
   */
  private recursivelyFactorSubexpressions(node: ASTNode, context: FactorizationContext): ASTNode {
    // Recursively factor subexpressions (true factorization)
    // Only apply to subnodes, not the root node itself
    // 単項式（単なる変数や数値、単純な積やべき）は再帰的因数分解・steps pushを行わない
    // 単項式判定: NumberLiteral, Identifier, 単純な x^n, c*x^n, -x^n など
    if (this.isMonomial(node)) {
      // 単項式の場合は何もしない
      return node;
    }
    if (node.type === 'BinaryExpression') {
      const left = this.recursivelyFactorSubexpressions(node.left, context);
      const right = this.recursivelyFactorSubexpressions(node.right, context);
      let newNode = { ...node, left, right };
      // さらに、各サブノードにfactorを適用
      if (
        node.operator === '*' ||
        (node.operator === '+' && FACTORIZATION.applyFactorPlusOperate)
      ) {
        // それぞれの因子/項にfactorを適用
        const leftFactored = this.factor(left, context.variable, context.preferences);
        const rightFactored = this.factor(right, context.variable, context.preferences);
        newNode = { ...node, left: leftFactored.ast, right: rightFactored.ast };
        // 単項式でなければstepsをpush
        if (!this.isMonomial(leftFactored.ast)) {
          context.steps.push(
            'leftFactored',
            leftFactored.steps,
            `[recursive-factor] factored left: ${stepsAstToLatex(leftFactored.ast)}`
          );
        }
        if (!this.isMonomial(rightFactored.ast)) {
          context.steps.push(
            'rightFactored',
            rightFactored.steps,
            `[recursive-factor] factored right: ${stepsAstToLatex(rightFactored.ast)}`
          );
        }
      }
      return newNode;
    } else if (node.type === 'UnaryExpression') {
      const operand = this.recursivelyFactorSubexpressions(node.operand, context);
      return { ...node, operand };
    } else if (node.type === 'FunctionCall') {
      const args = node.args.map(arg => this.recursivelyFactorSubexpressions(arg, context));
      return { ...node, args };
    }
    // 他の型はそのまま返す
    return node;
  }
  /**
   * Check if the node is a monomial (single term, e.g. c*x^n, x, 3, -x^2, etc.)
   */
  private isMonomial(node: ASTNode): boolean {
    // Number or variable
    if (node.type === 'NumberLiteral' || node.type === 'Identifier') return true;
    // -x^n or -x or -c
    if (node.type === 'UnaryExpression' && node.operator === '-') {
      return this.isMonomial(node.operand);
    }
    // c*x^n, c*x, x^n, c
    if (node.type === 'BinaryExpression') {
      if (node.operator === '*') {
        // Both sides must be monomials (e.g. 3*x, 2*x^2)
        return this.isMonomial(node.left) && this.isMonomial(node.right);
      }
      if (node.operator === '^') {
        // x^n, (c*x)^n, etc.
        return this.isMonomial(node.left) && this.isMonomial(node.right);
      }
    }
    return false;
  }

  /**
   * Combine factored left and right sides of multiplication
   * Handles cases where either side might be a product of multiple factors
   */
  private combineFactoredMultiplication(
    left: ASTNode,
    right: ASTNode,
    context: FactorizationContext
  ): ASTNode {
    // Extract all factors from both sides
    const leftFactors = this.extractMultiplicationFactors(left);
    const rightFactors = this.extractMultiplicationFactors(right);

    // Combine all factors
    const allFactors = [...leftFactors, ...rightFactors];

    if (allFactors.length <= 1) {
      return allFactors[0] || { type: 'NumberLiteral', value: 1 };
    }

    // Build the result as a chain of multiplications
    let result = allFactors[0]!;
    for (let i = 1; i < allFactors.length; i++) {
      result = {
        type: 'BinaryExpression',
        operator: '*',
        left: result,
        right: allFactors[i]!,
      };
    }

    return result;
  }

  /**
   * Extract all factors from a multiplication expression
   * Returns an array of individual factors
   */
  private extractMultiplicationFactors(node: ASTNode): ASTNode[] {
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      return [
        ...this.extractMultiplicationFactors(node.left),
        ...this.extractMultiplicationFactors(node.right),
      ];
    }
    return [node];
  }

  /**
   * Initialize all available strategies
   */
  private initializeStrategies(): void {
    // Import and register strategies (will be implemented separately)
    // This allows for modular addition of new strategies
  }

  /**
   * Deep clone an AST node
   */
  private deepClone(node: ASTNode): ASTNode {
    switch (node.type) {
      case 'NumberLiteral':
        return { ...node };
      case 'Identifier':
        return { ...node };
      case 'BinaryExpression':
        return {
          ...node,
          left: this.deepClone(node.left),
          right: this.deepClone(node.right),
        };
      case 'UnaryExpression':
        return {
          ...node,
          operand: this.deepClone(node.operand),
        };
      case 'FunctionCall':
        return {
          ...node,
          args: node.args.map(arg => this.deepClone(arg)),
        };
      case 'Fraction':
        return {
          ...node,
          numerator: this.deepClone(node.numerator),
          denominator: this.deepClone(node.denominator),
        };
      case 'Integral':
        return {
          ...node,
          integrand: this.deepClone(node.integrand),
          ...(node.lowerBound && { lowerBound: this.deepClone(node.lowerBound) }),
          ...(node.upperBound && { upperBound: this.deepClone(node.upperBound) }),
        };
      case 'Sum':
        return {
          ...node,
          expression: this.deepClone(node.expression),
          lowerBound: this.deepClone(node.lowerBound),
          upperBound: this.deepClone(node.upperBound),
        };
      case 'Product':
        return {
          ...node,
          expression: this.deepClone(node.expression),
          lowerBound: this.deepClone(node.lowerBound),
          upperBound: this.deepClone(node.upperBound),
        };
      default: {
        const nodeType = (node as { type?: string }).type;
        throw new Error(
          `Unsupported AST node type for cloning: ${nodeType || 'undefined'} - Full node: ${JSON.stringify(node, null, 2)}`
        );
      }
    }
  }
}

/**
 * Utility functions for polynomial analysis
 */
export class PolynomialAnalyzer {
  /**
   * Extract terms from an addition/subtraction expression
   * Returns array of {coefficient: number, variables: Map<string, number>, sign: 1|-1}
   */
  static extractTerms(node: ASTNode): Array<{
    coefficient: number;
    variables: Map<string, number>;
    sign: number;
    originalNode: ASTNode;
  }> {
    const terms: Array<{
      coefficient: number;
      variables: Map<string, number>;
      sign: number;
      originalNode: ASTNode;
    }> = [];

    this.collectTerms(node, terms, 1);
    return terms;
  }

  /**
   * Recursively collect terms from expression
   */
  private static collectTerms(
    node: ASTNode,
    terms: Array<{
      coefficient: number;
      variables: Map<string, number>;
      sign: number;
      originalNode: ASTNode;
    }>,
    sign: number
  ): void {
    if (node.type === 'BinaryExpression' && (node.operator === '+' || node.operator === '-')) {
      this.collectTerms(node.left, terms, sign);
      this.collectTerms(node.right, terms, node.operator === '+' ? sign : -sign);
    } else {
      const term = this.analyzeTerm(node, sign);
      terms.push({ ...term, originalNode: node });
    }
  }

  /**
   * Analyze a single term to extract coefficient and variables
   */
  private static analyzeTerm(
    node: ASTNode,
    sign: number
  ): { coefficient: number; variables: Map<string, number>; sign: number } {
    const variables = new Map<string, number>();

    const result = this.extractTermComponents(node, variables);

    return {
      coefficient: result.coefficient,
      variables,
      sign,
    };
  }

  /**
   * Extract coefficient and variables from a term
   */
  private static extractTermComponents(
    node: ASTNode,
    variables: Map<string, number>
  ): { coefficient: number } {
    switch (node.type) {
      case 'NumberLiteral':
        return { coefficient: node.value };

      case 'Identifier':
        variables.set(node.name, (variables.get(node.name) || 0) + 1);
        return { coefficient: 1 };

      case 'BinaryExpression':
        return this.handleTermBinaryExpression(node, variables);

      case 'UnaryExpression':
        if (node.operator === '-') {
          const result = this.extractTermComponents(node.operand, variables);
          return { coefficient: -result.coefficient };
        }
        return { coefficient: 1 };

      default:
        return { coefficient: 1 };
    }
  }

  /**
   * Handle binary expressions within a term
   */
  private static handleTermBinaryExpression(
    node: BinaryExpression,
    variables: Map<string, number>
  ): { coefficient: number } {
    switch (node.operator) {
      case '*': {
        const leftResult = this.extractTermComponents(node.left, variables);
        const rightResult = this.extractTermComponents(node.right, variables);
        return { coefficient: leftResult.coefficient * rightResult.coefficient };
      }

      case '^': {
        if (node.left.type === 'Identifier' && node.right.type === 'NumberLiteral') {
          const varName = node.left.name;
          const power = node.right.value;
          variables.set(varName, (variables.get(varName) || 0) + power);
          return { coefficient: 1 };
        }
        return { coefficient: 1 };
      }

      case '/': {
        const numerResult = this.extractTermComponents(node.left, variables);
        const denomResult = this.extractTermComponents(node.right, new Map());
        return { coefficient: numerResult.coefficient / denomResult.coefficient };
      }

      default:
        return { coefficient: 1 };
    }
  }

  /**
   * Find the greatest common divisor of coefficients
   */
  static findGCD(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return Math.abs(numbers[0] || 0);

    let result = Math.abs(numbers[0] || 0);
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcd(result, Math.abs(numbers[i] || 0));
      if (result === 1) break;
    }
    return result;
  }

  /**
   * Calculate GCD of two numbers
   */
  private static gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  /**
   * Find common variable factors among terms
   */
  static findCommonVariableFactors(
    terms: Array<{ variables: Map<string, number> }>
  ): Map<string, number> {
    if (terms.length === 0) return new Map();

    const commonFactors = new Map<string, number>();
    const firstTerm = terms[0];

    if (!firstTerm) return new Map();

    // Start with variables from first term
    for (const [variable, power] of firstTerm.variables) {
      let minPower = power;

      // Check if this variable exists in all other terms
      let existsInAll = true;
      for (let i = 1; i < terms.length; i++) {
        const term = terms[i];
        if (!term) {
          existsInAll = false;
          break;
        }
        const termPower = term.variables.get(variable) || 0;
        if (termPower === 0) {
          existsInAll = false;
          break;
        }
        minPower = Math.min(minPower, termPower);
      }

      if (existsInAll && minPower > 0) {
        commonFactors.set(variable, minPower);
      }
    }

    return commonFactors;
  }

  /**
   * Convert AST to polynomial representation (legacy compatibility)
   */
  static analyzePolynomial(node: ASTNode, variable: string): PolynomialInfo | null {
    // Simple implementation for compatibility
    const terms = this.extractTerms(node);

    if (terms.length === 0) return null;

    const coefficients = new Map<number, number>();
    const variables = new Set<string>();

    for (const term of terms) {
      for (const [varName, power] of term.variables) {
        variables.add(varName);
        if (varName === variable) {
          const coeff = term.coefficient * term.sign;
          coefficients.set(power, (coefficients.get(power) || 0) + coeff);
        }
      }

      // Constant term (no variables)
      if (term.variables.size === 0) {
        const coeff = term.coefficient * term.sign;
        coefficients.set(0, (coefficients.get(0) || 0) + coeff);
      }
    }

    if (coefficients.size === 0) return null;

    const degree = Math.max(...Array.from(coefficients.keys()));
    const leadingCoeff = coefficients.get(degree) || 0;
    const constantTerm = coefficients.get(0) || 0;
    const isUnivariate = variables.size <= 1;

    return {
      degree,
      coefficients,
      leadingCoeff,
      constantTerm,
      isUnivariate,
      variables,
    };
  }

  /**
   * Evaluate polynomial at given value
   */
  static evaluatePolynomial(poly: PolynomialInfo, value: number): number {
    let result = 0;
    for (const [power, coeff] of poly.coefficients) {
      result += coeff * Math.pow(value, power);
    }
    return result;
  }

  /**
   * Find rational roots using rational root theorem
   */
  static findRationalRoots(poly: PolynomialInfo): number[] {
    if (poly.degree === 0) return [];

    const constantTerm = poly.constantTerm;
    const leadingCoeff = poly.leadingCoeff;

    if (constantTerm === 0) {
      return [0]; // Zero is always a root if constant term is 0
    }

    const pFactors = this.getFactors(Math.abs(constantTerm));
    const qFactors = this.getFactors(Math.abs(leadingCoeff));

    const possibleRoots: number[] = [];

    for (const p of pFactors) {
      for (const q of qFactors) {
        possibleRoots.push(p / q, -p / q);
      }
    }

    // Remove duplicates and test each root
    const uniqueRoots = [...new Set(possibleRoots)];
    const actualRoots: number[] = [];

    for (const root of uniqueRoots) {
      if (Math.abs(this.evaluatePolynomial(poly, root)) < 1e-10) {
        actualRoots.push(root);
      }
    }

    return actualRoots.sort((a, b) => a - b);
  }

  /**
   * Get factors of a number
   */
  private static getFactors(n: number): number[] {
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
}

/**
 * Helper functions for AST manipulation
 */
export class ASTBuilder {
  /**
   * Create a number literal node
   */
  static number(value: number): NumberLiteral {
    return { type: 'NumberLiteral', value };
  }

  /**
   * Create an identifier node
   */
  static variable(name: string): Identifier {
    return {
      type: 'Identifier',
      name,
      scope: 'free',
      uniqueId: `free_${name}`,
    };
  }

  /**
   * Create a binary expression node
   */
  static binary(
    operator: '+' | '-' | '*' | '/' | '^' | '=' | '>' | '<' | '>=' | '<=',
    left: ASTNode,
    right: ASTNode
  ): BinaryExpression {
    return { type: 'BinaryExpression', operator, left, right };
  }

  /**
   * Create a multiplication node
   */
  static multiply(left: ASTNode, right: ASTNode): BinaryExpression {
    return this.binary('*', left, right);
  }

  /**
   * Create an addition node
   */
  static add(left: ASTNode, right: ASTNode): BinaryExpression {
    return this.binary('+', left, right);
  }

  /**
   * Create a subtraction node
   */
  static subtract(left: ASTNode, right: ASTNode): BinaryExpression {
    return this.binary('-', left, right);
  }

  /**
   * Create a power node
   */
  static power(base: ASTNode, exponent: ASTNode): BinaryExpression {
    return this.binary('^', base, exponent);
  }

  /**
   * Create a linear factor (x - root)
   */
  static linearFactor(variable: string, root: number): ASTNode {
    if (root === 0) {
      return this.variable(variable);
    }

    if (root > 0) {
      return this.subtract(this.variable(variable), this.number(root));
    } else {
      return this.add(this.variable(variable), this.number(-root));
    }
  }

  /**
   * Build a polynomial from coefficients
   */
  static buildPolynomial(coefficients: Map<number, number>, variable: string): ASTNode {
    const terms: ASTNode[] = [];

    // Sort powers in descending order
    const powers = Array.from(coefficients.keys()).sort((a, b) => b - a);

    for (const power of powers) {
      const coeff = coefficients.get(power)!;
      if (Math.abs(coeff) < 1e-12) continue;

      let term: ASTNode;

      if (power === 0) {
        term = this.number(coeff);
      } else if (power === 1) {
        term =
          coeff === 1
            ? this.variable(variable)
            : this.multiply(this.number(coeff), this.variable(variable));
      } else {
        const varPower = this.power(this.variable(variable), this.number(power));
        term = coeff === 1 ? varPower : this.multiply(this.number(coeff), varPower);
      }

      terms.push(term);
    }

    if (terms.length === 0) {
      return this.number(0);
    }

    if (terms.length === 1) {
      return terms[0]!;
    }

    // Combine terms with addition/subtraction
    let result = terms[0]!;
    for (let i = 1; i < terms.length; i++) {
      result = this.add(result, terms[i]!);
    }

    return result;
  }
}
