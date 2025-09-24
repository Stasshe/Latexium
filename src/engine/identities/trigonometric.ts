/**
 * Trigonometric Identities and Pattern Matching for Simplification
 * Provides pattern-based simplification for trigonometric expressions (e.g., sin^2 x + cos^2 x = 1)
 */
import type { ASTNode } from '@/types';

/**
 * Try to apply trigonometric identities to the given AST node.
 * Returns a simplified node if a match is found, otherwise returns the original node.
 */
export function applyTrigonometricIdentities(node: ASTNode): ASTNode {
  // sin^2(x) + cos^2(x) = 1
  if (isSin2PlusCos2(node)) {
    return { type: 'NumberLiteral', value: 1 };
  }
  // Add more identities here as needed
  return node;
}

/**
 * Detects sin^2(x) + cos^2(x) pattern
 */
function isSin2PlusCos2(node: ASTNode): boolean {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') return false;
  const { left, right } = node;
  return (
    (isSinSquared(left) && isCosSquared(right) && sameArg(left, right)) ||
    (isSinSquared(right) && isCosSquared(left) && sameArg(left, right))
  );
}

function isSinSquared(node: ASTNode): boolean {
  // sin^2(x) = (sin(x))^2
  return (
    node.type === 'BinaryExpression' &&
    node.operator === '^' &&
    node.left.type === 'FunctionCall' &&
    node.left.name === 'sin' &&
    node.right.type === 'NumberLiteral' &&
    node.right.value === 2
  );
}

function isCosSquared(node: ASTNode): boolean {
  // cos^2(x) = (cos(x))^2
  return (
    node.type === 'BinaryExpression' &&
    node.operator === '^' &&
    node.left.type === 'FunctionCall' &&
    node.left.name === 'cos' &&
    node.right.type === 'NumberLiteral' &&
    node.right.value === 2
  );
}

function sameArg(a: ASTNode, b: ASTNode): boolean {
  // Compare the argument of sin and cos, strictly
  function getArg(n: ASTNode): ASTNode | undefined {
    if (n.type === 'BinaryExpression' && n.left.type === 'FunctionCall') {
      return n.left.args[0];
    }
    return undefined;
  }
  const argA = getArg(a);
  const argB = getArg(b);
  if (!argA || !argB) return false;
  // Strict deep equality (parameter name, structure, etc.)
  return JSON.stringify(argA) === JSON.stringify(argB);
}
