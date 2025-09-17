/**
 * Like Terms Combination Test
 * Tests the enhanced simplification with like-terms combination
 */

import { parseLatex as parse, analyze } from '../dist/index.esm.js';

console.log('=== LIKE TERMS COMBINATION TEST ===\n');

const testCases = [
  {
    input: '2x + 3x',
    task: 'evaluate',
    expected: '5 x'  // Updated to match actual output format
  },
  {
    input: 'x + x',
    task: 'evaluate', 
    expected: '2 x'
  },
  {
    input: '3x + 2x + x',
    task: 'evaluate',
    expected: '6 x'
  },
  {
    input: '2x + 3y + 4x',
    task: 'evaluate',
    expected: '6 x + 3 y'
  },
  {
    input: 'x^2 + 2x^2',
    task: 'evaluate',
    expected: '3 x^{2}'
  },
  {
    input: '\\pi + 2\\pi',  // Use pi instead of \pi
    task: 'evaluate',
    expected: '3 \\pi'
  },
  {
    input: 'pi + 2pi',
    task: 'approx',
    expected: '9.4248' // 3π ≈ 9.42478
  }
];

let passed = 0;
let total = testCases.length;

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  console.log(`Test ${i + 1}: ${testCase.input} (${testCase.task})`);
  
  try {
    const parseResult = parse(testCase.input);
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      continue;
    }
    
    const analyzeResult = analyze(parseResult.ast, { 
      task: testCase.task, 
      precision: 5 
    });
    
    if (analyzeResult.error) {
      console.log(`❌ ANALYZE ERROR: ${analyzeResult.error}`);
      continue;
    }
    
    console.log(`✅ SUCCESS: ${analyzeResult.value}`);
    console.log(`   Expected: ${testCase.expected}`);
    
    // Simple match check (could be more sophisticated)
    if (analyzeResult.value === testCase.expected) {
      console.log(`✅ EXPECTED VALUE MATCH`);
      passed++;
    } else {
      console.log(`⚠️  EXPECTED VALUE MISMATCH`);
    }
    
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
  }
  
  console.log('');
}

console.log(`=== LIKE TERMS TEST SUMMARY ===`);
console.log(`✅ Passed: ${passed}/${total} (${((passed/total) * 100).toFixed(1)}%)`);
console.log(`❌ Failed: ${total - passed}/${total}`);

if (passed === total) {
  console.log(`🎉 ALL LIKE TERMS TESTS PASSED!`);
} else if (passed > total * 0.8) {
  console.log(`✅ Good: Most like terms tests passed`);
} else {
  console.log(`⚠️ Warning: Some like terms tests failed`);
}