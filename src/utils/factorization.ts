/**
 * Factorization Utilities - Legacy Compatibility Layer
 * Provides backward compatibility while using the new advanced factorization system
 */

import { ASTNode } from '../types';
import { advancedFactor } from './factorization/index';

/**
 * Legacy factorization function for backward compatibility
 * @deprecated Use advancedFactor from ./factorization/index.ts instead
 */
export function factorExpression(node: ASTNode, variable?: string): ASTNode {
  return advancedFactor(node, variable || 'x');
}
