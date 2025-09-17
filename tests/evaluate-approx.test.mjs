/**
 * Evaluate vs Approx Task Test
 * Tests the separation between evaluate (keeps π symbolic) and approx (converts to decimal)
 */

import { parseLatex as parse, analyze } from '../dist/index.esm.js';

console.log('=== EVALUATE vs APPROX TASK TEST ===\n');

const testCases = [
  {
    input: 'pi',
    testBoth: true,
    evaluateExpected: 'pi',
    approxExpected: '3.14159'
  },
  {
    input: '2 * pi',
    testBoth: true, 
    evaluateExpected: '2 pi',
    approxExpected: '6.28319'
  },
  {
    input: 'pi + 1',
    testBoth: true,
    evaluateExpected: 'pi + 1',
    approxExpected: '4.14159'
  },
  {
    input: 'e + pi',
    testBoth: true,
    evaluateExpected: 'e + pi',
    approxExpected: '5.85987'
  },
  {
    input: 'sin(pi/2)',
    testBoth: true,
    evaluateExpected: '\\sin(\\frac{pi}{2})',
    approxExpected: '1'
  }
];

let passed = 0;
let total = 0;

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  console.log(`Test ${i + 1}: ${testCase.input}`);
  
  try {
    const parseResult = parse(testCase.input);
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      continue;
    }
    
    // Test evaluate task
    if (testCase.testBoth || testCase.evaluateExpected) {
      total++;
      console.log(`  EVALUATE task:`);
      const evaluateResult = analyze(parseResult.ast, { task: 'evaluate' });
      
      if (evaluateResult.error) {
        console.log(`    ❌ ANALYZE ERROR: ${evaluateResult.error}`);
      } else {
        console.log(`    ✅ SUCCESS: ${evaluateResult.value}`);
        console.log(`    Expected: ${testCase.evaluateExpected}`);
        
        if (evaluateResult.value === testCase.evaluateExpected) {
          console.log(`    ✅ EXPECTED VALUE MATCH`);
          passed++;
        } else {
          console.log(`    ⚠️  EXPECTED VALUE MISMATCH`);
        }
      }
    }
    
    // Test approx task  
    if (testCase.testBoth || testCase.approxExpected) {
      total++;
      console.log(`  APPROX task:`);
      const approxResult = analyze(parseResult.ast, { task: 'approx' });
      
      if (approxResult.error) {
        console.log(`    ❌ ANALYZE ERROR: ${approxResult.error}`);
      } else {
        console.log(`    ✅ SUCCESS: ${approxResult.value}`);
        console.log(`    Expected: ${testCase.approxExpected}`);
        
        // For numerical comparisons, allow some tolerance
        const isNumeric = !isNaN(parseFloat(approxResult.value)) && !isNaN(parseFloat(testCase.approxExpected));
        let matches = false;
        
        if (isNumeric) {
          const actual = parseFloat(approxResult.value);
          const expected = parseFloat(testCase.approxExpected);
          matches = Math.abs(actual - expected) < 0.01; // 1% tolerance
        } else {
          matches = approxResult.value === testCase.approxExpected;
        }
        
        if (matches) {
          console.log(`    ✅ EXPECTED VALUE MATCH`);
          passed++;
        } else {
          console.log(`    ⚠️  EXPECTED VALUE MISMATCH`);
        }
      }
    }
    
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
  }
  
  console.log('');
}

console.log(`=== EVALUATE vs APPROX TEST SUMMARY ===`);
console.log(`✅ Passed: ${passed}/${total} (${((passed/total) * 100).toFixed(1)}%)`);
console.log(`❌ Failed: ${total - passed}/${total}`);

if (passed === total) {
  console.log(`🎉 ALL EVALUATE/APPROX TESTS PASSED!`);
} else if (passed > total * 0.8) {
  console.log(`✅ Good: Most evaluate/approx tests passed`);
} else {
  console.log(`⚠️ Warning: Some evaluate/approx tests failed`);
}