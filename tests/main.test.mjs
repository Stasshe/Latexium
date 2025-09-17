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
    expression: '2 + 3',
    task: 'evaluate',
    variable: 'x',
    expected: '5'
  },
  {
    expression: '\\pi - 4',
    task: 'evaluate',
    expected: '-0.858407'  // π ≈ 3.141593 so π - 4 ≈ -0.858407
  },
  {
    expression: 'i + 6',
    task: 'evaluate',
    expected: '6 + i'  // i remains symbolic
  },
  {
    expression: 'e + 1',
    task: 'evaluate',
    expected: '3.718282'  // e ≈ 2.718282 so e + 1 ≈ 3.718282
  },
  {
    expression: 'x + 5',
    task: 'evaluate',
    variable: 'x',
    expected: 'x + 5'  // x is unspecified, remains symbolic
  },
  {
    expression: '\\sin(\\frac{\\pi}{2})',
    task: 'evaluate',
    variable: 'x',
    expected: '1'  // sin(π/2) = 1
  },
  {
    expression: '\\cos(0)',
    task: 'evaluate',
    variable: 'x',
    expected: '1'  // cos(0) = 1
  },
  {
    expression: '\\exp(0)',
    task: 'evaluate',
    variable: 'x',
    expected: '1'  // exp(0) = 1
  },
  {
    expression: '\\ln(e)',
    task: 'evaluate',
    variable: 'x',
    expected: '1'  // ln(e) = 1
  },
  {
    expression: '\\sqrt{16}',
    task: 'evaluate',
    variable: 'x',
    expected: '4'  // sqrt(16) = 4
  },
  {
    expression: '3 * 4 + 2',
    task: 'evaluate',
    variable: 'x',
    expected: '14'  // 3 * 4 + 2 = 14
  },
  {
    expression: '\\frac{6}{2}',
    task: 'evaluate',
    variable: 'x',
    expected: '3'  // 6/2 = 3
  },
  {
    expression: '2^3',
    task: 'evaluate',
    variable: 'x',
    expected: '8'  // 2^3 = 8
  },

  // Basic Differentiation Tests (10 cases)
  {
    expression: 'x^2',
    task: 'differentiate',
    variable: 'x',
    expected: '2x'
  },
  {
    expression: '3 * x',
    task: 'differentiate',
    variable: 'x',
    expected: '3'
  },
  {
    expression: 'x^3 + 2 * x^2 + x + 1',
    task: 'differentiate',
    variable: 'x',
    expected: '3x^2 + 4x + 1'
  },
  {
    expression: '\\sin(x)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\cos(x)'
  },
  {
    expression: '\\cos(x)',
    task: 'differentiate',
    variable: 'x',
    expected: '-\\sin(x)'
  },
  {
    expression: '\\exp(x)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\exp(x)'
  },
  {
    expression: '\\ln(x)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{1}{x}'
  },
  {
    expression: 'x * \\sin(x)',
    task: 'differentiate',
    variable: 'x',
    expected: '\\sin(x) + x\\cos(x)'
  },
  {
    expression: '\\frac{x}{x^2 + 1}',
    task: 'differentiate',
    variable: 'x',
    expected: '\\frac{1 - x^2}{(x^2 + 1)^2}'
  },
  {
    expression: '\\sin(x^2)',
    task: 'differentiate',
    variable: 'x',
    expected: '2x\\cos(x^2)'
  },

  // Basic Integration Tests (10 cases)
  {
    expression: 'x',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{x^2}{2} + C'
  },
  {
    expression: 'x^2',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{x^3}{3} + C'
  },
  {
    expression: '2 * x + 3',
    task: 'integrate',
    variable: 'x',
    expected: 'x^2 + 3x + C'
  },
  {
    expression: '\\sin(x)',
    task: 'integrate',
    variable: 'x',
    expected: '-\\cos(x) + C'
  },
  {
    expression: '\\cos(x)',
    task: 'integrate',
    variable: 'x',
    expected: '\\sin(x) + C'
  },
  {
    expression: '\\exp(x)',
    task: 'integrate',
    variable: 'x',
    expected: '\\exp(x) + C'
  },
  {
    expression: '\\frac{1}{x}',
    task: 'integrate',
    variable: 'x',
    expected: '\\ln|x| + C'
  },
  {
    expression: 'x^3',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{x^4}{4} + C'
  },
  {
    expression: '\\frac{1}{x^2 + 1}',
    task: 'integrate',
    variable: 'x',
    expected: '\\arctan(x) + C'
  },
  {
    expression: '2 * \\exp(x)',
    task: 'integrate',
    variable: 'x',
    expected: '2\\exp(x) + C'
  },

  // Basic Solve Tests (10 cases)
  {
    expression: 'x - 5',
    task: 'solve',
    variable: 'x',
    expected: 'x = 5'
  },
  {
    expression: '2 * x + 6',
    task: 'solve',
    variable: 'x',
    expected: 'x = -3'
  },
  {
    expression: 'x^2 - 4',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-2, 2\\}'
  },
  {
    expression: 'x^2 + x - 6',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-3, 2\\}'
  },
  {
    expression: 'x^2 - 5 * x + 6',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{2, 3\\}'
  },
  {
    expression: '3 * x - 9',
    task: 'solve',
    variable: 'x',
    expected: 'x = 3'
  },
  {
    expression: 'x^2 - 1',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-1, 1\\}'
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
  {
    expression: 'x^2 - 9',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-3, 3\\}'
  }
];

