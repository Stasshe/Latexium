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
import { PatternRecognitionEngine } from './pattern-recognition';

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

// Initialize pattern recognition engine
const patternEngine = new PatternRecognitionEngine();

/**
 * Unified simplification function
 * Uses middle-simplify as base, adds factorization capabilities
 */
export function simplify(node: ASTNode, options: SimplifyOptions = {}, steps?: string[]): ASTNode {
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
function simplifyPolynomialFraction(numerator: ASTNode, denominator: ASTNode): Fraction | null {
  // This would delegate to middle-simplify's polynomial fraction logic
  // For now, return null as placeholder
  return null;
}

// Re-export middle-simplify types for convenience
export type { SimplifyOptions as MiddleSimplifyOptions } from './middle-simplify';

/**
 * Direct access to middle-simplify (polynomial-only simplification)
 */
export { simplify as middleSimplify } from './middle-simplify';

/**
 * Direct access to pattern recognition engine
 */
export { PatternRecognitionEngine } from './pattern-recognition';

/**
 * Direct access to advanced factorization
 */
// export { advancedFactor } from './factorization/index';
