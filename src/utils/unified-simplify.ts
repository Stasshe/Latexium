/**
 * Unified Mathematical Simplification System
 * Integrates middle-simplify with advanced factorization patterns
 * Avoids circular dependencies through proper layering
 */

import { ASTNode, StepTree } from '../types';
import { stepsAstToLatex } from './ast';
import { factorWithSteps } from './factorization/index';
import {
  simplify as middleSimplify,
  SimplifyOptions as MiddleSimplifyOptions,
} from './middle-simplify';
import { simplifyPolynomialFraction } from './simplify-polynomial-fraction';
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
function simplify(node: ASTNode, options: SimplifyOptions = {}, steps?: StepTree[]): ASTNode {
  const opts = { ...DEFAULT_SIMPLIFY_OPTIONS, ...options };

  if (!node) return node;

  try {
    if (Array.isArray(steps)) steps.push('Starting unified simplification');
    // Step 1: Apply middle-simplify (polynomial simplification without factorization)
    let result: ASTNode;
    const msSteps: StepTree[] = [];
    result = middleSimplify(
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
      msSteps
    );
    if (Array.isArray(steps) && msSteps.length > 0) steps.push(['After middle-simplify', msSteps]);

    // Step 2: Apply advanced factorization if requested
    if (opts.factor) {
      const factorSteps: StepTree[] = [];
      if (Array.isArray(steps)) steps.push('Applying advanced factorization');
      const factorResult = factorWithSteps(result, 'x', {
        preferCompleteFactorization: true,
        extractCommonFactors: true,
        simplifyCoefficients: true,
      });
      if (factorResult && factorResult.ast) {
        result = factorResult.ast;
        if (Array.isArray(steps) && Array.isArray(factorResult.steps)) {
          factorResult.steps.forEach(s => factorSteps.push(s));
          steps.push(['Advanced factorization applied', factorSteps]);
        } else if (Array.isArray(steps)) {
          steps.push('Advanced factorization applied');
        }
      }
    }

    // Step 3: Final pass with expand: false (middle-simplify)
    // factor: true の場合は expand: false を強制
    const finalExpand = opts.factor ? false : opts.expand;
    const finalSteps: StepTree[] = [];
    if (Array.isArray(steps))
      steps.push([`Final pass with expand: ${finalExpand}`, stepsAstToLatex(result)]);
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
      finalSteps
    );
    if (Array.isArray(steps) && finalSteps.length > 0)
      steps.push(['Unified simplification complete', finalSteps]);

    return result;
  } catch (error) {
    // Fallback: return original node if simplification fails
    if (Array.isArray(steps)) steps.push('Unified simplification failed, returning original node');
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
): ASTNode {
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
    return simplifyPolynomialFraction(factoredNumerator, factoredDenominator);
  } catch (error) {
    // Fallback to basic fraction without factorization
    return simplifyPolynomialFraction(numerator, denominator);
  }
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
function deepFractionSimplify(node: ASTNode, steps?: StepTree[]): ASTNode {
  if (node.type === 'Fraction') {
    const fracSteps: StepTree[] = [];
    if (Array.isArray(fracSteps))
      fracSteps.push('Applying polynomial fraction reduction (deep)', stepsAstToLatex(node));
    const reduced = simplifyPolynomialFractionWithFactorization(
      deepFractionSimplify(node.numerator, fracSteps),
      deepFractionSimplify(node.denominator, fracSteps)
    );
    if (
      JSON.stringify(reduced) !==
      JSON.stringify({ type: 'Fraction', numerator: node.numerator, denominator: node.denominator })
    ) {
      if (Array.isArray(fracSteps))
        fracSteps.push('Polynomial fraction reduction applied (deep)', stepsAstToLatex(reduced));
      if (Array.isArray(steps)) steps.push(fracSteps);
      return reduced;
    }
    // reductionなしでも再帰結果を返す
    if (Array.isArray(steps)) steps.push(fracSteps);
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
  steps?: StepTree[],
  maxIterations: number = 5
): ASTNode {
  let current = node;
  let prevStr = JSON.stringify(current);
  let changed = false;
  let count = 1;
  if (Array.isArray(steps)) steps.push('--- overlapSimplify start ---');
  while (count <= maxIterations) {
    const passSteps: StepTree[] = [];
    if (Array.isArray(passSteps)) passSteps.push(`overlapSimplify pass #${count}`);
    // 1. 普通の簡約
    let result = deepFractionSimplify(current, passSteps);
    result = simplify(result, options, passSteps);
    // 2. AST全体の分数ノードを再帰的に約分・因数分解
    const nextStr = JSON.stringify(result);
    if (Array.isArray(steps)) steps.push(passSteps);
    if (nextStr === prevStr) {
      if (Array.isArray(steps)) steps.push('No further change detected, stopping.');
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
  if (Array.isArray(steps)) steps.push('--- overlapSimplify end ---');
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
