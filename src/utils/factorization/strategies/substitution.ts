/**
 * Substitution Strategy for Factorization
 * Placeholder implementation - not yet implemented
 */

import { ASTNode } from '../../../types';
import { FactorizationStrategy, FactorizationContext, FactorizationResult } from '../framework';

export class SubstitutionStrategy implements FactorizationStrategy {
  name = 'Substitution';
  description = 'Factor expressions using substitution (not yet implemented)';
  priority = 20;

  canApply(node: ASTNode, context: FactorizationContext): boolean {
    // Not yet implemented
    return false;
  }

  apply(node: ASTNode, context: FactorizationContext): FactorizationResult {
    // Not yet implemented
    return {
      success: false,
      ast: node,
      changed: false,
      steps: ['Substitution strategy not yet implemented'],
      strategyUsed: this.name,
      canContinue: false,
    };
  }
}
