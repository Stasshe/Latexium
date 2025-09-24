/**
 * Advanced Factorization System
 * Main entry point for the new strategy-based factorization system
 */

import { FactorizationEngine, FactorizationPreferences } from './framework';
import {
  CommonFactorStrategy,
  DifferenceOfSquaresStrategy,
  GroupingStrategy,
  BerlekampZassenhausStrategy,
  LLLFactorizationStrategy,
  PowerSubstitutionStrategy,
  PerfectPowerStrategy,
} from './strategies';
// import { FACTORIZATION } from '@/config';
import { stepsAstToLatex } from '../ast';
import { CyclotomicPattern } from './strategies/cyclotomic';
import { QuadraticPattern } from './strategies/quadratic-pattern';

import { config } from '@/config';
import { ASTNode, StepTree } from '@/types';

// Create and configure the factorization engine
const factorizationEngine = new FactorizationEngine();

// Register essential strategies only (per factor.md)

try {
  // Register pattern strategies (priority order)
  factorizationEngine.registerStrategy(new CommonFactorStrategy());
  factorizationEngine.registerStrategy(new QuadraticPattern());
  factorizationEngine.registerStrategy(new CyclotomicPattern());
  // Register main strategies
  factorizationEngine.registerStrategy(new PerfectPowerStrategy());
  factorizationEngine.registerStrategy(new CommonFactorStrategy());
  factorizationEngine.registerStrategy(new DifferenceOfSquaresStrategy());
  factorizationEngine.registerStrategy(new GroupingStrategy());
  factorizationEngine.registerStrategy(new PowerSubstitutionStrategy());
  if (config.FACTORIZATION.useLLL) {
    factorizationEngine.registerStrategy(new LLLFactorizationStrategy());
  }
  if (config.FACTORIZATION.useBerlekampZassenhaus) {
    factorizationEngine.registerStrategy(new BerlekampZassenhausStrategy());
  }
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
 * Factorization with detailed steps (refactored)
 */
export function factorWithSteps(
  node: ASTNode,
  variable: string = 'x',
  preferences: Partial<FactorizationPreferences> = {},
  steps: StepTree[] = []
): { ast: ASTNode; steps: StepTree[]; changed: boolean } {
  try {
    let currentAst = node;
    let changed = false;

    // Helper function to collect factors from a product expression
    function collectFactors(expr: ASTNode): ASTNode[] {
      if (expr.type === 'BinaryExpression' && expr.operator === '*') {
        return [...collectFactors(expr.left), ...collectFactors(expr.right)];
      } else {
        return [expr];
      }
    }

    // Step 1: Apply factorization engine once
    const initialResult = factorizationEngine.factor(currentAst, variable, preferences);
    steps.push(...initialResult.steps);
    currentAst = initialResult.ast;
    changed = initialResult.changed;

    // Step 2: Collect factors from the resulting AST
    const factors = collectFactors(currentAst);

    // Step 3: Process each factor individually
    const processedFactors: ASTNode[] = factors.flatMap((factor): ASTNode[] => {
      if (
        factor.type === 'BinaryExpression' &&
        factor.operator === '^' &&
        factor.right.type === 'NumberLiteral' &&
        Number.isInteger(factor.right.value) &&
        factor.right.value >= 2
      ) {
        // Handle powers: factor.base^n
        const base = factor.left;
        const exponent = factor.right.value;
        const baseResult = factorWithSteps(base, variable, preferences, steps);
        const baseFactors = collectFactors(baseResult.ast);

        // Reconstruct the powered factors
        const poweredFactors: ASTNode[] = baseFactors.map(baseFactor => ({
          type: 'BinaryExpression',
          operator: '^',
          left: baseFactor,
          right: { type: 'NumberLiteral', value: exponent },
        }));

        steps.push(`Factored base and distributed power: ${stepsAstToLatex(factor)}`);
        changed = changed || baseResult.changed;
        return poweredFactors;
      } else {
        // Recursively factorize the individual factor
        const result = factorizationEngine.factor(factor, variable, preferences);
        steps.push(...result.steps);
        changed = changed || result.changed;
        return [result.ast];
      }
    });

    // Step 4: Reconstruct the final AST as a product of all processed factors
    const finalAst = processedFactors.reduce<ASTNode | null>((acc, factor) => {
      return acc
        ? {
            type: 'BinaryExpression',
            operator: '*',
            left: acc,
            right: factor,
          }
        : factor;
    }, null);

    return {
      ast: finalAst || currentAst,
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
