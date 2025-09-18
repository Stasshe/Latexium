/**
 * Advanced Term Combination and Simplification
 * Handles commutative operations and like term combining
 */

import { ASTNode, BinaryExpression, NumberLiteral, Identifier } from '../types';

/**
 * Check if two multiplication expressions are commutatively equivalent
 * Examples: ab and ba, 2xy and 3yx
 */
export function areCommutativelyEquivalent(left: ASTNode, right: ASTNode): boolean {
  if (left.type !== 'BinaryExpression' || right.type !== 'BinaryExpression') {
    return false;
  }

  const leftExpr = left as BinaryExpression;
  const rightExpr = right as BinaryExpression;

  // Both must be multiplication
  if (leftExpr.operator !== '*' || rightExpr.operator !== '*') {
    return false;
  }

  // Check if operands match in any order
  return (
    (areNodeEquivalent(leftExpr.left, rightExpr.left) &&
      areNodeEquivalent(leftExpr.right, rightExpr.right)) ||
    (areNodeEquivalent(leftExpr.left, rightExpr.right) &&
      areNodeEquivalent(leftExpr.right, rightExpr.left))
  );
}

/**
 * Simple node equivalence check
 */
function areNodeEquivalent(left: ASTNode, right: ASTNode): boolean {
  if (left.type !== right.type) {
    return false;
  }

  switch (left.type) {
    case 'NumberLiteral':
      return left.value === (right as NumberLiteral).value;
    case 'Identifier':
      return left.name === (right as Identifier).name;
    default:
      return false;
  }
}

/**
 * Extract coefficient from a term, considering commutative equivalence
 */
export function extractCommutativeCoefficient(term: ASTNode): {
  coefficient: number;
  canonicalForm: ASTNode;
} {
  if (term.type === 'NumberLiteral') {
    return { coefficient: term.value, canonicalForm: { type: 'NumberLiteral', value: 1 } };
  }

  if (term.type === 'Identifier') {
    return { coefficient: 1, canonicalForm: term };
  }

  if (term.type === 'BinaryExpression' && term.operator === '*') {
    // Check for number * expression patterns
    if (term.left.type === 'NumberLiteral') {
      const canonicalVar = canonicalizeVariablePart(term.right);
      return { coefficient: term.left.value, canonicalForm: canonicalVar };
    }

    if (term.right.type === 'NumberLiteral') {
      const canonicalVar = canonicalizeVariablePart(term.left);
      return { coefficient: term.right.value, canonicalForm: canonicalVar };
    }

    // Variable multiplication - create canonical order
    const canonicalVar = canonicalizeVariablePart(term);
    return { coefficient: 1, canonicalForm: canonicalVar };
  }

  return { coefficient: 1, canonicalForm: term };
}

/**
 * Create canonical form for variable expressions
 * Examples: xy and yx both become xy (preserve original order if possible)
 */
function canonicalizeVariablePart(node: ASTNode): ASTNode {
  if (node.type === 'BinaryExpression' && node.operator === '*') {
    const leftVar = extractVariableName(node.left);
    const rightVar = extractVariableName(node.right);

    if (leftVar && rightVar) {
      // Keep original order unless it's clearly reversed
      // Only swap if right comes before left alphabetically AND it's a single variable
      if (
        rightVar < leftVar &&
        node.right.type === 'Identifier' &&
        node.left.type === 'Identifier'
      ) {
        return {
          type: 'BinaryExpression',
          operator: '*',
          left: node.right,
          right: node.left,
        };
      }
    }
  }

  return node;
}

/**
 * Extract variable name from a node
 */
function extractVariableName(node: ASTNode): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }
  return null;
}

/**
 * Combine like terms considering commutative properties
 */
export function combineCommutativeLikeTerms(
  terms: { term: ASTNode; sign: number }[]
): { term: ASTNode; sign: number }[] {
  const termGroups = new Map<string, { coefficient: number; canonicalForm: ASTNode }>();

  for (const { term, sign } of terms) {
    const { coefficient, canonicalForm } = extractCommutativeCoefficient(term);
    const key = JSON.stringify(canonicalForm);

    if (termGroups.has(key)) {
      const existing = termGroups.get(key)!;
      existing.coefficient += sign * coefficient;
    } else {
      termGroups.set(key, { coefficient: sign * coefficient, canonicalForm });
    }
  }

  const result: { term: ASTNode; sign: number }[] = [];

  for (const { coefficient, canonicalForm } of termGroups.values()) {
    if (coefficient === 0) {
      continue; // Skip zero terms
    }

    let resultTerm: ASTNode;
    let resultSign: number;

    if (coefficient === 1) {
      resultTerm = canonicalForm;
      resultSign = 1;
    } else if (coefficient === -1) {
      resultTerm = canonicalForm;
      resultSign = -1;
    } else if (coefficient > 0) {
      if (canonicalForm.type === 'NumberLiteral' && canonicalForm.value === 1) {
        resultTerm = { type: 'NumberLiteral', value: coefficient };
      } else {
        resultTerm = {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: coefficient },
          right: canonicalForm,
        };
      }
      resultSign = 1;
    } else {
      const absCoeff = Math.abs(coefficient);
      if (canonicalForm.type === 'NumberLiteral' && canonicalForm.value === 1) {
        resultTerm = { type: 'NumberLiteral', value: absCoeff };
      } else {
        resultTerm = {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'NumberLiteral', value: absCoeff },
          right: canonicalForm,
        };
      }
      resultSign = -1;
    }

    result.push({ term: resultTerm, sign: resultSign });
  }

  return result;
}
