/**
 * Advanced Factorization System
 * Main entry point for the new strategy-based factorization system
 */

import { FactorizationEngine, FactorizationPreferences } from './framework';
import {
  CommonFactorStrategy,
  DifferenceOfSquaresStrategy,
  QuadraticFactorizationStrategy,
  GroupingStrategy,
  CubicFactorizationStrategy,
} from './strategies';
import { ASTNode } from '../../types';

// Create and configure the factorization engine
const factorizationEngine = new FactorizationEngine();

// Register all strategies
factorizationEngine.registerStrategy(new CommonFactorStrategy());
factorizationEngine.registerStrategy(new DifferenceOfSquaresStrategy());
factorizationEngine.registerStrategy(new QuadraticFactorizationStrategy());
factorizationEngine.registerStrategy(new GroupingStrategy());
factorizationEngine.registerStrategy(new CubicFactorizationStrategy());

/**
 * Main factorization function - replaces the old factorExpression function
 */
export function advancedFactor(
  node: ASTNode,
  variable: string = 'x',
  preferences: Partial<FactorizationPreferences> = {}
): ASTNode {
  const result = factorizationEngine.factor(node, variable, preferences);
  return result.ast;
}

/**
 * Factorization with detailed steps
 */
export function factorWithSteps(
  node: ASTNode,
  variable: string = 'x',
  preferences: Partial<FactorizationPreferences> = {}
): { ast: ASTNode; steps: string[]; changed: boolean } {
  const result = factorizationEngine.factor(node, variable, preferences);
  return {
    ast: result.ast,
    steps: result.steps,
    changed: result.changed,
  };
}

// Export the engine for advanced usage
export { factorizationEngine };

// Export framework types for external use
export type {
  FactorizationStrategy,
  FactorizationContext,
  FactorizationResult,
  FactorizationPreferences,
  PolynomialInfo,
} from './framework';

// Export utility classes
export { PolynomialAnalyzer, ASTBuilder } from './framework';
