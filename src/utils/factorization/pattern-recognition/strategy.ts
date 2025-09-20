import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

import { PatternRecognitionEngine } from './index';

import { ASTNode } from '@/types';

/**
 * Pattern Recognition as a FactorizationStrategy
 */
export class PatternRecognitionStrategy implements FactorizationStrategy {
  name = 'pattern-recognition';
  description = 'Pattern-based factorization using O(n) pattern recognition.';
  priority = 100; // High priority to try pattern recognition early

  private engine: PatternRecognitionEngine;

  constructor() {
    this.engine = new PatternRecognitionEngine();
  }

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // Try to match any pattern
    return this.engine.findPattern(node) !== null;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    const pattern = this.engine.findPattern(node);
    if (!pattern) {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: ['PatternRecognitionStrategy: No matching pattern found.'],
        strategyUsed: this.name,
        canContinue: true,
      };
    }
    const factored = pattern.factor(node);
    if (factored && JSON.stringify(factored) !== JSON.stringify(node)) {
      return {
        success: true,
        ast: factored,
        changed: true,
        steps: [`PatternRecognitionStrategy: Applied pattern '${pattern.name}'.`],
        strategyUsed: this.name,
        canContinue: true,
      };
    } else {
      return {
        success: false,
        ast: node,
        changed: false,
        steps: [`PatternRecognitionStrategy: Pattern '${pattern.name}' did not change AST.`],
        strategyUsed: this.name,
        canContinue: true,
      };
    }
  }
}
