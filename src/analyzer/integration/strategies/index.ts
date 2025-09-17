/**
 * Integration Strategy Interface
 * Base interface for all integration strategies
 */

import { ASTNode } from '../../../types';
import { IntegrationContext, IntegrationResult } from '../index';

/**
 * Base interface for integration strategies
 */
export interface IntegrationStrategy {
  /** Strategy name for identification */
  readonly name: string;

  /** Priority level (lower = higher priority) */
  readonly priority: number;

  /**
   * Check if this strategy can handle the given node
   */
  canHandle(node: ASTNode, context: IntegrationContext): boolean;

  /**
   * Attempt to integrate the node using this strategy
   */
  integrate(node: ASTNode, context: IntegrationContext): IntegrationResult;
}

/**
 * Calculate complexity score for an AST node
 */
export function calculateComplexity(node: ASTNode): number {
  switch (node.type) {
    case 'NumberLiteral':
      return 0;
    case 'Identifier':
      return 0.5;
    case 'BinaryExpression':
      return 1 + calculateComplexity(node.left) + calculateComplexity(node.right);
    case 'UnaryExpression':
      return 0.5 + calculateComplexity(node.operand);
    case 'FunctionCall':
      return 1 + node.args.reduce((sum, arg) => sum + calculateComplexity(arg), 0);
    case 'Fraction':
      return 1.5 + calculateComplexity(node.numerator) + calculateComplexity(node.denominator);
    default:
      return 2;
  }
}

/**
 * Check if a node is constant with respect to a variable
 */
export function isConstant(node: ASTNode, variable: string): boolean {
  switch (node.type) {
    case 'NumberLiteral':
      return true;
    case 'Identifier':
      return node.name !== variable || node.scope !== 'free';
    case 'BinaryExpression':
      return isConstant(node.left, variable) && isConstant(node.right, variable);
    case 'UnaryExpression':
      return isConstant(node.operand, variable);
    case 'FunctionCall':
      return node.args.every(arg => isConstant(arg, variable));
    case 'Fraction':
      return isConstant(node.numerator, variable) && isConstant(node.denominator, variable);
    default:
      return false;
  }
}

/**
 * Check if node contains the integration variable
 */
export function containsVariable(node: ASTNode, variable: string): boolean {
  return !isConstant(node, variable);
}

/**
 * Create a clone of an AST node with variable scope
 */
export function createVariableNode(variable: string): ASTNode {
  return {
    type: 'Identifier',
    name: variable,
    scope: 'free',
    uniqueId: `free_${variable}`,
  };
}

/**
 * Create a number literal node
 */
export function createNumberNode(value: number): ASTNode {
  return {
    type: 'NumberLiteral',
    value,
  };
}

/**
 * Create a binary expression node
 */
export function createBinaryNode(
  operator: '+' | '-' | '*' | '/' | '^',
  left: ASTNode,
  right: ASTNode
): ASTNode {
  return {
    type: 'BinaryExpression',
    operator,
    left,
    right,
  };
}

/**
 * Create a function call node
 */
export function createFunctionNode(name: string, args: ASTNode[]): ASTNode {
  return {
    type: 'FunctionCall',
    name,
    args,
  };
}

/**
 * Create a fraction node
 */
export function createFractionNode(numerator: ASTNode, denominator: ASTNode): ASTNode {
  return {
    type: 'Fraction',
    numerator,
    denominator,
  };
}
