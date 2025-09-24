/**
 * Configuration constants and runtime config for Latexium
 */

// Default values
const DEFAULTS = {
  MAX_EXPANSION_POWER: 10,
  IS_STEPS_INCLUDE_LATEX: true,
  FACTORIZATION: {
    applyFactorPlusOperate: false,
    useLLL: false,
    useBerlekampZassenhaus: false,
  },
  DEFAULT_SIMPLIFY_OPTIONS: {
    expandPowers: false,
    combineLikeTerms: true,
    factorCommonFactors: false,
  },
  COMMON_FUNCTION_NAMES: ['f', 'g', 'h', 'F', 'G', 'H'],
};

// Mutable config object (exported)
export const config = {
  MAX_EXPANSION_POWER: DEFAULTS.MAX_EXPANSION_POWER,
  IS_STEPS_INCLUDE_LATEX: DEFAULTS.IS_STEPS_INCLUDE_LATEX,
  FACTORIZATION: { ...DEFAULTS.FACTORIZATION },
  DEFAULT_SIMPLIFY_OPTIONS: { ...DEFAULTS.DEFAULT_SIMPLIFY_OPTIONS },
  COMMON_FUNCTION_NAMES: new Set(DEFAULTS.COMMON_FUNCTION_NAMES),
};

/**
 * Set configuration values at runtime.
 * @param {Partial<typeof config>} newConfig
 */
export function setConfig(newConfig: Partial<typeof config>): void {
  for (const key of Object.keys(newConfig) as (keyof typeof config)[]) {
    if (key === 'COMMON_FUNCTION_NAMES') {
      const val = newConfig[key];
      if (val instanceof Set) {
        config.COMMON_FUNCTION_NAMES = new Set(val);
      } else if (Array.isArray(val)) {
        config.COMMON_FUNCTION_NAMES = new Set(val);
      }
    } else if (key === 'FACTORIZATION' && typeof newConfig.FACTORIZATION === 'object') {
      config.FACTORIZATION = { ...config.FACTORIZATION, ...newConfig.FACTORIZATION };
    } else if (
      key === 'DEFAULT_SIMPLIFY_OPTIONS' &&
      typeof newConfig.DEFAULT_SIMPLIFY_OPTIONS === 'object'
    ) {
      config.DEFAULT_SIMPLIFY_OPTIONS = {
        ...config.DEFAULT_SIMPLIFY_OPTIONS,
        ...newConfig.DEFAULT_SIMPLIFY_OPTIONS,
      };
    } else if (key === 'MAX_EXPANSION_POWER' && typeof newConfig.MAX_EXPANSION_POWER === 'number') {
      config.MAX_EXPANSION_POWER = newConfig.MAX_EXPANSION_POWER;
    } else if (
      key === 'IS_STEPS_INCLUDE_LATEX' &&
      typeof newConfig.IS_STEPS_INCLUDE_LATEX === 'boolean'
    ) {
      config.IS_STEPS_INCLUDE_LATEX = newConfig.IS_STEPS_INCLUDE_LATEX;
    }
  }
}

/**
 * Get a snapshot of the current configuration.
 */
export function getConfig(): {
  MAX_EXPANSION_POWER: number;
  IS_STEPS_INCLUDE_LATEX: boolean;
  FACTORIZATION: typeof config.FACTORIZATION;
  DEFAULT_SIMPLIFY_OPTIONS: typeof config.DEFAULT_SIMPLIFY_OPTIONS;
  COMMON_FUNCTION_NAMES: Set<string>;
} {
  return {
    MAX_EXPANSION_POWER: config.MAX_EXPANSION_POWER,
    IS_STEPS_INCLUDE_LATEX: config.IS_STEPS_INCLUDE_LATEX,
    FACTORIZATION: { ...config.FACTORIZATION },
    DEFAULT_SIMPLIFY_OPTIONS: { ...config.DEFAULT_SIMPLIFY_OPTIONS },
    COMMON_FUNCTION_NAMES: new Set(config.COMMON_FUNCTION_NAMES),
  };
}
