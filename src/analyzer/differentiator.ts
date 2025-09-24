/**
 * Differentiation Engine
 * Implements symbolic differentiation for mathematical expressions
 */

import { astToLatex } from '../engine/ast';
import { differentiate } from '../engine/differentiation';
import { getAnalysisVariable, extractFreeVariables } from '../engine/variables';
import { ASTNode, AnalyzeOptions, AnalyzeResult, StepTree } from '../types';

export function analyzeDifferentiate(
  ast: ASTNode,
  options: AnalyzeOptions & { task: 'differentiate' }
): AnalyzeResult {
  const steps: StepTree[] = [];
  try {
    let variable: string;
    let expr: ASTNode;
    if (ast.type === 'Derivative') {
      variable = ast.variable;
      expr = ast.expression;
      steps.push(`Differentiating with respect to ${variable}`);
      steps.push(`Expression: ${astToLatex(expr)}`);
    } else {
      variable = getAnalysisVariable(ast, options.variable);
      expr = ast;
      const freeVars = extractFreeVariables(ast);
      if (!options.variable && freeVars.size > 1) {
        steps.push(
          `Multiple variables found: {${Array.from(freeVars).join(', ')}}. Using '${variable}' for differentiation.`
        );
      } else if (!options.variable && freeVars.size === 1) {
        steps.push(`Auto-detected variable: ${variable}`);
      }
      steps.push(`Differentiating with respect to ${variable}`);
      steps.push(`Expression: ${astToLatex(expr)}`);
    }
    // Perform differentiation
    const diffSteps: StepTree[] = [];
    const derivative = differentiate(expr, variable, diffSteps);
    steps.push(...diffSteps);
    // Apply simplification to the derivative
    const derivativeLatex = astToLatex(derivative);
    return {
      steps,
      value: derivativeLatex,
      valueType: 'symbolic',
      ast: derivative,
      error: null,
    };
  } catch (error) {
    return {
      steps,
      value: null,
      valueType: 'symbolic',
      ast: null,
      error: error instanceof Error ? error.message : 'Differentiation error',
    };
  }
}
