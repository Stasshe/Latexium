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

  if (term.type === 'BinaryExpression') {
    if (term.operator === '*') {
      // Recursively extract all numeric coefficients from nested multiplications
      const { coefficient: leftCoeff, variablePart: leftVar } = extractCoefficientAndVariable(
        term.left
      );
      const { coefficient: rightCoeff, variablePart: rightVar } = extractCoefficientAndVariable(
        term.right
      );

      const totalCoeff = leftCoeff * rightCoeff;

      // Combine variable parts
      let canonicalVar: ASTNode;
      if (leftVar && rightVar) {
        canonicalVar = canonicalizeVariablePart({
          type: 'BinaryExpression',
          operator: '*',
          left: leftVar,
          right: rightVar,
        });
      } else if (leftVar) {
        canonicalVar = canonicalizeVariablePart(leftVar);
      } else if (rightVar) {
        canonicalVar = canonicalizeVariablePart(rightVar);
      } else {
        canonicalVar = { type: 'NumberLiteral', value: 1 };
      }

      return { coefficient: totalCoeff, canonicalForm: canonicalVar };
    }

    if (term.operator === '^') {
      // Handle power expressions like x^2, x^3, etc.
      return { coefficient: 1, canonicalForm: term };
    }

    // For other binary expressions, treat as a single unit
    return { coefficient: 1, canonicalForm: term };
  }

  return { coefficient: 1, canonicalForm: term };
}

/**
 * Helper function to extract coefficient and variable part from a node
 */
function extractCoefficientAndVariable(node: ASTNode): {
  coefficient: number;
  variablePart: ASTNode | null;
} {
  if (node.type === 'NumberLiteral') {
    return { coefficient: node.value, variablePart: null };
  }

  if (node.type === 'Identifier') {
    return { coefficient: 1, variablePart: node };
  }

  if (node.type === 'BinaryExpression') {
    if (node.operator === '*') {
      const { coefficient: leftCoeff, variablePart: leftVar } = extractCoefficientAndVariable(
        node.left
      );
      const { coefficient: rightCoeff, variablePart: rightVar } = extractCoefficientAndVariable(
        node.right
      );

      const totalCoeff = leftCoeff * rightCoeff;

      if (leftVar && rightVar) {
        return {
          coefficient: totalCoeff,
          variablePart: {
            type: 'BinaryExpression',
            operator: '*',
            left: leftVar,
            right: rightVar,
          },
        };
      } else if (leftVar) {
        return { coefficient: totalCoeff, variablePart: leftVar };
      } else if (rightVar) {
        return { coefficient: totalCoeff, variablePart: rightVar };
      } else {
        return { coefficient: totalCoeff, variablePart: null };
      }
    }

    // For non-multiplication expressions, treat as variable part
    return { coefficient: 1, variablePart: node };
  }

  return { coefficient: 1, variablePart: node };
}

/**
 * Create canonical form for variable expressions
 * Examples: xy and yx both become xy (preserve original order if possible)
 */
function canonicalizeVariablePart(node: ASTNode): ASTNode {
  if (node.type === 'BinaryExpression') {
    if (node.operator === '*') {
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

    if (node.operator === '^') {
      // Handle power expressions - they are already in canonical form
      return node;
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

    // Create a more robust key for grouping terms
    const key = createTermKey(canonicalForm);

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

/**
 * Create a stable key for grouping like terms
 */
function createTermKey(node: ASTNode): string {
  // Create a normalized representation for comparison, ignoring metadata
  function normalize(n: ASTNode): string {
    switch (n.type) {
      case 'Identifier':
        // Ignore scope and uniqueId for grouping purposes
        return `id:${n.name}`;
      case 'NumberLiteral':
        return `num:${n.value}`;
      case 'BinaryExpression':
        if (n.operator === '*') {
          // For multiplication, create a sorted key to handle commutative properties
          const left = normalize(n.left);
          const right = normalize(n.right);
          return `mul:[${[left, right].sort().join(',')}]`;
        } else if (n.operator === '^') {
          return `pow:${normalize(n.left)}^${normalize(n.right)}`;
        } else {
          return `bin:${n.operator}:${normalize(n.left)}:${normalize(n.right)}`;
        }
      default: {
        // For other types, create a simplified representation
        const simplified = JSON.parse(
          JSON.stringify(n, (key, value) => {
            // Remove metadata that shouldn't affect grouping
            if (key === 'scope' || key === 'uniqueId') {
              return undefined;
            }
            return value;
          })
        );
        return JSON.stringify(simplified);
      }
    }
  }

  return normalize(node);
}
