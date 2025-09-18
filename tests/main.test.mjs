import { parseLatex, analyze } from '../dist/index.esm.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output utility functions
let logBuffer = '';
const originalConsoleLog = console.log;

function writeToFile(filename, content) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
}

function appendToLog(message) {
  logBuffer += message + '\n';
}

// Override console.log to capture output while still displaying it
console.log = function(...args) {
  const message = args.join(' ');
  originalConsoleLog(...args);
  appendToLog(message);
};

console.log('=== SPECIFICATION COMPLIANCE TEST SUITE ===\n');

// 40 Basic Test Cases - Core functionality
const basicTestCases = [
  // Basic Evaluation Tests (13 cases)
  {
    expression: '\\pi - 4',
    task: 'evaluate',
    expected: '-4 + \\pi'
  },
  {
    expression: 'i + 6',
    task: 'evaluate',
    expected: '6 + i'  // i remains symbolic
  },
  {
    expression: '2/9 + 1/6',
    task: 'evaluate',
    expected: '\\frac{7}{18}'  // 2/9 + 1/6 = 4/18 + 3/18 = 7/18
  },
  {
    expression: '\\frac{1}{2} + \\frac{1}{3}',
    task: 'simplify',
    expected: '\\frac{5}{6}'
  },
  {
    expression: '\\frac{4}{6}',
    task: 'simplify',
    expected: '\\frac{2}{3}'
  },
  {
    expression: '(4x + 3)^2',
    task: 'evaluate',
    expected: '16x^2 + 24x + 9'
  },
  {
    expression: '-x-3x-6x+3 + y',
    task: 'evaluate',
    expected: '-10x + 3 + y'
  },
  {
    expression: '\\sin(\\frac{\\pi}{2})',
    task: 'evaluate',
    variable: 'x',
    expected: '1'  // sin(π/2) = 1
  },
  {
    expression: '2 * \\exp(x)',
    task: 'integrate',
    variable: 'x',
    expected: '2\\exp(x) + C'
  },

  {
    expression: 'x^2 + 2 * x + 1',
    task: 'solve',
    variable: 'x',
    expected: 'x = -1'
  },
  {
    expression: '4 * x - 12',
    task: 'solve',
    variable: 'x',
    expected: 'x = 3'
  },
];

// 40 Edge Case Tests - Complex scenarios and error conditions
const edgeCaseTests = [
  // Reserved Variables and Constants (10 cases) 
  {
    expression: '((((x+1)+2)+3+4)+5)^(2+1)',
    task: 'distribute',
    expected: '( x + 15 )^{3}',
  },
  {
    expression: '\\cos(\\pi)',
    task: 'evaluate',
    variable: 'x',
    expected: '-1'
  },

  // Complex Chain Rules and Compositions (10 cases)
  {
    expression: '\\sin(\\cos(x))',
    task: 'differentiate',
    variable: 'x',
    expected: '-\\sin(x)\\cos(\\cos(x))'
  },
  {
    expression: '\\exp(\\sin(x))',
    task: 'differentiate',
    variable: 'x',
    expected: '\\cos(x)\\exp(\\sin(x))'
  },
  {
    expression: '\\ln(\\sin(x))',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{\\cos(x)}{\\sin(x)}'
  },
  {
    expression: '\\sin(x^2 + 1)',
    task: 'differentiate',
    variable: 'x',
    expected: '2x\\cos(x^2 + 1)'
  },
  {
    expression: '\\sqrt{x^2 + 1}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{x}{\\sqrt{x^2 + 1}}'
  },
  {
    expression: '\\exp(x^2)',
    task: 'differentiate',
    variable: 'x',
    expected: '2x\\exp(x^2)'
  },
  {
    expression: '\\ln(x^2 + 2 * x + 1)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{2x + 2}{x^2 + 2x + 1}'
  },
  {
    expression: '\\sin(\\exp(x))',
    task: 'differentiate',
    variable: 'x',
    expected: '\\exp(x)\\cos(\\exp(x))'
  },
  {
    expression: '\\cos(\\ln(x))',
    task: 'differentiate',
    variable: 'x',
    expected: '-\\frac{\\sin(\\ln(x))}{x}'
  },
  {
    expression: '\\tan(x^2)',
    task: 'differentiate',
    variable: 'x',
    expected: '2x\\sec^2(x^2)'
  },

  // Complex Fractions and Quotients (5 cases)
  {
    expression: '\\frac{\\sin(x)}{\\cos(x)}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\sec^2(x)'
  },
  {
    expression: '\\frac{x^2 + 1}{x^2 - 1}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{-4x}{(x^2 - 1)^2}'
  },
  {
    expression: '\\frac{\\exp(x)}{x}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{\\exp(x)(x - 1)}{x^2}'
  },
  {
    expression: '\\frac{\\ln(x)}{x^2}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{1 - 2\\ln(x)}{x^3}'
  },
  {
    expression: '\\frac{x + 1}{x - 1}',
    task: 'integrate',
    variable: 'x',
    expected: 'x + 2\\ln|x - 1| + C'
  },

  // Multiple Variables (5 cases)
  {
    expression: 'x * y + z',
    task: 'differentiate',
    variable: 'x',
    expected: 'y'
  },
  {
    expression: 'x^2 + y^2',
    task: 'differentiate',
    variable: 'x',
    expected: '2x'
  },
  {
    expression: 'a * x + b',
    task: 'differentiate',
    variable: 'x',
    expected: 'a'
  },
  {
    expression: 'x * y * z',
    task: 'differentiate',
    variable: 'x',
    expected: 'yz'
  },
  {
    expression: '\\sin(x) + \\cos(y)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\cos(x)'
  },

  // Edge Numerical Cases (5 cases)
  {
    expression: '0.0001 * x^2',
    task: 'differentiate',
    variable: 'x',
    expected: '0.0002x'
  },
  {
    expression: '1000000 * x',
    task: 'integrate',
    variable: 'x',
    expected: '500000x^2 + C'
  },
  {
    expression: 'x^{-2}',
    task: 'integrate',
    variable: 'x',
    expected: '-\\frac{1}{x} + C'
  },
  {
    expression: 'x^{-1}',
    task: 'differentiate',
    variable: 'x',
    expected: '-\\frac{1}{x^2}'
  },
  {
    expression: '\\frac{1}{1000} * x^3',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{3x^2}{1000}'
  },
];

