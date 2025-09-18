/**
 * Debug Common Factor Extraction
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== Debug Common Factor Extraction ===\n');

const testExpression = '6x + 9';
console.log(`Testing expression: ${testExpression}`);

async function debugCommonFactor() {
  try {
    const parseResult = parseLatex(testExpression);
    console.log('Parsed AST:', JSON.stringify(parseResult, null, 2));

    if (parseResult.error) {
      console.error('Parse error:', parseResult.error);
      return;
    }

    const result = analyze(parseResult.ast, {
      task: 'factor',
      variable: 'x',
      showSteps: true
    });

    console.log('\nFactorization result:');
    console.log('Value:', result.value);
    console.log('Error:', result.error);
    console.log('Steps:');
    result.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });

    console.log('\nExpected: 3(2x + 3)');
    console.log(`Actual: ${result.value}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugCommonFactor();