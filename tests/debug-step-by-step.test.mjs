/**
 * Step-by-step debug of simplification process
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

function stepByStepDebug(expression) {
  console.log(`\n🔬 Step-by-step debugging: ${expression}`);
  console.log('=' * 60);
  
  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse Error: ${parseResult.error}`);
      return;
    }

    console.log(`📥 Original AST:`);
    console.log(JSON.stringify(parseResult.ast, null, 2));

    // Specifically test the right side of addition (2 * 1)
    const multiplyPart = parseResult.ast.right;
    if (multiplyPart.type === 'BinaryExpression' && multiplyPart.operator === '+') {
      console.log(`🧮 Testing right multiplication part:`);
      console.log(JSON.stringify(multiplyPart.right, null, 2));
      
      // Test if this specific part gets simplified correctly
      const analyzeMultOnly = analyze(multiplyPart.right, { task: 'evaluate' });
      console.log(`✅ Right side only result: ${analyzeMultOnly.value}`);
    }

    const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
    if (analyzeResult.error) {
      console.log(`❌ Analyze Error: ${analyzeResult.error}`);
      return;
    }

    console.log(`📤 Final simplified AST:`);
    console.log(JSON.stringify(analyzeResult.ast, null, 2));
    console.log(`🎯 Final result: ${analyzeResult.value}`);
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

console.log('🚀 Step-by-step Simplification Debug');
console.log('====================================');

stepByStepDebug('2 * (x + 1)');