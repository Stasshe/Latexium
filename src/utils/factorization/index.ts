/**
 * Advanced Factorization System
 * Main entry point for the new strategy-based factorization system
 */

import { FactorizationEngine, FactorizationPreferences } from './framework';
import { PatternRecognitionStrategy } from './pattern-recognition/strategy';
import {
  CommonFactorStrategy,
  DifferenceOfSquaresStrategy,
  GroupingStrategy,
  BerlekampZassenhausStrategy,
  LLLFactorizationStrategy,
  PowerSubstitutionStrategy,
  PerfectPowerStrategy,
} from './strategies';

import { ASTNode, StepTree } from '@/types';

// Create and configure the factorization engine
const factorizationEngine = new FactorizationEngine();

// Register essential strategies only (per factor.md)
try {
  factorizationEngine.registerStrategy(new PatternRecognitionStrategy());
  factorizationEngine.registerStrategy(new PerfectPowerStrategy());
  factorizationEngine.registerStrategy(new CommonFactorStrategy());
  factorizationEngine.registerStrategy(new DifferenceOfSquaresStrategy());
  factorizationEngine.registerStrategy(new GroupingStrategy());
  factorizationEngine.registerStrategy(new LLLFactorizationStrategy());
  factorizationEngine.registerStrategy(new BerlekampZassenhausStrategy());
  factorizationEngine.registerStrategy(new PowerSubstitutionStrategy());
} catch (strategyError) {
  throw new Error(
    `Strategy registration failed: ${strategyError instanceof Error ? strategyError.message : 'Unknown error'}`
  );
}

// /**
//  * Main factorization function - replaces the old factorExpression function
//  */
// export function advancedFactor(
//   node: ASTNode,
//   variable: string = 'x',
//   preferences: Partial<FactorizationPreferences> = {}
// ): ASTNode {
//   const result = factorizationEngine.factor(node, variable, preferences);
//   return result.ast;
// }

/**
 * Factorization with detailed steps
 */
export function factorWithSteps(
  node: ASTNode,
  variable: string = 'x',
  preferences: Partial<FactorizationPreferences> = {}
): { ast: ASTNode; steps: StepTree[]; changed: boolean } {
  try {
    let currentAst = node;
    let changed = false;
    const steps: StepTree[] = [];
    let prevAstStr = JSON.stringify(currentAst);
    let count = 1;
    // Recursively apply factorization until no further changes
    // frameworkのrecursivelyFactorSubexpressions->subexpressions
    // これ -> ルートレベルでの最終チェク因数分解ループ
    while (true) {
      const attemptSteps: StepTree[] = [];
      attemptSteps.push(`Factorization attempt #${count}`);
      const result = factorizationEngine.factor(currentAst, variable, preferences);
      // Add strategy names used in this attempt to steps
      if (result.steps && Array.isArray(result.steps)) {
        for (const step of result.steps) {
          if (
            step &&
            typeof step === 'object' &&
            'strategy' in step &&
            typeof step.strategy === 'string'
          ) {
            attemptSteps.push(`Used strategy: ${step.strategy}`);
          }
        }
      }
      attemptSteps.push(...result.steps);
      const nextAstStr = JSON.stringify(result.ast);
      if (nextAstStr === prevAstStr) {
        // No further change, do not push this attempt's steps
        changed = changed || result.changed;
        currentAst = result.ast;
        break;
      } else {
        // Only push steps if there was a change
        steps.push(...attemptSteps);
        changed = true;
        currentAst = result.ast;
        prevAstStr = nextAstStr;
        count++;
      }
    }
    return {
      ast: currentAst,
      steps,
      changed,
    };
  } catch (error) {
    throw new Error(
      `Factorization engine error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