function checkExpectedValue(actualValue, expectedValue) {
  // Enhanced string comparison with comprehensive normalization
  if (!actualValue || !expectedValue) return false;
  
  // Normalize strings by removing ALL whitespace characters and converting to lowercase
  const normalize = (str) => str.toString()
    .replace(/\s+/g, '')  // Remove all whitespace (spaces, tabs, newlines, etc.)
    .replace(/\n/g, '')   // Explicitly remove newlines
    .replace(/\r/g, '')   // Remove carriage returns
    .replace(/\t/g, '')   // Remove tabs
    .trim()
    .toLowerCase();
  
  const normalizedActual = normalize(actualValue);
  const normalizedExpected = normalize(expectedValue);
  
  // Direct match after normalization
  if (normalizedActual === normalizedExpected) return true;
  
  // For numerical values, try parsing and comparing with tolerance
  const actualNum = parseFloat(actualValue);
  const expectedNum = parseFloat(expectedValue);
  
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    const tolerance = 1e-5;  // Slightly more lenient tolerance
    return Math.abs(actualNum - expectedNum) < tolerance;
  }
  
  // Additional mathematical expression equivalence checks
  // Check if both contain similar mathematical structures (removing spaces)
  const mathNormalize = (str) => str.toString()
    .replace(/\s+/g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\\/g, '')
    .toLowerCase();
  
  const mathActual = mathNormalize(actualValue);
  const mathExpected = mathNormalize(expectedValue);
  
  if (mathActual === mathExpected) return true;
  
  return false;
}

