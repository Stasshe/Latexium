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
 * Factorization with detailed steps
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
    // --- 累乗の底が掛け算の場合の分解 ---
    // (A)^n の形でAが多項式（単項式でない）なら、Aを因数分解し、各因数にn乗を分配して再構成
    if (
      currentAst &&
      currentAst.type === 'BinaryExpression' &&
      currentAst.operator === '^' &&
      currentAst.right &&
      currentAst.right.type === 'NumberLiteral' &&
      Number.isInteger(currentAst.right.value) &&
      currentAst.right.value >= 2
    ) {
      const n = currentAst.right.value;
      const base = currentAst.left;
      // baseが単項式（Identifier, NumberLiteral, Fraction, 単純な累乗）なら何もしない
      const isMonomial =
        base.type === 'Identifier' ||
        base.type === 'NumberLiteral' ||
        base.type === 'Fraction' ||
        (base.type === 'BinaryExpression' && base.operator === '^');
      if (!isMonomial) {
        // まず底を因数分解
        const baseFact = factorWithSteps(base, variable, preferences, steps);
        // baseFactが積なら因数を列挙、そうでなければ1因数扱い
        function collectFactors(expr: ASTNode): ASTNode[] {
          if (expr.type === 'BinaryExpression' && expr.operator === '*') {
            return [...collectFactors(expr.left), ...collectFactors(expr.right)];
          } else {
            return [expr];
          }
        }
        const factors: ASTNode[] = collectFactors(baseFact.ast);
        if (factors.length > 1) {
          factors.map(f => steps.push(`Factor: ${stepsAstToLatex(f)}`));
          changed = true;
        }
        // 各因数を n 乗して掛け合わせる
        let newAst: ASTNode | undefined = undefined;
        for (const factor of factors) {
          const powNode: ASTNode = {
            type: 'BinaryExpression',
            operator: '^',
            left: factor,
            right: { type: 'NumberLiteral', value: n },
          };
          newAst = newAst
            ? {
                type: 'BinaryExpression',
                operator: '*',
                left: newAst,
                right: powNode,
              }
            : powNode;
        }
        steps.push(`Factored base and distributed power: (A)^n → (F1^n)*(F2^n)*...`);
        if (newAst) {
          currentAst = newAst;
          changed = true;
        }
      }
    }
    let prevAstStr = JSON.stringify(currentAst);
    let count = 1;
    // Recursively apply factorization until no further changes
    while (true) {
      const result = factorizationEngine.factor(currentAst, variable, preferences);
      const nextAstStr = JSON.stringify(result.ast);
      // stepsはresult.stepsに完全依存
      steps.push(...result.steps);
      if (nextAstStr === prevAstStr || !result.canContinue) {
        changed = changed || result.changed;
        currentAst = result.ast;
        break;
      } else {
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
