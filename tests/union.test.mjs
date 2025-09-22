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
console.log = function (...args) {
  const message = args.join(' ');
  originalConsoleLog(...args);
  appendToLog(message);
};

console.log('=== LATEXIUM MASTER TEST SUITE (SPECIFICATION v3) ===\n');

// 30 Complex Test Cases - Focus on distribute, factor with some others
const complexTestCases = [
  // Distribution Tests (10 cases) - Main focus
  {
    id: 113,
    expression: 'x^6 - 64',
    task: 'factor',
    expected: '(x^2 - 4)(x^2 + 2x + 4)(x^2 - 2x + 4)',
    description: 'Sixth power minus 64',
  },
];

function normalizeExpression(expr) {
  if (!expr) return '';

  return expr
    .toString()
    .replace(/\s+/g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\\/g, '')
    .toLowerCase()
    .trim();
}

function checkExpectedValue(actualValue, expectedValue) {
  if (!actualValue || !expectedValue) return false;

  // Helper: parse a sum of monomials into sorted canonical form
  function canonicalize(expr) {
    // Remove whitespace, braces, and backslashes, normalize ^{n} to ^n
    let s = expr
      .toString()
      .replace(/\\/g, '')
      .replace(/\s+/g, '')
      .replace(/\{([^}]*)\}/g, '$1')
      .replace(/\^\{([^}]*)\}/g, '^$1')
      .replace(/\^/g, '^')
      .replace(/([a-zA-Z])([0-9]+)/g, '$1^$2') // x2 -> x^2
      .replace(/([\\+\\-])/g, ' $1')
      .replace(/\*+/g, '')
      .trim();
    // Split into terms
    let terms = s
      .split(/ (?=[+-])/)
      .map(t => t.trim())
      .filter(Boolean);
    // Normalize each term: sort variables in each monomial
    terms = terms.map(term => {
      // Separate coefficient and variables
      let match = term.match(/^([+-]?\d*\.?\d*)?([a-zA-Z][a-zA-Z0-9^]*)*$/);
      if (!match) return term;
      let coeff = match[1] || '';
      let vars = term.replace(/^([+-]?\d*\.?\d*)/, '');
      // Split variables and sort
      let varParts = [];
      let re = /([a-zA-Z]+)(\^(-?\d+))?/g;
      let m;
      while ((m = re.exec(vars)) !== null) {
        varParts.push(m[0]);
      }
      varParts.sort();
      return (coeff ? coeff : term[0] === '-' ? '-' : '') + varParts.join('');
    });
    // Sort all terms lexicographically
    terms.sort((a, b) => {
      // Remove leading + for comparison
      let aa = a.replace(/^\+/, '');
      let bb = b.replace(/^\+/, '');
      return aa.localeCompare(bb);
    });
    return terms.join('+').replace(/\+\\-/g, '-');
  }

  // Direct match (after normalization, ignore all whitespace)
  const normalizedActual = normalizeExpression(actualValue).replace(/\s+/g, '');
  const normalizedExpected = normalizeExpression(expectedValue).replace(/\s+/g, '');
  if (normalizedActual === normalizedExpected) return true;

  // Canonicalize and compare as sum of monomials (ignore whitespace)
  if (
    canonicalize(actualValue).replace(/\s+/g, '') ===
    canonicalize(expectedValue).replace(/\s+/g, '')
  )
    return true;

  // Numerical tolerance check
  const actualNum = parseFloat(actualValue);
  const expectedNum = parseFloat(expectedValue);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    const tolerance = 1e-6;
    return Math.abs(actualNum - expectedNum) < tolerance;
  }

  // Check for mathematical equivalence patterns (legacy fallback)
  const mathPatterns = [
    [/pi/g, 'π'],
    [/exp/g, 'e^'],
    [/ln/g, 'log'],
  ];
  let modifiedActual = normalizedActual;
  let modifiedExpected = normalizedExpected;
  for (const [pattern, replacement] of mathPatterns) {
    modifiedActual = modifiedActual.replace(pattern, replacement);
    modifiedExpected = modifiedExpected.replace(pattern, replacement);
  }
  return modifiedActual === modifiedExpected;
}