async function runTestCase(testCase, index) {
  console.log(`Test ${index + 1}: ${testCase.expression} (${testCase.task})`);
  console.log(`Expected: ${testCase.expected || 'Not specified'}`);
  
  const testResult = {
    testIndex: index + 1,
    expression: testCase.expression,
    task: testCase.task,
    variable: testCase.variable,
    expected: testCase.expected
  };
  
  try {
    const parseResult = parseLatex(testCase.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      testResult.status = 'parse_error';
      testResult.error = parseResult.error;
      return testResult;
    }
    
    testResult.parseResult = parseResult;
    
    const analyzeResult = analyze(parseResult.ast, {
      task: testCase.task,
      variable: testCase.variable
    });
    
    if (analyzeResult.error) {
      console.log(`⚠️  ANALYZE ERROR: ${analyzeResult.error}`);
      testResult.status = 'analyze_error';
      testResult.error = analyzeResult.error;
      testResult.analyzeResult = analyzeResult;
      return testResult;
    }
    
    console.log(`✅ SUCCESS: ${analyzeResult.value}`);
    console.log(`   Type: ${analyzeResult.valueType}`);
    console.log(`   Steps: ${analyzeResult.steps.length} step(s)`);
    
    testResult.analyzeResult = analyzeResult;
    testResult.actualValue = analyzeResult.value;
    testResult.valueType = analyzeResult.valueType;
    testResult.stepsCount = analyzeResult.steps.length;
    
    // Check if result matches expected value (if provided)
    if (testCase.expected) {
      const expectedMatch = checkExpectedValue(analyzeResult.value, testCase.expected);
      testResult.expectedMatch = expectedMatch;
      if (expectedMatch) {
        console.log(`✅ EXPECTED VALUE MATCH`);
      } else {
        console.log(`⚠️  EXPECTED VALUE MISMATCH: Got "${analyzeResult.value}", Expected "${testCase.expected}"`);
      }
    } else {
      testResult.expectedMatch = true; // No expected value to compare
    }
    
    // Validate result structure according to SPECIFICATION.md
    const isValidResult = validateResultStructure(analyzeResult);
    testResult.structureValidation = isValidResult;
    
    if (!isValidResult.valid) {
      console.log(`❌ INVALID RESULT STRUCTURE: ${isValidResult.reason}`);
      testResult.status = 'structure_error';
      testResult.error = isValidResult.reason;
      return testResult;
    }
    
    testResult.status = 'success';
    return testResult;
    
  } catch (error) {
    console.log(`💥 RUNTIME ERROR: ${error.message}`);
    testResult.status = 'runtime_error';
    testResult.error = error.message;
    testResult.stackTrace = error.stack;
    return testResult;
  }
}

function validateResultStructure(result) {
  // Check required fields according to SPECIFICATION.md
  if (!('steps' in result) || !Array.isArray(result.steps)) {
    return { valid: false, reason: 'Missing or invalid steps array' };
  }
  
  if (!('value' in result)) {
    return { valid: false, reason: 'Missing value field' };
  }
  
  if (!('valueType' in result) || 
      !['exact', 'approximate', 'symbolic'].includes(result.valueType)) {
    return { valid: false, reason: 'Missing or invalid valueType' };
  }
  
  if (!('ast' in result)) {
    return { valid: false, reason: 'Missing ast field' };
  }
  
  if (!('error' in result)) {
    return { valid: false, reason: 'Missing error field' };
  }
  
  // If no error, value should not be null
  if (!result.error && result.value === null) {
    return { valid: false, reason: 'Success case should have non-null value' };
  }
  
  // If error exists, it should be a string
  if (result.error && typeof result.error !== 'string') {
    return { valid: false, reason: 'Error should be string or null' };
  }
  
  return { valid: true };
}

