/**
 * Variable Detection Utilities
 * Automatically detect free variables in AST for variable inference
 */

import { ASTNode } from '../types';

/**
 * Check if a name represents a mathematical constant
 */
function isMathematicalConstant(name: string): boolean {
  const constants = ['e', 'π', 'pi', 'i', 'I'];
  return constants.includes(name);
}

/**
 * Extract all free variables from AST
 */
export function extractFreeVariables(node: ASTNode): Set<string> {
  const variables = new Set<string>();

  function traverse(node: ASTNode): void {
    switch (node.type) {
      case 'NumberLiteral':
        break;

      case 'Identifier':
        // Only include free variables (not bound variables like integration variables)
        if (node.scope === 'free' || !node.scope) {
          // Skip mathematical constants - handle both π and pi notation
          if (!isMathematicalConstant(node.name)) {
            variables.add(node.name);
          }
        }
        break;

      case 'BinaryExpression':
        traverse(node.left);
        traverse(node.right);
        break;

      case 'UnaryExpression':
        traverse(node.operand);
        break;

      case 'FunctionCall':
        node.args.forEach(arg => traverse(arg));
        break;

      case 'Fraction':
        traverse(node.numerator);
        traverse(node.denominator);
        break;

      case 'Integral':
        // Don't include the integration variable
        traverse(node.integrand);
        if (node.lowerBound) traverse(node.lowerBound);
        if (node.upperBound) traverse(node.upperBound);
        break;

      case 'Sum':
        // Don't include the summation variable
        traverse(node.expression);
        traverse(node.lowerBound);
        traverse(node.upperBound);
        break;

      case 'Product':
        // Don't include the product variable
        traverse(node.expression);
        traverse(node.lowerBound);
        traverse(node.upperBound);
        break;
    }
  }

  traverse(node);
  return variables;
}

/**
 * Infer the most appropriate variable for analysis
 * Priority: x > y > z > t > u > v > w > others alphabetically
 */
export function inferVariable(node: ASTNode): string | null {
  const freeVars = extractFreeVariables(node);

  if (freeVars.size === 0) {
    return null; // No free variables
  }

  if (freeVars.size === 1) {
    const varArray = Array.from(freeVars);
    return varArray[0] || null; // Only one variable, return it
  }

  // Priority order for common mathematical variables
  const priority = ['x', 'y', 'z', 't', 'u', 'v', 'w'];

  for (const varName of priority) {
    if (freeVars.has(varName)) {
      return varName;
    }
  }

  // If no priority variables found, return the first alphabetically
  const sortedVars = Array.from(freeVars).sort();
  return sortedVars[0] || null;
}

/**
 * Get default variable or infer from AST
 */
export function getAnalysisVariable(node: ASTNode, explicitVariable?: string): string {
  if (explicitVariable) {
    return explicitVariable;
  }

  const inferred = inferVariable(node);
  if (inferred) {
    return inferred;
  }

  // Fallback to 'x' if no variables found
  return 'x';
}

/**
 * Validate that specified variable exists in the expression
 */
export function validateVariableExists(node: ASTNode, variable: string): boolean {
  const freeVars = extractFreeVariables(node);
  return freeVars.has(variable);
}