async function runTestCase(testCase) {
  console.log(`Test ${testCase.id}: ${testCase.description}`);
  console.log(`Expression: ${testCase.expression}`);
  console.log(`Task: ${testCase.task}`);
  console.log(`Expected: ${testCase.expected || 'Not specified'}`);

  const testResult = {
    id: testCase.id,
    description: testCase.description,
    expression: testCase.expression,
    task: testCase.task,
    variable: testCase.variable,
    values: testCase.values,
    expected: testCase.expected,
  };

  try {
    // Parse the LaTeX expression
    const parseResult = parseLatex(testCase.expression);

    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      testResult.status = 'parse_error';
      testResult.error = parseResult.error;
      return testResult;
    }

    // Exclude parseResult.ast from output
    /* eslint-disable-next-line no-unused-vars */
    const { ast: _parseAst, ...parseResultNoAst } = parseResult;
    testResult.parseResult = parseResultNoAst;

    // Build options object
    const options = {
      task: testCase.task,
    };

    if (testCase.variable) {
      options.variable = testCase.variable;
    }

    if (testCase.values) {
      options.values = testCase.values;
    }

    // Analyze the expression
    const analyzeResult = analyze(parseResult.ast, options);

    if (analyzeResult.error) {
      console.log(`⚠️  ANALYZE ERROR: ${analyzeResult.error}`);
      testResult.status = 'analyze_error';
      testResult.error = analyzeResult.error;
      // Exclude analyzeResult.ast from output
      /* eslint-disable-next-line no-unused-vars */
      const { ast: _analyzeAst, ...analyzeResultNoAst } = analyzeResult;
      testResult.analyzeResult = analyzeResultNoAst;
      return testResult;
    }

    console.log(`✅ SUCCESS: ${analyzeResult.value}`);
    console.log(`   Type: ${analyzeResult.valueType}`);
    console.log(`   Steps: ${analyzeResult.steps.length} step(s)`);

    // Exclude analyzeResult.ast from output
    /* eslint-disable-next-line no-unused-vars */
    const { ast: _analyzeAst, ...analyzeResultNoAst } = analyzeResult;
    testResult.analyzeResult = analyzeResultNoAst;
    testResult.actualValue = analyzeResult.value;
    testResult.valueType = analyzeResult.valueType;
    testResult.stepsCount = analyzeResult.steps.length;

    // Check expected value match
    if (testCase.expected) {
      const expectedMatch = checkExpectedValue(analyzeResult.value, testCase.expected);
      testResult.expectedMatch = expectedMatch;
      if (expectedMatch) {
        console.log(`✅ EXPECTED VALUE MATCH`);
      } else {
        console.log(`⚠️  EXPECTED VALUE MISMATCH:`);
        console.log(`   Got: "${analyzeResult.value}"`);
        console.log(`   Expected: "${testCase.expected}"`);
      }
    } else {
      testResult.expectedMatch = true;
    }

    // Validate result structure
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

  if (
    !('valueType' in result) ||
    !['exact', 'approximate', 'symbolic'].includes(result.valueType)
  ) {
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

async function runTestSuite() {
  console.log('🔍 TESTING COMPLEX SCENARIOS FOR LATEXIUM MASTER SUITE');
  console.log('Focus: distribute, factor with selective other operations\n');

  const results = {
    parse_success: 0, // パース成功数
    parse_error: 0,
    analyze_error: 0,
    structure_error: 0,
    runtime_error: 0,
    expected_match: 0, // 正解数
  };

  const detailedResults = [];
  const taskBreakdown = {
    distribute: { total: 0, parse_success: 0, expected_match: 0 },
    factor: { total: 0, parse_success: 0, expected_match: 0 },
    differentiate: { total: 0, parse_success: 0, expected_match: 0 },
    integrate: { total: 0, parse_success: 0, expected_match: 0 },
    solve: { total: 0, parse_success: 0, expected_match: 0 },
    evaluate: { total: 0, parse_success: 0, expected_match: 0 },
  };

  for (let i = 0; i < complexTestCases.length; i++) {
    const testCase = complexTestCases[i];
    const result = await runTestCase(testCase);
    detailedResults.push(result);

    // Update task breakdown
    if (taskBreakdown[testCase.task]) {
      taskBreakdown[testCase.task].total++;
      if (result.status === 'success') {
        taskBreakdown[testCase.task].parse_success++;
        results.parse_success++;
        if (result.expectedMatch !== false) {
          taskBreakdown[testCase.task].expected_match++;
          results.expected_match++;
        }
      } else if (result.status === 'parse_error') {
        results.parse_error++;
      } else if (result.status === 'analyze_error') {
        results.analyze_error++;
      } else if (result.status === 'structure_error') {
        results.structure_error++;
      } else if (result.status === 'runtime_error') {
        results.runtime_error++;
      }
    }

    console.log('');
  }

  console.log('\n=== MASTER TEST SUITE RESULTS ===');
  console.log(
    `✅ Parse Success: ${results.parse_success}/${complexTestCases.length} (${((results.parse_success / complexTestCases.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `🎯 Expected Match: ${results.expected_match}/${complexTestCases.length} (${((results.expected_match / complexTestCases.length) * 100).toFixed(1)}%)`
  );
  console.log(`❌ Parse Errors: ${results.parse_error}`);
  console.log(`⚠️  Analyze Errors: ${results.analyze_error}`);
  console.log(`🔧 Structure Errors: ${results.structure_error}`);
  console.log(`💥 Runtime Errors: ${results.runtime_error}`);

  console.log('\n=== TASK BREAKDOWN ===');
  Object.entries(taskBreakdown).forEach(([task, stats]) => {
    if (stats.total > 0) {
      const parseSuccessRate = ((stats.parse_success / stats.total) * 100).toFixed(1);
      const expectedMatchRate = ((stats.expected_match / stats.total) * 100).toFixed(1);
      console.log(
        `${task}: Parse Success ${stats.parse_success}/${stats.total} (${parseSuccessRate}%), Expected Match ${stats.expected_match}/${stats.total} (${expectedMatchRate}%)`
      );
    }
  });

  return {
    summary: results,
    detailedResults: detailedResults,
    taskBreakdown: taskBreakdown,
    testCount: complexTestCases.length,
    parseSuccessRate: ((results.parse_success / complexTestCases.length) * 100).toFixed(1),
    expectedMatchRate: ((results.expected_match / complexTestCases.length) * 100).toFixed(1),
  };
}

// Main execution
const startTime = new Date();
const testRunData = {
  timestamp: startTime.toISOString(),
  testType: 'Master Test Suite',
  description: 'Complex scenarios focusing on distribute and factor operations',
  specification: 'SPECIFICATION.md v3',
};

console.log('🚀 Starting Master Test Suite execution...\n');

const results = await runTestSuite();

console.log('\n🏆 MASTER TEST SUITE COMPLETED 🏆');

const endTime = new Date();
const duration = (endTime - startTime) / 1000;

testRunData.results = results;
testRunData.endTime = endTime.toISOString();
testRunData.duration = duration;
//testRunData.testCases = complexTestCases;

if (results.successRate > 80) {
  console.log('\n🎉 EXCELLENT: High implementation quality!');
} else if (results.successRate > 60) {
  console.log('\n👍 GOOD: Solid implementation with room for improvement');
} else {
  console.log('\n⚠️  NEEDS WORK: Significant issues detected');
}

console.log(`\n⏱️  Total execution time: ${duration.toFixed(2)}s`);
console.log('🔬 This suite tests complex mathematical operations per SPECIFICATION.md');

// Write output files
writeToFile('master-test-results.json', JSON.stringify(testRunData, null, 2));

const summaryReport = `LATEXIUM MASTER TEST SUITE REPORT
Generated: ${testRunData.timestamp}
Duration: ${duration.toFixed(2)}s
Specification: ${testRunData.specification}

OVERALL RESULTS:
Total Tests: ${results.testCount}
✅ Parse Success: ${results.summary.parse_success} (${results.parseSuccessRate}%)
🎯 Expected Match: ${results.summary.expected_match} (${results.expectedMatchRate}%)
❌ Parse Errors: ${results.summary.parse_error}
⚠️  Analyze Errors: ${results.summary.analyze_error}
🔧 Structure Errors: ${results.summary.structure_error}
💥 Runtime Errors: ${results.summary.runtime_error}

TASK PERFORMANCE:
${Object.entries(results.taskBreakdown)
  .filter(([, stats]) => stats.total > 0)
  .map(
    ([task, stats]) =>
      `${task}: Parse Success ${stats.parse_success}/${stats.total} (${((stats.parse_success / stats.total) * 100).toFixed(1)}%), Expected Match ${stats.expected_match}/${stats.total} (${((stats.expected_match / stats.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

FOCUS AREAS:
- Distribution operations: Primary test focus
- Factorization: Primary test focus  
- Other operations: Limited testing


QUALITY RATING: ${
  results.parseSuccessRate > 80 && results.expectedMatchRate > 80
    ? 'EXCELLENT'
    : results.parseSuccessRate > 60 || results.expectedMatchRate > 60
      ? 'GOOD'
      : 'NEEDS WORK'
}

This test suite validates complex mathematical operations according to SPECIFICATION.md v3.
Primary focus on distribute and factor operations with selective testing of other features.
`;

writeToFile('master-test-summary.txt', summaryReport);
writeToFile('master-test-log.txt', logBuffer);

console.log(`\n📁 Test results saved to tests/output/:`);
console.log(`   - master-test-results.json (detailed JSON data)`);
console.log(`   - master-test-summary.txt (summary report)`);
console.log(`   - master-test-log.txt (full console output)`);

console.log('\n✨ Master Test Suite execution completed successfully!');
