/**
 * Analysis functions
 */

export { analyzeDifferentiate, differentiateAST } from './differentiator';
export { analyzeEvaluate, evaluateAST } from './evaluator';

/**
 * Analyzer Module
 * Main analysis engine for mathematical expressions
 */

import { ASTNode, AnalyzeOptions, AnalyzeResult } from '../types';
import { analyzeDifferentiate } from './differentiator';
import { analyzeEvaluate } from './evaluator';

/**
 * Main analyze function that handles different tasks
 */
export function analyze(ast: ASTNode | null, options: AnalyzeOptions): AnalyzeResult {
  if (!ast) {
    return {
      steps: [],
      value: null,
      valueType: 'exact',
      ast: null,
      error: 'Invalid AST: null',
    };
  }

  try {
    switch (options.task) {
      case 'evaluate':
        return analyzeEvaluate(ast, options);

      case 'differentiate':
        return analyzeDifferentiate(ast, options as AnalyzeOptions & { task: 'differentiate' });

      case 'integrate':
        return {
          steps: [],
          value: null,
          valueType: 'symbolic',
          ast: null,
          error: 'Integration not yet implemented',
        };

      case 'solve':
        return {
          steps: [],
          value: null,
          valueType: 'symbolic',
          ast: null,
          error: 'Equation solving not yet implemented',
        };

      case 'min':
      case 'max':
        return {
          steps: [],
          value: null,
          valueType: 'approximate',
          ast: null,
          error: 'Optimization not yet implemented',
        };

      case 'functional':
        return {
          steps: [],
          value: null,
          valueType: 'symbolic',
          ast: null,
          error: 'Functional analysis not yet implemented',
        };

      default:
        return {
          steps: [],
          value: null,
          valueType: 'exact',
          ast: null,
          error: `Unsupported task: ${(options as { task: string }).task}`,
        };
    }
  } catch (error) {
    return {
      steps: [],
      value: null,
      valueType: 'exact',
      ast: null,
      error: error instanceof Error ? error.message : 'Analysis error',
    };
  }
}

export * from './evaluator';
