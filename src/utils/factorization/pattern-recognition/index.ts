/**
 * Pattern Recognition Module for Factorization
 * Implements O(n) linear time pattern recognition for common factorization patterns
 */

export { ConcreteCommonFactorPattern, ConcreteDifferenceOfSquaresPattern } from './implementations';

import { FACTORIZATION_PATTERNS, FactorizationPattern } from './implementations';

import { ASTNode } from '@/types';

/**
 * Pattern recognition engine
 * Applies patterns in O(n) linear time
 */
export class PatternRecognitionEngine {
  private patterns: FactorizationPattern[];

  constructor() {
    this.patterns = FACTORIZATION_PATTERNS;
  }

  /**
   * Find the first matching pattern for an expression
   */
  findPattern(node: ASTNode): FactorizationPattern | null {
    for (const pattern of this.patterns) {
      if (pattern.matches(node)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Apply factorization using the best matching pattern
   */
  applyPattern(node: ASTNode): ASTNode | null {
    const pattern = this.findPattern(node);
    if (pattern) {
      return pattern.factor(node);
    }
    return null;
  }
}