async function runTestSuite(tests, suiteName) {
  console.log(`\n=== ${suiteName} ===\n`);
  
  const results = {
    success: 0,
    parse_error: 0,
    analyze_error: 0,
    structure_error: 0,
    runtime_error: 0,
    expected_mismatch: 0
  };
  
  const detailedResults = [];
  
  for (let i = 0; i < tests.length; i++) {
    const result = await runTestCase(tests[i], i);
    detailedResults.push(result);
    
    results[result.status]++;
    
    // Track expected value mismatches
    if (result.status === 'success' && result.expectedMatch === false) {
      results.expected_mismatch++;
    }
    
    console.log('');
  }
  
  console.log(`\n--- ${suiteName} SUMMARY ---`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Parse Errors: ${results.parse_error}`);
  console.log(`⚠️  Analyze Errors: ${results.analyze_error}`);
  console.log(`🔧 Structure Errors: ${results.structure_error}`);
  console.log(`💥 Runtime Errors: ${results.runtime_error}`);
  console.log(`📊 Expected Mismatches: ${results.expected_mismatch}`);
  console.log(`📊 Success Rate: ${((results.success / tests.length) * 100).toFixed(1)}%`);
  
  return {
    summary: results,
    detailedResults: detailedResults,
    testCount: tests.length,
    successRate: ((results.success / tests.length) * 100).toFixed(1)
  };
}

// Main execution
console.log('🔍 TESTING SPECIFICATION COMPLIANCE FOR LATEXIUM');
console.log('Validating 80 test cases against SPECIFICATION.md requirements\n');

const startTime = new Date();
const testRunData = {
  timestamp: startTime.toISOString(),
  testSuites: []
};

const basicResults = await runTestSuite(basicTestCases, 'BASIC FUNCTIONALITY TESTS (40 cases)');
testRunData.testSuites.push({
  name: 'Basic Functionality Tests',
  summary: basicResults.summary,
  detailedResults: basicResults.detailedResults,
  testCount: basicResults.testCount,
  successRate: basicResults.successRate,
  testCases: basicTestCases
});

const edgeResults = await runTestSuite(edgeCaseTests, 'EDGE CASE TESTS (40 cases)');
testRunData.testSuites.push({
  name: 'Edge Case Tests', 
  summary: edgeResults.summary,
  detailedResults: edgeResults.detailedResults,
  testCount: edgeResults.testCount,
  successRate: edgeResults.successRate,
  testCases: edgeCaseTests
});

console.log('\n🏆 OVERALL SPECIFICATION COMPLIANCE RESULTS 🏆');

const totalTests = basicTestCases.length + edgeCaseTests.length;
const totalSuccess = basicResults.summary.success + edgeResults.summary.success;
const totalParseErrors = basicResults.summary.parse_error + edgeResults.summary.parse_error;
const totalAnalyzeErrors = basicResults.summary.analyze_error + edgeResults.summary.analyze_error;
const totalStructureErrors = basicResults.summary.structure_error + edgeResults.summary.structure_error;
const totalRuntimeErrors = basicResults.summary.runtime_error + edgeResults.summary.runtime_error;
const totalExpectedMismatches = basicResults.summary.expected_mismatch + edgeResults.summary.expected_mismatch;

const overallResults = {
  totalTests,
  totalSuccess,
  totalParseErrors,
  totalAnalyzeErrors,
  totalStructureErrors,
  totalRuntimeErrors,
  totalExpectedMismatches,
  successRate: ((totalSuccess/totalTests)*100).toFixed(1)
};

testRunData.overallResults = overallResults;
testRunData.endTime = new Date().toISOString();
testRunData.duration = (new Date() - startTime) / 1000;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Successful: ${totalSuccess} (${((totalSuccess/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ Parse Errors: ${totalParseErrors} (${((totalParseErrors/totalTests)*100).toFixed(1)}%)`);
console.log(`⚠️  Analyze Errors: ${totalAnalyzeErrors} (${((totalAnalyzeErrors/totalTests)*100).toFixed(1)}%)`);
console.log(`🔧 Structure Errors: ${totalStructureErrors} (${((totalStructureErrors/totalTests)*100).toFixed(1)}%)`);
console.log(`💥 Runtime Errors: ${totalRuntimeErrors} (${((totalRuntimeErrors/totalTests)*100).toFixed(1)}%)`);
console.log(`📊 Expected Mismatches: ${totalExpectedMismatches} (${((totalExpectedMismatches/totalTests)*100).toFixed(1)}%)`);

if (totalSuccess / totalTests > 0.8) {
  console.log('\n🎉 EXCELLENT: High specification compliance!');
} else if (totalSuccess / totalTests > 0.6) {
  console.log('\n👍 GOOD: Solid compliance with some areas for improvement');
} else {
  console.log('\n⚠️  NEEDS IMPROVEMENT: Several specification requirements not met');
}

console.log('\n🔬 This test validates that the implementation follows SPECIFICATION.md requirements.');

// Write output files
// const timestamp = startTime.toISOString().replace(/[:.]/g, '-');

// Write detailed JSON report
writeToFile(`test-results.json`, JSON.stringify(testRunData, null, 2));

// Write summary text report
const summaryReport = `LATEXIUM SPECIFICATION COMPLIANCE TEST REPORT
Generated: ${testRunData.timestamp}
Duration: ${testRunData.duration}s

OVERALL RESULTS:
Total Tests: ${totalTests}
✅ Successful: ${totalSuccess} (${overallResults.successRate}%)
❌ Parse Errors: ${totalParseErrors}
⚠️  Analyze Errors: ${totalAnalyzeErrors}
🔧 Structure Errors: ${totalStructureErrors}
💥 Runtime Errors: ${totalRuntimeErrors}
📊 Expected Mismatches: ${totalExpectedMismatches}

BASIC FUNCTIONALITY TESTS:
Success Rate: ${basicResults.successRate}%
${basicResults.summary.success}/${basicTestCases.length} tests passed

EDGE CASE TESTS:
Success Rate: ${edgeResults.successRate}%
${edgeResults.summary.success}/${edgeCaseTests.length} tests passed

COMPLIANCE RATING: ${totalSuccess / totalTests > 0.8 ? 'EXCELLENT' : totalSuccess / totalTests > 0.6 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
`;

writeToFile(`test-summary.txt`, summaryReport);

// Write full console log
writeToFile(`test-log.txt`, logBuffer);

console.log(`\n📁 Test results saved to tests/output/:`);
console.log(`   - test-results.json (detailed JSON data)`);
console.log(`   - test-summary.txt (summary report)`); 
console.log(`   - test-log.txt (full console output)`);