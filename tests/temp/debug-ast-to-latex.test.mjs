/**
 * Debug astToLatex Function
 */

import { parseLatex, expandExpression, astToLatex } from '../../dist/index.esm.js';

console.log('=== Debug astToLatex Function ===\n');

async function debugAstToLatex() {
  const testExpression = '6x + 9';
  console.log(`Testing expression: ${testExpression}`);

  try {
    const parsed = parseLatex(testExpression);
    console.log('\n--- Testing astToLatex on parsed AST ---');
    
    try {
      const parsedLatex = astToLatex(parsed.ast);
      console.log('✅ Parsed AST to LaTeX:', parsedLatex);
    } catch (parsedError) {
      console.error('❌ Failed on parsed AST:', parsedError.message);
      return;
    }

    console.log('\n--- Testing astToLatex on expanded AST ---');
    const expanded = expandExpression(parsed.ast);
    
    try {
      const expandedLatex = astToLatex(expanded);
      console.log('✅ Expanded AST to LaTeX:', expandedLatex);
    } catch (expandedError) {
      console.error('❌ Failed on expanded AST:', expandedError.message);
      console.error('Expanded AST:', JSON.stringify(expanded, null, 2));
      return;
    }

    console.log('\n--- All astToLatex tests passed ---');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugAstToLatex();