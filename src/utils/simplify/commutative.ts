/**
 * Advanced Mathematical Term Analysis and Simplification System
 * High-performance algebraic computation with full backward compatibility
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier, Fraction } from '@/types';

/**
 * Represents a mathematical term in its most canonical form
 * Handles complex algebraic structures with precision
 */
interface AlgebraicTerm {
  /** Numerical coefficient */
  coefficient: number;
  /** Variable factors with their powers */
  variables: Map<string, number>;
  /** Non-algebraic constant expressions */
  constants: ASTNode[];
  /** Original term complexity score */
  complexity: number;
}

/**
 * High-performance term analyzer with sophisticated pattern recognition
 */
export class AdvancedTermAnalyzer {
  private static readonly ZERO_TERM: AlgebraicTerm = {
    coefficient: 0,
    variables: new Map(),
    constants: [],
    complexity: 0,
  };

  /**
   * Analyze any mathematical expression into canonical algebraic form
   */
  static analyze(node: ASTNode): AlgebraicTerm {
    if (!node) return this.ZERO_TERM;

    try {
      return this.deepAnalyze(node, 0);
    } catch (error) {
      // Fallback for complex expressions
      return {
        coefficient: 1,
        variables: new Map(),
        constants: [node],
        complexity: 100,
      };
    }
  }

  /**
   * Deep recursive analysis with cycle detection
   */
  private static deepAnalyze(node: ASTNode, depth: number): AlgebraicTerm {
    // Prevent infinite recursion
    if (depth > 20) {
      return {
        coefficient: 1,
        variables: new Map(),
        constants: [node],
        complexity: depth,
      };
    }

    switch (node.type) {
      case 'NumberLiteral':
        return this.analyzeNumber(node as NumberLiteral);

      case 'Identifier':
        return this.analyzeVariable(node as Identifier);

      case 'Fraction':
        return this.analyzeFraction(node as Fraction);

      case 'BinaryExpression':
        return this.analyzeBinaryExpression(node as BinaryExpression, depth);

      default:
        return this.analyzeComplex(node);
    }
  }

  /**
   * Analyze numerical literals
   */
  private static analyzeNumber(node: NumberLiteral): AlgebraicTerm {
    return {
      coefficient: node.value,
      variables: new Map(),
      constants: [],
      complexity: 1,
    };
  }

  /**
   * Analyze variable identifiers
   */
  private static analyzeVariable(node: Identifier): AlgebraicTerm {
    const variables = new Map<string, number>();
    variables.set(node.name, 1);

    return {
      coefficient: 1,
      variables,
      constants: [],
      complexity: 2,
    };
  }

  /**
   * Analyze fraction nodes
   */
  private static analyzeFraction(node: Fraction): AlgebraicTerm {
    // Try to convert fraction to numerical coefficient
    if (node.numerator.type === 'NumberLiteral' && node.denominator.type === 'NumberLiteral') {
      const numerator = node.numerator as NumberLiteral;
      const denominator = node.denominator as NumberLiteral;

      if (denominator.value !== 0) {
        return {
          coefficient: numerator.value / denominator.value,
          variables: new Map(),
          constants: [],
          complexity: 1,
        };
      }
    }

    // If not a simple numerical fraction, treat as complex
    return this.analyzeComplex(node);
  }

  /**
   * Analyze binary expressions with operator-specific logic
   */
  private static analyzeBinaryExpression(node: BinaryExpression, depth: number): AlgebraicTerm {
    const left = this.deepAnalyze(node.left, depth + 1);
    const right = this.deepAnalyze(node.right, depth + 1);

    switch (node.operator) {
      case '*':
        return this.multiplyTerms(left, right);

      case '^':
        return this.powerTerm(left, right, node);

      case '+':
      case '-':
        // For addition/subtraction, treat as complex expression
        return this.analyzeComplex(node);

      default:
        return this.analyzeComplex(node);
    }
  }

  /**
   * Multiply two algebraic terms
   */
  private static multiplyTerms(left: AlgebraicTerm, right: AlgebraicTerm): AlgebraicTerm {
    const coefficient = left.coefficient * right.coefficient;

    // Merge variables
    const variables = new Map(left.variables);
    for (const [name, power] of right.variables) {
      variables.set(name, (variables.get(name) || 0) + power);
    }

    // Filter out zero powers
    for (const [name, power] of variables) {
      if (power === 0) {
        variables.delete(name);
      }
    }

    // Combine constants
    const constants = [...left.constants, ...right.constants];

    return {
      coefficient,
      variables,
      constants,
      complexity: left.complexity + right.complexity + 1,
    };
  }

