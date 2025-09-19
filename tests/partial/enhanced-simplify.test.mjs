/**
 * Enhanced Simplification Test Suite
 * Tests for advanced fraction reduction and factorization
 */

import { parseLatex, analyze } from '../dist/index.esm.js';

// Helper function to run tests
function runTest(expression, expected, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`Expression: ${expression}`);

  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse Error: ${parseResult.error}`);
      return false;
    }

    const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
    if (analyzeResult.error) {
      console.log(`❌ Analyze Error: ${analyzeResult.error}`);
      return false;
    }

    const result = analyzeResult.value;
    console.log(`Expected: ${expected}`);
    console.log(`Got: ${result}`);

    if (result === expected) {
      console.log(`✅ PASS`);
      return true;
    } else {
      console.log(`❌ FAIL`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Helper function to test simplification without evaluation
function testSimplify(expression, description) {
  console.log(`\n🔧 Testing Simplification: ${description}`);
  console.log(`Expression: ${expression}`);

  try {
    const parseResult = parseLatex(expression);
    if (parseResult.error) {
      console.log(`❌ Parse Error: ${parseResult.error}`);
      return false;
    }

    const analyzeResult = analyze(parseResult.ast, { task: 'evaluate' });
    if (analyzeResult.error) {
      console.log(`❌ Analyze Error: ${analyzeResult.error}`);
      return false;
    }

    console.log(`Simplified result: ${analyzeResult.value}`);
    console.log(`✅ Simplified successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

console.log('🚀 Enhanced Simplification Tests');
console.log('=====================================');

let passed = 0;
let total = 0;

// Test 1: Basic fraction reduction
total++;
if (runTest('\\frac{6}{9}', '\\frac{2}{3}', 'Basic fraction reduction')) {
  passed++;
}

// Test 2: Fraction addition with reduction
total++;
if (
  runTest(
    '\\frac{1}{4} + \\frac{1}{6}',
    '\\frac{5}{12}',
    'Fraction addition with automatic reduction'
  )
) {
  passed++;
}

// Test 3: Fraction multiplication with reduction
total++;
if (
  runTest('\\frac{2}{3} * \\frac{9}{4}', '\\frac{3}{2}', 'Fraction multiplication with reduction')
) {
  passed++;
}

// Test 4: Complex fraction reduction
total++;
if (runTest('\\frac{12}{18}', '\\frac{2}{3}', 'Complex fraction reduction (GCD=6)')) {
  passed++;
}

// Test 5: Negative fraction reduction
total++;
if (runTest('\\frac{-15}{25}', '\\frac{-3}{5}', 'Negative fraction reduction')) {
  passed++;
}

// Test 6: Mixed number and fraction
total++;
if (runTest('2 * \\frac{3}{4}', '\\frac{3}{2}', 'Number times fraction')) {
  passed++;
}

// Test 7: Fraction division (using multiplication by reciprocal)
total++;
if (
  runTest(
    '\\frac{2}{3} * \\frac{5}{4}',
    '\\frac{5}{6}',
    'Fraction multiplication (simulating division)'
  )
) {
  passed++;
}

// Test 8: Zero in numerator
total++;
if (runTest('\\frac{0}{5}', '0', 'Zero numerator simplification')) {
  passed++;
}

// Test 9: Same numerator and denominator
total++;
if (runTest('\\frac{x}{x}', '1', 'Same variable in numerator and denominator')) {
  passed++;
}

// Test 10: Common factor extraction (simple)
total++;
testSimplify('6x + 9', 'Common factor extraction (3)');

// Test 11: Like terms combination
total++;
testSimplify('2x + 3x + x', 'Like terms combination');

// Test 12: Difference of squares pattern
total++;
testSimplify('x^2 - 4', 'Difference of squares (x² - 4)');

// Test 13: Complex fraction with variables
total++;
testSimplify('\\frac{2x}{4y}', 'Variable fraction simplification');

// Test 14: Nested fractions
total++;
testSimplify('\\frac{\\frac{1}{2}}{\\frac{3}{4}}', 'Nested fraction simplification');

// Test 15: Multiple operations with fractions
total++;
testSimplify('\\frac{1}{2} + \\frac{1}{3} - \\frac{1}{6}', 'Multiple fraction operations');

console.log('\n📊 Test Results');
console.log('================');
console.log(`Passed: ${passed}/${total}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (passed === total) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️  Some tests failed. Check the output above for details.');
}
