/**
 * Unified Mathematical Simplification System
 * Integrates middle-simplify with advanced factorization patterns
 * Avoids circular dependencies through proper layering
 */

import { ASTNode, Fraction } from '../types';
import { advancedFactor } from './factorization/index';
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
  usePatternRecognition: false,
  factor: false,
};

// Initialize pattern recognition engine
const patternEngine = new PatternRecognitionEngine();

/**
 * Unified simplification function
 * Uses middle-simplify as base, adds factorization capabilities
 */
export function simplify(node: ASTNode, options: SimplifyOptions = {}): ASTNode {
  const opts = { ...DEFAULT_SIMPLIFY_OPTIONS, ...options };

  if (!node) return node;

  try {
    // Step 1: Apply middle-simplify (polynomial simplification without factorization)
    let result = middleSimplify(node, {
      combineLikeTerms: opts.combineLikeTerms,
      expand: opts.expand,
      simplifyFractions: opts.simplifyFractions,
      applyIdentities: opts.applyIdentities,
      convertSqrtToExponential: opts.convertSqrtToExponential,
      advancedExponentialSimplification: opts.advancedExponentialSimplification,
      maxDepth: opts.maxDepth,
    });

    // Step 2: Apply pattern recognition for factorization if enabled
    if (opts.usePatternRecognition) {
      const patternResult = patternEngine.applyPattern(result);
      if (patternResult) {
        result = patternResult;
      }
    }

    // Step 3: Apply advanced factorization if requested
    if (opts.factor) {
      const factored = advancedFactor(result);
      if (factored) {
        result = factored;
      }
    }

    // Step 4: Final pass with expand: false (middle-simplify)
    result = middleSimplify(result, {
      combineLikeTerms: opts.combineLikeTerms,
      expand: false,
      simplifyFractions: opts.simplifyFractions,
      applyIdentities: opts.applyIdentities,
      convertSqrtToExponential: opts.convertSqrtToExponential,
      advancedExponentialSimplification: opts.advancedExponentialSimplification,
      maxDepth: opts.maxDepth,
    });

    return result;
  } catch (error) {
    // Fallback: return original node if simplification fails
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
    // Factor both numerator and denominator using advanced factorization
    const factoredNumerator = advancedFactor(numerator);
    const factoredDenominator = advancedFactor(denominator);

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
export { advancedFactor } from './factorization/index';
