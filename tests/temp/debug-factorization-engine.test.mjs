/**
 * Debug Factorization Engine
 */

import { parseLatex } from '../../dist/index.esm.js';
import { expandExpression } from '../../dist/index.esm.js';
import { factorWithSteps } from '../../dist/index.esm.js';

console.log('=== Debug Factorization Engine ===\n');

async function debugFactorization() {
  // Test the problematic case: 6x + 9
  const testExpression = '6x + 9';
  console.log(`Testing expression: ${testExpression}`);

  try {
    const parsed = parseLatex(testExpression);
    console.log('Parsed AST available:', !!parsed.ast);

    if (!parsed.ast) {
      console.error('No AST returned from parser');
      return;
    }

    const expanded = expandExpression(parsed.ast);
    console.log('Expanded AST available:', !!expanded);
    
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

    console.log('Factorization result:', factorizationResult);
    console.log('Factorization result AST:', JSON.stringify(factorizationResult.ast, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugFactorization();