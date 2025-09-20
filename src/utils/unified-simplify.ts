/**
 * Unified Mathematical Simplification System
 * Integrates middle-simplify with advanced factorization patterns
 * Avoids circular dependencies through proper layering
 */

import { ASTNode, Fraction } from '../types';
import { stepsAstToLatex } from './ast';
import { factorWithSteps } from './factorization/index';
import {
  simplify as middleSimplify,
  SimplifyOptions as MiddleSimplifyOptions,
} from './middle-simplify';
/**
 * Unified simplification options - extends middle-simplify with factorization
 */
export interface SimplifyOptions extends MiddleSimplifyOptions {
  /** Apply advanced factorization patterns (default: false) */
  usePatternRecognition?: boolean;
  /** Factor expressions using advanced algorithms (default: false) */
  factor?: boolean;
}

/**
 * Default unified simplification options
 */
const DEFAULT_SIMPLIFY_OPTIONS: Required<SimplifyOptions> = {
  combineLikeTerms: true,
  expand: true,
  simplifyFractions: true,
  applyIdentities: true,
  convertSqrtToExponential: true,
  advancedExponentialSimplification: true,
  maxDepth: 10,
  usePatternRecognition: true,
  factor: true,
};

/**
 * Unified simplification function
 * Uses middle-simplify as base, adds factorization capabilities
 */
function simplify(node: ASTNode, options: SimplifyOptions = {}, steps?: string[]): ASTNode {
  const opts = { ...DEFAULT_SIMPLIFY_OPTIONS, ...options };

  if (!node) return node;

  try {
    if (steps) steps.push('Starting unified simplification');
    // Step 1: Apply middle-simplify (polynomial simplification without factorization)
    let result = middleSimplify(
      node,
      {
        combineLikeTerms: opts.combineLikeTerms,
        expand: true,
        simplifyFractions: opts.simplifyFractions,
        applyIdentities: opts.applyIdentities,
        convertSqrtToExponential: opts.convertSqrtToExponential,
        advancedExponentialSimplification: opts.advancedExponentialSimplification,
        maxDepth: opts.maxDepth,
      },
      steps
    );
    if (steps) steps.push('After middle-simplify');

    // Step 2: Apply pattern recognition for factorization if enabled
    // This method is currently placeholder as pattern recognition is not fully implemented
    // Uncomment and implement when pattern recognition is ready
    //
    // if (opts.usePatternRecognition) {
    //   if (steps) steps.push('Applying pattern recognition');
    //   const patternResult = patternEngine.applyPattern(result);
    //   if (patternResult) {
    //     result = patternResult;
    //     if (steps) steps.push('Pattern recognition applied');
    //   }
    // }

    // Step 3: Apply advanced factorization if requested
    if (opts.factor) {
      if (steps) steps.push('Applying advanced factorization');
      const factorResult = factorWithSteps(result, 'x', {
        preferCompleteFactorization: true,
        extractCommonFactors: true,
        simplifyCoefficients: true,
      });
      if (factorResult && factorResult.ast) {
        result = factorResult.ast;
        if (steps && Array.isArray(factorResult.steps)) {
          factorResult.steps.forEach(s => steps.push(s));
        }
        if (steps) steps.push('Advanced factorization applied');
      }
    }

    // Step 4: Final pass with expand: false (middle-simplify)
    // factor: true の場合は expand: false を強制
    const finalExpand = opts.factor ? false : opts.expand;
    if (steps) steps.push(`Final pass with expand: ${finalExpand}`, stepsAstToLatex(result));
    result = middleSimplify(
      result,
      {
        combineLikeTerms: opts.combineLikeTerms,
        expand: finalExpand,
        simplifyFractions: opts.simplifyFractions,
        applyIdentities: opts.applyIdentities,
        convertSqrtToExponential: opts.convertSqrtToExponential,
        advancedExponentialSimplification: opts.advancedExponentialSimplification,
        maxDepth: opts.maxDepth,
      },
      steps
    );
    if (steps) steps.push('Unified simplification complete');

    return result;
  } catch (error) {
    // Fallback: return original node if simplification fails
    if (steps) steps.push('Unified simplification failed, returning original node');
    return node;
  }
}

/**
 * Simplify polynomial fractions with factorization
 * This is the main integration point per factor.md instructions
 */
export function simplifyPolynomialFractionWithFactorization(
  numerator: ASTNode,
  denominator: ASTNode
): Fraction | null {
  try {
    // Factor both numerator and denominator using factorWithSteps
    const factorNum = factorWithSteps(numerator, 'x', {
      preferCompleteFactorization: true,
      extractCommonFactors: true,
      simplifyCoefficients: true,
    });
    const factorDen = factorWithSteps(denominator, 'x', {
      preferCompleteFactorization: true,
      extractCommonFactors: true,
      simplifyCoefficients: true,
    });
    const factoredNumerator = factorNum && factorNum.ast ? factorNum.ast : numerator;
    const factoredDenominator = factorDen && factorDen.ast ? factorDen.ast : denominator;

    // Use middle-simplify's polynomial fraction simplification
    const simplified = simplifyPolynomialFraction(factoredNumerator, factoredDenominator);

    return simplified;
  } catch (error) {
    // Fallback to basic fraction without factorization
    return simplifyPolynomialFraction(numerator, denominator);
  }
}

/**
 * Basic polynomial fraction simplification (delegated to middle-simplify)
 * This ensures we don't duplicate logic from middle-simplify
 */

// Polynomial fraction reduction using factorization (GCD cancellation)

function simplifyPolynomialFraction(numerator: ASTNode, denominator: ASTNode): Fraction | null {
  // 1. Extract factors as arrays (flattened)
  function extractFactors(node: ASTNode): ASTNode[] {
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      return [...extractFactors(node.left), ...extractFactors(node.right)];
    }
    return [node];
  }

  let numFactors = extractFactors(numerator);
  let denFactors = extractFactors(denominator);

  // 2. Cancel common factors (by structural equality)
  const used = new Array(denFactors.length).fill(false);
  numFactors = numFactors.filter(nf => {
    for (let i = 0; i < denFactors.length; ++i) {
      if (!used[i] && JSON.stringify(nf) === JSON.stringify(denFactors[i])) {
        used[i] = true;
        return false; // cancel
      }
    }
    return true;
  });
  denFactors = denFactors.filter((_, i) => !used[i]);

  // 3. Rebuild numerator and denominator
  function buildProduct(factors: ASTNode[]): ASTNode {
    const filtered = factors.filter(f => f !== undefined);
    if (filtered.length === 0) return { type: 'NumberLiteral', value: 1 };
    if (filtered.length === 1) return filtered[0] as ASTNode;
    return filtered.reduce((a, b) => ({
      type: 'BinaryExpression',
      operator: '*',
      left: a,
      right: b,
    }));
  }
  const newNum = buildProduct(numFactors);
  const newDen = buildProduct(denFactors);

  // 4. If denominator is 1, return numerator only
  if (newDen.type === 'NumberLiteral' && newDen.value === 1) {
    // 型をFractionに合わせるため、分母1のFractionとして返す
    return {
      type: 'Fraction',
      numerator: newNum,
      denominator: { type: 'NumberLiteral', value: 1 },
    };
  }
  // 5. If numerator is 0, return 0
  if (newNum.type === 'NumberLiteral' && newNum.value === 0) {
    // 型をFractionに合わせるため、分母はそのまま
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: 0 },
      denominator: newDen,
    };
  }
  // 6. If numerator and denominator are unchanged, return null (no reduction)
  if (
    JSON.stringify(newNum) === JSON.stringify(numerator) &&
    JSON.stringify(newDen) === JSON.stringify(denominator)
  ) {
    return null;
  }
  // 7. Return reduced fraction
  return { type: 'Fraction', numerator: newNum, denominator: newDen };
}

