/**
 * Debug AST to LaTeX Conversion
 */

import { parseLatex } from '../../dist/index.esm.js';
import { expandExpression } from '../../dist/index.esm.js';
import { factorWithSteps } from '../../dist/index.esm.js';
import { astToLatex } from '../../dist/index.esm.js';

console.log('=== Debug AST to LaTeX Conversion ===\n');

async function debugAstToLatex() {
  const testExpression = '6x + 9';
  console.log(`Testing expression: ${testExpression}`);

  try {
    const parsed = parseLatex(testExpression);
    if (!parsed.ast) {
      console.error('No AST returned from parser');
      return;
    }

    const expanded = expandExpression(parsed.ast);
    if (!expanded) {
      console.error('Expansion returned null/undefined');
      return;
    }

    console.log('\nCalling factorWithSteps...');
    const factorizationResult = factorWithSteps(expanded, 'x', {
      preferCompleteFactorization: true,
      extractCommonFactors: true,
      simplifyCoefficients: true,
    });

    console.log('Factorization successful:', factorizationResult.changed);
    console.log('Result AST available:', !!factorizationResult.ast);

    if (factorizationResult.ast) {
      console.log('\nTrying to convert result AST to LaTeX...');
      try {
        const latex = astToLatex(factorizationResult.ast);
        console.log('LaTeX result:', latex);
      } catch (latexError) {
        console.error('astToLatex error:', latexError.message);
        console.error('Problematic AST:', JSON.stringify(factorizationResult.ast, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAstToLatex();