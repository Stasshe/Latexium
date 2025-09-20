/**
 * Configuration constants for Latexium
 */

// Maximum power for automatic expansion
export const MAX_EXPANSION_POWER = 6;

export const IS_STEPS_INCLUDE_LATEX = true;

export const FACTORIZATION = {
  applyFactorPlusOperate: false,
};

// Default simplification settings
export const DEFAULT_SIMPLIFY_OPTIONS = {
  expandPowers: false,
  combineLikeTerms: true,
  factorCommonFactors: false,
};

// Common function names (treated as functions rather than variables)
export const COMMON_FUNCTION_NAMES = new Set(['f', 'g', 'h', 'F', 'G', 'H']);
