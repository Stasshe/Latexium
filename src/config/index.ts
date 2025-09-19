/**
 * Configuration constants for Latexium
 */

// Maximum power for automatic expansion
export const MAX_EXPANSION_POWER = 6;

// Precision for numerical calculations
export const NUMERICAL_PRECISION = 10;

// Default simplification settings
export const DEFAULT_SIMPLIFY_OPTIONS = {
  expandPowers: false,
  combineLikeTerms: true,
  factorCommonFactors: false,
};

// Common function names (treated as functions rather than variables)
export const COMMON_FUNCTION_NAMES = new Set(['f', 'g', 'h', 'F', 'G', 'H']);
