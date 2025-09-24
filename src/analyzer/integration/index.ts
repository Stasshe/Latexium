/**
 * Integration Engine Core
 * Main interface for symbolic integration
 */

import { IntegrationStrategy } from './strategies';
import { BasicIntegrationStrategy } from './strategies/basic';
import { IntegrationByPartsStrategy } from './strategies/integration-by-parts';
import { RationalFunctionStrategy } from './strategies/rational';
import { SubstitutionStrategy } from './strategies/substitution';
import { TrigonometricStrategy } from './strategies/trigonometric';

import { ASTNode, StepTree } from '@/types';

/**
 * Integration context for passing state between strategies
 */
export interface IntegrationContext {
  variable: string;
  depth: number;
  maxDepth: number;
  attemptedStrategies: Set<string>;
  simplificationHints?: string[];
}

/**
 * Integration result with metadata
 */
export interface IntegrationResult {
  result: ASTNode | null;
  success: boolean;
  strategy?: string;
  steps: StepTree[];
  complexity: number;
}

/**
 * Main integration engine
 */
export class IntegrationEngine {
  private strategies: IntegrationStrategy[];

  constructor() {
    // Initialize strategies in order of preference
    this.strategies = [
      new BasicIntegrationStrategy(),
      new TrigonometricStrategy(),
      new SubstitutionStrategy(),
      new RationalFunctionStrategy(),
      new IntegrationByPartsStrategy(),
    ];
  }

  /**
   * Integrate an AST node using multiple strategies
   */
  public integrate(node: ASTNode, context: IntegrationContext): IntegrationResult {
    const steps: StepTree[] = [];
    let bestResult: IntegrationResult | null = null;
    let minComplexity = Infinity;

    // Sort strategies by priority (lower number = higher priority)
    const sortedStrategies = [...this.strategies].sort((a, b) => a.priority - b.priority);

    // Try each strategy in priority order
    for (const strategy of sortedStrategies) {
      if (context.attemptedStrategies.has(strategy.name)) {
        continue; // Skip already attempted strategies
      }

      if (!strategy.canHandle(node, context)) {
        continue;
      }

      try {
        steps.push(`Trying ${strategy.name}...`);
        const result = strategy.integrate(node, context);

        if (result.success && result.result) {
          steps.push(`${strategy.name}: Success`);

          // For high-priority strategies, return immediately if successful
          if (strategy.priority <= 2) {
            return {
              ...result,
              steps: [...steps, ...result.steps],
            };
          }

          // For lower-priority strategies, choose the result with lowest complexity
          if (result.complexity < minComplexity) {
            bestResult = result;
            minComplexity = result.complexity;
          }

          // If we found a simple solution, use it immediately
          if (result.complexity <= 1) {
            break;
          }
        } else {
          steps.push(`Attempted ${strategy.name}: Failed - ${result.steps.join('; ')}`);
        }
      } catch (error) {
        steps.push(
          `Attempted ${strategy.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      context.attemptedStrategies.add(strategy.name);
    }

    if (bestResult) {
      return {
        ...bestResult,
        steps: [...steps, ...bestResult.steps],
      };
    }

    return {
      result: null,
      success: false,
      steps: [...steps, 'No suitable integration strategy found'],
      complexity: Infinity,
    };
  }

  /**
   * Integrate with automatic context creation
   */
  public integrateAST(node: ASTNode, variable: string, maxDepth: number = 3): IntegrationResult {
    const context: IntegrationContext = {
      variable,
      depth: 0,
      maxDepth,
      attemptedStrategies: new Set(),
    };

    return this.integrate(node, context);
  }
}

/**
 * Legacy integration function for backward compatibility
 */
export function integrateAST(node: ASTNode, variable: string): ASTNode {
  const engine = new IntegrationEngine();
  const result = engine.integrateAST(node, variable);

  if (result.success && result.result) {
    return result.result;
  }

  throw new Error(result.steps.join('; '));
}
