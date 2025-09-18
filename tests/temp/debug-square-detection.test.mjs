/**
 * Debug Difference of Squares Detection
 */

import { parseLatex } from '../../dist/index.esm.js';

console.log('=== Debug Difference of Squares Detection ===\n');

function debugSquareDetection() {
  const testExpressions = ['9x^2 - 16', 'x^4 - 1', '2x^4 - 8'];
  
  for (const expr of testExpressions) {
    console.log(`\n--- Testing: ${expr} ---`);
    
    const parseResult = parseLatex(expr);
    if (parseResult.error) {
      console.error('Parse error:', parseResult.error);
      continue;
    }
    
    console.log('AST:', JSON.stringify(parseResult.ast, null, 2));
  }
}

debugSquareDetection();