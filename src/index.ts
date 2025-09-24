/**
 * Latexium - A powerful TypeScript library for parsing and analyzing LaTeX mathematical expressions
 *
 * Main entry point providing the core API functions
 */

// Export types
export * from './types';

// Export utilities
export * from './engine';

// Export parser
export { parseLatex } from './parser';

// Export analyzer
export { analyze, IntegrationEngine } from './analyzer';

// Export config setters/getters
export { setConfig, getConfig } from './config';

// Re-export commonly used functions for convenience
export type { AnalyzeOptions, AnalyzeResult, ASTNode, ParseResult } from './types';