/**
 * Repeatedly applies unified simplification (including factorization, reduction, etc.)
 * until no further change is detected or max iterations reached.
 * This is useful for cases where reduction/factorization enables further simplification.
 *
 * @param node - The AST to simplify
 * @param options - Simplification options
 * @param steps - Optional steps log
 * @param maxIterations - Maximum number of passes (default: 5)
 */

// 再帰的にAST全体の分数ノードを約分・因数分解する
function deepFractionSimplify(node: ASTNode, steps?: string[]): ASTNode {
  if (node.type === 'Fraction') {
    if (steps) steps.push('Applying polynomial fraction reduction (deep)');
    const reduced = simplifyPolynomialFractionWithFactorization(
      deepFractionSimplify(node.numerator, steps),
      deepFractionSimplify(node.denominator, steps)
    );
    if (reduced) {
      if (steps) steps.push('Polynomial fraction reduction applied (deep)');
      return reduced;
    }
    // reductionなしでも再帰結果を返す
    return {
      type: 'Fraction',
      numerator: deepFractionSimplify(node.numerator, steps),
      denominator: deepFractionSimplify(node.denominator, steps),
    };
  }
  // 再帰的に各サブノードへ
  if (node.type === 'BinaryExpression') {
    return {
      ...node,
      left: deepFractionSimplify(node.left, steps),
      right: deepFractionSimplify(node.right, steps),
    };
  }
  if (node.type === 'UnaryExpression') {
    return {
      ...node,
      operand: deepFractionSimplify(node.operand, steps),
    };
  }
  if (node.type === 'FunctionCall') {
    return {
      ...node,
      args: node.args.map(arg => deepFractionSimplify(arg, steps)),
    };
  }
  if (node.type === 'Integral') {
    const base = {
      type: 'Integral' as const,
      integrand: deepFractionSimplify(node.integrand, steps),
      variable: node.variable,
    };
    return {
      ...base,
      ...(node.lowerBound !== undefined
        ? { lowerBound: deepFractionSimplify(node.lowerBound, steps) }
        : {}),
      ...(node.upperBound !== undefined
        ? { upperBound: deepFractionSimplify(node.upperBound, steps) }
        : {}),
    };
  }
  if (node.type === 'Sum' || node.type === 'Product') {
    return {
      ...node,
      expression: deepFractionSimplify(node.expression, steps),
      lowerBound: deepFractionSimplify(node.lowerBound, steps),
      upperBound: deepFractionSimplify(node.upperBound, steps),
    };
  }
  // その他のノードはそのまま返す
  return node;
}

export function overlapSimplify(
  node: ASTNode,
  options: SimplifyOptions = {},
  steps?: string[],
  maxIterations: number = 5
): ASTNode {
  let current = node;
  let prevStr = JSON.stringify(current);
  let changed = false;
  let count = 1;
  if (steps) steps.push('--- overlapSimplify start ---');
  while (count <= maxIterations) {
    if (steps) steps.push(`overlapSimplify pass #${count}`);
    // 1. 普通の簡約
    let result = simplify(current, options, steps);
    // 2. AST全体の分数ノードを再帰的に約分・因数分解
    result = deepFractionSimplify(result, steps);
    const nextStr = JSON.stringify(result);
    if (nextStr === prevStr) {
      if (steps) steps.push('No further change detected, stopping.');
      changed = false;
      current = result;
      break;
    } else {
      changed = true;
      current = result;
      prevStr = nextStr;
      count++;
    }
  }
  if (steps) steps.push('--- overlapSimplify end ---');
  return current;
}

// Re-export middle-simplify types for convenience
export type { SimplifyOptions as MiddleSimplifyOptions } from './middle-simplify';

/**
 * Direct access to middle-simplify (polynomial-only simplification)
 */
export { simplify as middleSimplify } from './middle-simplify';
export { overlapSimplify as simplify };

/**
 * Direct access to advanced factorization
 */
// export { advancedFactor } from './factorization/index';