  /**
   * Handle power operations
   */
  private static powerTerm(
    base: AlgebraicTerm,
    exponent: AlgebraicTerm,
    original: BinaryExpression
  ): AlgebraicTerm {
    // Only handle simple numeric exponents
    if (exponent.variables.size > 0 || exponent.constants.length > 0) {
      return this.analyzeComplex(original);
    }

    const exp = exponent.coefficient;

    // Handle integer powers
    if (Number.isInteger(exp) && exp >= 0 && exp <= 10) {
      const coefficient = Math.pow(base.coefficient, exp);

      // Multiply variable powers
      const variables = new Map<string, number>();
      for (const [name, power] of base.variables) {
        variables.set(name, power * exp);
      }

      return {
        coefficient,
        variables,
        constants: base.constants.length > 0 ? [original] : [],
        complexity: base.complexity * exp + 5,
      };
    }

    return this.analyzeComplex(original);
  }

  /**
   * Handle complex expressions that cannot be simplified
   */
  private static analyzeComplex(node: ASTNode): AlgebraicTerm {
    return {
      coefficient: 1,
      variables: new Map(),
      constants: [node],
      complexity: 50,
    };
  }

  /**
   * Create a unique grouping key for like terms
   */
  static createGroupingKey(term: AlgebraicTerm): string {
    // Variables part
    const varEntries = Array.from(term.variables.entries()).sort();
    const varsKey = varEntries.map(([name, power]) => `${name}^${power}`).join('*');

    // Constants part (normalized)
    const constantsKey = term.constants
      .map(c => this.normalizeConstant(c))
      .sort()
      .join('|');

    return `${varsKey}||${constantsKey}`;
  }

  /**
   * Normalize constant for consistent comparison
   */
  private static normalizeConstant(node: ASTNode): string {
    const cleaned = JSON.parse(
      JSON.stringify(node, (key, value) => {
        if (key === 'scope' || key === 'uniqueId') return undefined;
        return value;
      })
    );
    return JSON.stringify(cleaned);
  }
}

/**
 * Advanced term combiner with intelligent optimization
 */
export class AdvancedTermCombiner {
  /**
   * Combine like terms with maximum efficiency
   */
  static combineTerms(
    terms: Array<{ term: ASTNode; sign: number }>
  ): Array<{ term: ASTNode; sign: number }> {
    if (terms.length === 0) return [];
    if (terms.length === 1) return terms;

    // Group terms by their algebraic structure
    const groups = new Map<
      string,
      {
        totalCoefficient: number;
        canonicalTerm: AlgebraicTerm;
        originalTerms: Array<{ term: ASTNode; sign: number }>;
      }
    >();

    for (const { term, sign } of terms) {
      const analyzed = AdvancedTermAnalyzer.analyze(term);
      const key = AdvancedTermAnalyzer.createGroupingKey(analyzed);

      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.totalCoefficient += sign * analyzed.coefficient;
        group.originalTerms.push({ term, sign });
      } else {
        groups.set(key, {
          totalCoefficient: sign * analyzed.coefficient,
          canonicalTerm: analyzed,
          originalTerms: [{ term, sign }],
        });
      }
    }

    // Reconstruct terms
    const result: Array<{ term: ASTNode; sign: number }> = [];

    for (const group of groups.values()) {
      if (Math.abs(group.totalCoefficient) < 1e-10) {
        continue; // Skip essentially zero terms
      }

      try {
        const reconstructed = this.reconstructTerm(group.canonicalTerm, group.totalCoefficient);

        if (group.totalCoefficient > 0) {
          result.push({ term: reconstructed, sign: 1 });
        } else {
          result.push({ term: reconstructed, sign: -1 });
        }
      } catch (error) {
        // Fallback: use the first original term if reconstruction fails
        const fallback = group.originalTerms[0];
        if (fallback) {
          result.push(fallback);
        }
      }
    }