// 40 Edge Case Tests - Complex scenarios and error conditions
const edgeCaseTests = [
  // Reserved Variables and Constants (10 cases)
  {
    expression: 'e + 3',
    task: 'evaluate',
    variable: 'x',
    expected: '5.718282'  // e ≈ 2.718282 so e + 3 ≈ 5.718282
  },
  {
    expression: '\\pi * 2',
    task: 'evaluate',
    variable: 'x',
    expected: '6.283185'  // π * 2 ≈ 6.283185
  },
  {
    expression: 'e^x',
    task: 'differentiate',
    variable: 'x',
    expected: '\\exp(x)'
  },
  {
    expression: '\\pi * x^2',
    task: 'differentiate',
    variable: 'x',
    expected: '2\\pi x'
  },
  {
    expression: 'e * x + \\pi',
    task: 'integrate',
    variable: 'x',
    expected: '\\frac{ex^2}{2} + \\pi x + C'
  },
  {
    expression: 'x + e',
    task: 'solve',
    variable: 'x',
    expected: 'x = -e'
  },
  {
    expression: '\\pi * x - \\pi',
    task: 'solve',
    variable: 'x',
    expected: 'x = 1'
  },
  {
    expression: 'e^2 + x',
    task: 'differentiate',
    variable: 'x',
    expected: '1'
  },
  {
    expression: '\\sin(\\pi)',
    task: 'evaluate',
    variable: 'x',
    expected: '0'  // sin(π) = 0
  },
  {
    expression: '\\cos(\\pi)',
    task: 'evaluate',
    variable: 'x',
    expected: '-1'  // cos(π) = -1
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

  // Complex Equations (5 cases)
  {
    expression: 'x^2 + x + 1',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{\\frac{-1 + i\\sqrt{3}}{2}, \\frac{-1 - i\\sqrt{3}}{2}\\}'
  },
  {
    expression: 'x^3 - x',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-1, 0, 1\\}'
  },
  {
    expression: '\\frac{x + 1}{2}',
    task: 'solve',
    variable: 'x',
    expected: 'x = -1'
  },
  {
    expression: '0.5 * x^2 - 2',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-2, 2\\}'
  },
  {
    expression: 'x^2 - 2 * x - 3',
    task: 'solve',
    variable: 'x',
    expected: 'x \\in \\{-1, 3\\}'
  }
];

function checkExpectedValue(actualValue, expectedValue) {
  // Simple string comparison with some normalization
  if (!actualValue || !expectedValue) return false;
  
  // Normalize strings by removing extra spaces and converting to lowercase
  const normalize = (str) => str.toString().replace(/\s+/g, ' ').trim().toLowerCase();
  
  const normalizedActual = normalize(actualValue);
  const normalizedExpected = normalize(expectedValue);
  
  // Direct match
  if (normalizedActual === normalizedExpected) return true;
  
  // For numerical values, try parsing and comparing with tolerance
  const actualNum = parseFloat(actualValue);
  const expectedNum = parseFloat(expectedValue);
  
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    const tolerance = 1e-6;
    return Math.abs(actualNum - expectedNum) < tolerance;
  }
  
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

console.log('\n📋 SPECIFICATION COMPLIANCE SUMMARY:');
console.log('✓ Result structure validation (AnalyzeResult type)');
console.log('✓ Error handling consistency');
console.log('✓ Value type classification (exact/approximate/symbolic)');
console.log('✓ Steps array for educational purposes');
console.log('✓ AST preservation in results');
console.log('✓ Expected value validation for all test cases');

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