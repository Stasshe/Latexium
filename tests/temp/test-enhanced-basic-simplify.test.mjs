/**
 * Test enhanced basic-simplify functionality
 */

import { parseLatex, analyze } from '../../dist/index.esm.js';

function testBasicSimplifyEnhancements() {
  console.log('Testing enhanced basic-simplify functionality...\n');

  const testCases = [
    'x - (-x + 1)',
    'x + (-x + 1)', 
    'x - (-1)',
    'x + (-1)',
    'x - (y + z)',
    'x - (y - z)',
    'x^5 - x',
    'x^4 - 1'
  ];

  testCases.forEach(input => {
    try {
      console.log(`Input: ${input}`);
      
      const parseResult = parseLatex(input);
      const ast = parseResult.ast;
      
      if (ast) {
        const result = analyze(ast, { task: 'factor' });
        console.log(`Result: ${result.value}\n`);
      }
      
    } catch (error) {
      console.error(`Error with ${input}:`, error.message, '\n');
    }
  });
}

testBasicSimplifyEnhancements();