import { parseLatex } from '../dist/index.esm.js';

console.log('=== RESERVED WORD VALIDATION TESTS ===\n');

const reservedWordTests = [
  // Mathematical constants (should be invalid as variable names)
  {
    name: 'Mathematical constant e as variable',
    expression: 'e + 2',
    description: 'e is reserved as mathematical constant',
    shouldFail: true
  },
  {
    name: 'Mathematical constant π as variable',
    expression: 'π + 2',  
    description: 'π is reserved as mathematical constant',
    shouldFail: true
  },
  {
    name: 'Mathematical constant pi as variable',
    expression: 'pi + 2',
    description: 'pi is reserved as mathematical constant',
    shouldFail: true
  },
  {
    name: 'Imaginary unit i as variable',
    expression: 'i + 2',
    description: 'i is reserved as imaginary unit',
    shouldFail: true
  },
  
  // Function names (should be invalid as variable names)
  {
    name: 'Function name sin as variable',
    expression: 'sin * cos',
    description: 'sin and cos are reserved function names',
    shouldFail: true
  },
  {
    name: 'Function name log as variable',
    expression: 'log + ln',
    description: 'log and ln are reserved function names', 
    shouldFail: true
  },
  {
    name: 'Function name exp as variable',
    expression: 'exp * sqrt',
    description: 'exp and sqrt are reserved function names',
    shouldFail: true
  },
  
  // Valid variable names (should work)
  {
    name: 'Valid variable names a, b, c',
    expression: 'a + b + c',
    description: 'General variable names should work',
    shouldFail: false
  },
  {
    name: 'Valid variable names x, y, z',
    expression: 'x * y * z',
    description: 'Common variable names should work',
    shouldFail: false
  },
  {
    name: 'Valid variable names u, v, w',
    expression: 'u + v = w',
    description: 'Alternative variable names should work',
    shouldFail: false
  },
  
  // Edge cases
  {
    name: 'Reserved word in equation',
    expression: 'e + π = x',
    description: 'Multiple reserved words in equation',
    shouldFail: true
  },
  {
    name: 'Function call vs variable name',
    expression: '\\sin(x) + y',
    description: 'Proper function call should work',
    shouldFail: false
  }
];

console.log('Testing reserved word validation...\n');

let passedTests = 0;
let failedTests = 0;

for (const test of reservedWordTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Description: ${test.description}`);
  console.log(`Expected: ${test.shouldFail ? 'FAIL' : 'PASS'}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (test.shouldFail) {
      if (parseResult.error) {
        console.log(`✅ CORRECTLY REJECTED: ${parseResult.error}`);
        passedTests++;
      } else {
        console.log(`❌ SHOULD HAVE FAILED: Parsing succeeded when it should have failed`);
        failedTests++;
      }
    } else {
      if (parseResult.error) {
        console.log(`❌ UNEXPECTED FAILURE: ${parseResult.error}`);
        failedTests++;
      } else {
        console.log(`✅ CORRECTLY ACCEPTED: Parsing succeeded as expected`);
        passedTests++;
      }
    }
    
  } catch (error) {
    if (test.shouldFail) {
      console.log(`✅ CORRECTLY REJECTED: Runtime error - ${error.message}`);
      passedTests++;
    } else {
      console.log(`❌ UNEXPECTED ERROR: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log('');
}

console.log('=== RESERVED WORD VALIDATION SUMMARY ===');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('🎉 All reserved word validation tests passed!');
} else {
  console.log('⚠️  Some reserved word validation tests failed. Implementation needs improvement.');
}

// Test function argument validation
console.log('\n=== FUNCTION ARGUMENT VALIDATION TESTS ===\n');

const functionArgTests = [
  {
    name: 'sin with correct args',
    expression: '\\sin(x)',
    description: 'sin expects 1 argument',
    shouldFail: false
  },
  {
    name: 'sin with too many args',
    expression: '\\sin(x, y)',
    description: 'sin with 2 arguments should fail',
    shouldFail: true
  },
  {
    name: 'cos with correct args',
    expression: '\\cos(x)',
    description: 'cos expects 1 argument',
    shouldFail: false
  },
  {
    name: 'log with correct args',
    expression: '\\log(x)',
    description: 'log expects 1 argument',
    shouldFail: false
  },
  {
    name: 'sqrt with correct args',
    expression: '\\sqrt{x}',
    description: 'sqrt expects 1 argument',
    shouldFail: false
  }
];

let argPassedTests = 0;
let argFailedTests = 0;

for (const test of functionArgTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Expression: ${test.expression}`);
  console.log(`Expected: ${test.shouldFail ? 'FAIL' : 'PASS'}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (test.shouldFail) {
      if (parseResult.error) {
        console.log(`✅ CORRECTLY REJECTED: ${parseResult.error}`);
        argPassedTests++;
      } else {
        console.log(`❌ SHOULD HAVE FAILED: Parsing succeeded when it should have failed`);
        argFailedTests++;
      }
    } else {
      if (parseResult.error) {
        console.log(`❌ UNEXPECTED FAILURE: ${parseResult.error}`);
        argFailedTests++;
      } else {
        console.log(`✅ CORRECTLY ACCEPTED: Parsing succeeded as expected`);
        argPassedTests++;
      }
    }
    
  } catch (error) {
    if (test.shouldFail) {
      console.log(`✅ CORRECTLY REJECTED: Runtime error - ${error.message}`);
      argPassedTests++;
    } else {
      console.log(`❌ UNEXPECTED ERROR: ${error.message}`);
      argFailedTests++;
    }
  }
  
  console.log('');
}

console.log('=== FUNCTION ARGUMENT VALIDATION SUMMARY ===');
console.log(`✅ Passed: ${argPassedTests}`);
console.log(`❌ Failed: ${argFailedTests}`);
console.log(`📊 Success Rate: ${((argPassedTests / (argPassedTests + argFailedTests)) * 100).toFixed(1)}%`);

console.log('\n🔍 OVERALL SPECIFICATION COMPLIANCE CHECK:');
const totalPassed = passedTests + argPassedTests;
const totalFailed = failedTests + argFailedTests;
const overallRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);

console.log(`Total Tests: ${totalPassed + totalFailed}`);
console.log(`✅ Passed: ${totalPassed} (${overallRate}%)`);
console.log(`❌ Failed: ${totalFailed}`);

if (totalFailed === 0) {
  console.log('🎉 SPECIFICATION COMPLIANT: All validation tests passed!');
} else {
  console.log('⚠️  SPECIFICATION GAPS: Some validation features need implementation.');
}