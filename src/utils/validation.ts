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
    return `Function \\${functionName} expects ${expectedCount} argument(s), but ${argCount} were provided`;
  }

  return null;
}

/**
 * Validate variable names for reserved word conflicts
 */
export function validateVariableNames(names: string[]): string | null {
  const reserved = getReservedWords(names);

  if (reserved.length > 0) {
    return `Reserved words cannot be used as variable names: ${reserved.join(', ')}`;
  }

  return null;
}
