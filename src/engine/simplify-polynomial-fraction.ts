import { stepsAstToLatex } from './ast';
import { areEquivalentExpressions } from './simplify/simplification';

import { ASTNode, StepTree } from '@/types';
/**
 * Basic polynomial fraction simplification (delegated to middle-simplify)
 * This ensures we don't duplicate logic from middle-simplify
 */

// Polynomial fraction reduction using factorization (GCD cancellation)

export function simplifyPolynomialFraction(
  numerator: ASTNode,
  denominator: ASTNode,
  steps?: StepTree[]
): ASTNode {
  // 1. Extract factors as arrays (flattened)
  if (Array.isArray(steps)) steps.push('Start simplifyPolynomialFraction');
  function extractFactors(node: ASTNode): ASTNode[] {
    // Handle multiplication
    if (node.type === 'BinaryExpression' && node.operator === '*') {
      return [...extractFactors(node.left), ...extractFactors(node.right)];
    }
    // Handle powers: (base)^(n) => n copies of base (if n is integer and >= 1)
    if (
      node.type === 'BinaryExpression' &&
      node.operator === '^' &&
      node.right.type === 'NumberLiteral' &&
      Number.isInteger(node.right.value) &&
      node.right.value >= 1
    ) {
      // Expand (base)^n to n copies of base
      const count = node.right.value;
      const baseFactors = extractFactors(node.left);
      let result: ASTNode[] = [];
      for (let i = 0; i < count; ++i) {
        result = result.concat(baseFactors);
      }
      return result;
    }
    return [node];
  }

  let numFactors = extractFactors(numerator);
  let denFactors = extractFactors(denominator);

  // 2. Cancel common factors (by structural or mathematical equivalence)
  const used = new Array(denFactors.length).fill(false);
  numFactors = numFactors.filter(nf => {
    for (let i = 0; i < denFactors.length; ++i) {
      const df = denFactors[i];
      if (!used[i] && df !== undefined && areEquivalentExpressions(nf, df)) {
        used[i] = true;
        if (Array.isArray(steps)) steps.push('Cancel common factor' + stepsAstToLatex(nf));
        return false; // cancel
      }
    }
    return true;
  });
  denFactors = denFactors.filter((_, i) => !used[i]);
  if (Array.isArray(steps)) steps.push(['After cancellation']);

  // 3. Rebuild numerator and denominator
  function buildProduct(factors: ASTNode[]): ASTNode {
    const filtered = factors.filter(f => f !== undefined);
    if (filtered.length === 0) return { type: 'NumberLiteral', value: 1 };
    if (filtered.length === 1) return filtered[0] as ASTNode;
    return filtered.reduce((a, b) => ({
      type: 'BinaryExpression',
      operator: '*',
      left: a,
      right: b,
    }));
  }
  const newNum = buildProduct(numFactors);
  const newDen = buildProduct(denFactors);

  // 4. If denominator is 1, return numerator only
  if (newDen.type === 'NumberLiteral' && newDen.value === 1) {
    if (Array.isArray(steps)) steps.push('Denominator is 1, returning numerator as fraction');
    return {
      type: 'Fraction',
      numerator: newNum,
      denominator: { type: 'NumberLiteral', value: 1 },
    };
  }
  // 5. If numerator is 0, return 0
  if (newNum.type === 'NumberLiteral' && newNum.value === 0) {
    if (Array.isArray(steps)) steps.push('Numerator is 0, returning 0 as fraction');
    return {
      type: 'Fraction',
      numerator: { type: 'NumberLiteral', value: 0 },
      denominator: newDen,
    };
  }
  // 6. If numerator and denominator are unchanged, return the original fraction node
  if (
    JSON.stringify(newNum) === JSON.stringify(numerator) &&
    JSON.stringify(newDen) === JSON.stringify(denominator)
  ) {
    if (Array.isArray(steps)) steps.push('No reduction, returning original fraction');
    return { type: 'Fraction', numerator, denominator };
  }
  // 7. Return reduced fraction
  if (Array.isArray(steps)) steps.push('Reduction complete, returning reduced fraction');
  return { type: 'Fraction', numerator: newNum, denominator: newDen };
}
