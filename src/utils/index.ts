/**
 * Utilities Index
 * Exports all utility functions
 */

export * from './ast';
export * from './_scope';
export * from './validation';
export * from './factorization';
export * from './factorization/index'; // New advanced factorization system
export * from './distribution';
export * from './simplify/commutative';
export * from './simplify/simplification';
export * from './variables';
export { simplify } from './unified-simplify';
export type { SimplifyOptions } from './unified-simplify';

// Export legacy compatibility function
export { simplifyAST } from './ast';
