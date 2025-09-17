/**
 * Validation Utilities
 * Provides validation functions for reserved words and function arguments
 */

import {
  FUNCTION_ARG_COUNTS,
  RESERVED_CONSTANTS,
  RESERVED_FUNCTIONS,
  RESERVED_SYMBOLS,
} from '../types';

/**
 * Check if a given name is a reserved word
 */
export function isReservedWord(name: string): boolean {
  return RESERVED_CONSTANTS.has(name) || RESERVED_FUNCTIONS.has(name) || RESERVED_SYMBOLS.has(name);
}

/**
 * Get reserved words that are present in the given names
 */
export function getReservedWords(names: string[]): string[] {
  return names.filter(name => isReservedWord(name));
}

/**
 * Validate function argument count
 */
export function validateFunctionArgs(functionName: string, argCount: number): string | null {
  const expectedCount = FUNCTION_ARG_COUNTS[functionName];

  if (expectedCount === undefined) {
    return null; // Unknown function, no validation
  }

  if (argCount !== expectedCount) {
    return `関数 \\${functionName} は${expectedCount}個の引数を期待しますが、${argCount}個指定されました`;
  }

  return null;
}

/**
 * Validate variable names for reserved word conflicts
 */
export function validateVariableNames(names: string[]): string | null {
  const reserved = getReservedWords(names);

  if (reserved.length > 0) {
    return `予約語は変数名として使用できません: ${reserved.join(', ')}`;
  }

  return null;
}