    return result;
  }

  /**
   * Reconstruct AST from canonical algebraic term
   */
  private static reconstructTerm(canonical: AlgebraicTerm, totalCoefficient: number): ASTNode {
    const absCoeff = Math.abs(totalCoefficient);

    // Build variable part
    const variablePart = this.buildVariablePart(canonical.variables);

    // Handle constants
    let result = variablePart;
    for (const constant of canonical.constants) {
      if (result) {
        result = {
          type: 'BinaryExpression',
          operator: '*',
          left: result,
          right: constant,
        } as BinaryExpression;
      } else {
        result = constant;
      }
    }

    // Apply coefficient - this is the critical part
    if (absCoeff === 1 && result) {
      return result;
    }

    if (!result) {
      // Convert decimal coefficient to fraction if needed
      if (!Number.isInteger(absCoeff)) {
        const fraction = this.decimalToFraction(absCoeff);
        return {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: fraction.numerator } as NumberLiteral,
          denominator: { type: 'NumberLiteral', value: fraction.denominator } as NumberLiteral,
        } as Fraction;
      }
      return { type: 'NumberLiteral', value: absCoeff } as NumberLiteral;
    }

    // Always apply coefficient if it's not 1
    if (absCoeff !== 1) {
      // Convert decimal coefficient to fraction if needed
      if (!Number.isInteger(absCoeff)) {
        const fraction = this.decimalToFraction(absCoeff);
        const coeffNode = {
          type: 'Fraction',
          numerator: { type: 'NumberLiteral', value: fraction.numerator } as NumberLiteral,
          denominator: { type: 'NumberLiteral', value: fraction.denominator } as NumberLiteral,
        } as Fraction;

        return {
          type: 'BinaryExpression',
          operator: '*',
          left: coeffNode,
          right: result,
        } as BinaryExpression;
      }

      return {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'NumberLiteral', value: absCoeff } as NumberLiteral,
        right: result,
      } as BinaryExpression;
    }

    return result;
  }

  /**
   * Convert decimal to fraction
   */
  private static decimalToFraction(decimal: number): { numerator: number; denominator: number } {
    const tolerance = 1e-10;
    let h1 = 1,
      h2 = 0,
      k1 = 0,
      k2 = 1;
    let b = decimal;

    while (Math.abs(decimal - h1 / k1) > tolerance) {
      const a = Math.floor(b);
      const temp = h1;
      h1 = a * h1 + h2;
      h2 = temp;

      const temp2 = k1;
      k1 = a * k1 + k2;
      k2 = temp2;

      b = 1 / (b - a);
    }

    return { numerator: h1, denominator: k1 };
  }

  /**
   * Build variable part from variable map
   */
  private static buildVariablePart(variables: Map<string, number>): ASTNode | null {
    if (variables.size === 0) return null;

    const entries = Array.from(variables.entries()).sort();
    let result: ASTNode | null = null;

    for (const [name, power] of entries) {
      if (power === 0) continue;

      let varNode: ASTNode;
      if (power === 1) {
        varNode = { type: 'Identifier', name } as Identifier;
      } else {
        varNode = {
          type: 'BinaryExpression',
          operator: '^',
          left: { type: 'Identifier', name } as Identifier,
          right: { type: 'NumberLiteral', value: power } as NumberLiteral,
        } as BinaryExpression;
      }

      if (!result) {
        result = varNode;
      } else {
        result = {
          type: 'BinaryExpression',
          operator: '*',
          left: result,
          right: varNode,
        } as BinaryExpression;
      }
    }

    return result;
  }
}

/**
 * Backward-compatible API functions
 */

/**
 * Main function for combining like terms
 */
export function combineCommutativeLikeTerms(
  terms: Array<{ term: ASTNode; sign: number }>
): Array<{ term: ASTNode; sign: number }> {
  return AdvancedTermCombiner.combineTerms(terms);
}

/**
 * Extract coefficient and canonical form (legacy compatibility)
 */
export function extractCommutativeCoefficient(term: ASTNode): {
  coefficient: number;
  canonicalForm: ASTNode;
} {
  const analyzed = AdvancedTermAnalyzer.analyze(term);

  try {
    // Reconstruct without coefficient
    const withoutCoeff = { ...analyzed, coefficient: 1 };
    const canonical = AdvancedTermCombiner['reconstructTerm'](withoutCoeff, 1);

    return {
      coefficient: analyzed.coefficient,
      canonicalForm: canonical || term,
    };
  } catch (error) {
    return {
      coefficient: analyzed.coefficient,
      canonicalForm: term,
    };
  }
}

/**
 * Check if two terms are equivalent under commutative operations
 */
export function areCommutativelyEquivalent(left: ASTNode, right: ASTNode): boolean {
  const leftAnalyzed = AdvancedTermAnalyzer.analyze(left);
  const rightAnalyzed = AdvancedTermAnalyzer.analyze(right);

  return (
    AdvancedTermAnalyzer.createGroupingKey(leftAnalyzed) ===
    AdvancedTermAnalyzer.createGroupingKey(rightAnalyzed)
  );
}

/**
 * Advanced simplification with intelligent term recognition
 */
export function advancedSimplifyTerms(
  terms: Array<{ term: ASTNode; sign: number }>
): Array<{ term: ASTNode; sign: number }> {
  // Pre-process: normalize input
  const normalized = terms.filter(t => t.term);

  if (normalized.length <= 1) return normalized;

  // Apply advanced combination
  const combined = AdvancedTermCombiner.combineTerms(normalized);

  // Post-process: sort by complexity for better readability
  return combined.sort((a, b) => {
    const aAnalyzed = AdvancedTermAnalyzer.analyze(a.term);
    const bAnalyzed = AdvancedTermAnalyzer.analyze(b.term);
    return aAnalyzed.complexity - bAnalyzed.complexity;
  });
}
