/**
 * Scope Resolution Utilities
 * Handles variable scope resolution for nested integrals, sums, and products
 */

import { ASTNode, Identifier } from '../types';

/**
 * Generate unique ID for bound variables
 */
export function generateUniqueId(
  variableName: string,
  bindingDepth: number,
  bindingContext: string
): string {
  return `bound_${variableName}_${bindingDepth}_${bindingContext}`;
}

/**
 * Generate unique ID for free variables
 */
export function generateFreeVariableId(variableName: string): string {
  return `free_${variableName}`;
}

/**
 * Resolve scopes in AST (2-phase process)
 * Phase 1: Build complete AST
 * Phase 2: Assign unique IDs and scope information
 */
export function resolveScopeInAST(node: ASTNode, bindingStack: BindingContext[] = []): ASTNode {
  switch (node.type) {
    case 'NumberLiteral':
      return node;

    case 'Identifier':
      return resolveIdentifierScope(node, bindingStack);

    case 'BinaryExpression':
      return {
        ...node,
        left: resolveScopeInAST(node.left, bindingStack),
        right: resolveScopeInAST(node.right, bindingStack),
      };

    case 'UnaryExpression':
      return {
        ...node,
        operand: resolveScopeInAST(node.operand, bindingStack),
      };

    case 'FunctionCall':
      return {
        ...node,
        args: node.args.map(arg => resolveScopeInAST(arg, bindingStack)),
      };

    case 'Fraction':
      return {
        ...node,
        numerator: resolveScopeInAST(node.numerator, bindingStack),
        denominator: resolveScopeInAST(node.denominator, bindingStack),
      };

    case 'Integral':
      return resolveIntegralScope(node, bindingStack);

    case 'Sum':
      return resolveSumScope(node, bindingStack);

    case 'Product':
      return resolveProductScope(node, bindingStack);

    default:
      return node;
  }
}

interface BindingContext {
  variable: string;
  uniqueId: string;
  bindingDepth: number;
  bindingType: 'integral' | 'sum' | 'product';
}

function resolveIdentifierScope(node: Identifier, bindingStack: BindingContext[]): Identifier {
  // Check if this identifier is bound by any of the binding contexts
  for (let i = bindingStack.length - 1; i >= 0; i--) {
    const context = bindingStack[i];
    if (context && context.variable === node.name) {
      return {
        ...node,
        scope: 'bound',
        bindingDepth: context.bindingDepth,
        bindingContext: context.bindingType,
        uniqueId: context.uniqueId,
      };
    }
  }

  // Free variable
  return {
    ...node,
    scope: 'free',
    uniqueId: generateFreeVariableId(node.name),
  };
}

function resolveIntegralScope(
  node: {
    type: 'Integral';
    variable: string;
    integrand: ASTNode;
    lowerBound?: ASTNode;
    upperBound?: ASTNode;
  },
  bindingStack: BindingContext[]
): typeof node {
  const newBindingDepth = bindingStack.length + 1;
  const uniqueId = generateUniqueId(node.variable, newBindingDepth, 'integral');

  const newBinding: BindingContext = {
    variable: node.variable,
    uniqueId,
    bindingDepth: newBindingDepth,
    bindingType: 'integral',
  };

  const newBindingStack = [...bindingStack, newBinding];

  const result: typeof node = {
    ...node,
    integrand: resolveScopeInAST(node.integrand, newBindingStack),
  };

  if (node.lowerBound !== undefined) {
    result.lowerBound = resolveScopeInAST(node.lowerBound, bindingStack);
  }

  if (node.upperBound !== undefined) {
    result.upperBound = resolveScopeInAST(node.upperBound, bindingStack);
  }

  return result;
}

function resolveSumScope(
  node: {
    type: 'Sum';
    variable: string;
    expression: ASTNode;
    lowerBound: ASTNode;
    upperBound: ASTNode;
  },
  bindingStack: BindingContext[]
): typeof node {
  const newBindingDepth = bindingStack.length + 1;
  const uniqueId = generateUniqueId(node.variable, newBindingDepth, 'sum');

  const newBinding: BindingContext = {
    variable: node.variable,
    uniqueId,
    bindingDepth: newBindingDepth,
    bindingType: 'sum',
  };

  const newBindingStack = [...bindingStack, newBinding];

  return {
    ...node,
    expression: resolveScopeInAST(node.expression, newBindingStack),
    lowerBound: resolveScopeInAST(node.lowerBound, bindingStack),
    upperBound: resolveScopeInAST(node.upperBound, bindingStack),
  };
}

function resolveProductScope(
  node: {
    type: 'Product';
    variable: string;
    expression: ASTNode;
    lowerBound: ASTNode;
    upperBound: ASTNode;
  },
  bindingStack: BindingContext[]
): typeof node {
  const newBindingDepth = bindingStack.length + 1;
  const uniqueId = generateUniqueId(node.variable, newBindingDepth, 'product');

  const newBinding: BindingContext = {
    variable: node.variable,
    uniqueId,
    bindingDepth: newBindingDepth,
    bindingType: 'product',
  };

  const newBindingStack = [...bindingStack, newBinding];

  return {
    ...node,
    expression: resolveScopeInAST(node.expression, newBindingStack),
    lowerBound: resolveScopeInAST(node.lowerBound, bindingStack),
    upperBound: resolveScopeInAST(node.upperBound, bindingStack),
  };
}
