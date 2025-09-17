/**
 * Basic Tests for Latexium Core Functionality
 * Tests parsing, evaluation, and error handling
 */

import { analyze, parseLatex } from '../src';

// Test 1: Basic arithmetic parsing and evaluation
console.log('=== Test 1: Basic Arithmetic ===');
const test1 = parseLatex('2 + 3 * 4');
console.log('Parse result:', test1);

if (test1.ast) {
  const result1 = analyze(test1.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result1);
  console.log('Expected: 14, Got:', result1.value);
}

// Test 2: Variable substitution
console.log('\n=== Test 2: Variable Substitution ===');
const test2 = parseLatex('a + b * 2');
console.log('Parse result:', test2);

if (test2.ast) {
  const result2 = analyze(test2.ast, {
    task: 'evaluate',
    values: { a: 5, b: 3 },
  });
  console.log('Evaluation result:', result2);
  console.log('Expected: 11, Got:', result2.value);
}

// Test 3: Mathematical constants
console.log('\n=== Test 3: Mathematical Constants ===');
const test3 = parseLatex('pi + e');
console.log('Parse result:', test3);

if (test3.ast) {
  const result3 = analyze(test3.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result3);
  console.log('Expected: ~5.859, Got:', result3.value);
}

// Test 4: Function calls
console.log('\n=== Test 4: Function Calls ===');
const test4 = parseLatex('\\sin(pi/2)');
console.log('Parse result:', test4);

if (test4.ast) {
  const result4 = analyze(test4.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result4);
  console.log('Expected: 1, Got:', result4.value);
}

// Test 5: Fractions
console.log('\n=== Test 5: Fractions ===');
const test5 = parseLatex('\\frac{6}{3}');
console.log('Parse result:', test5);

if (test5.ast) {
  const result5 = analyze(test5.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result5);
  console.log('Expected: 2, Got:', result5.value);
}

// Test 6: Error handling - undefined variable
console.log('\n=== Test 6: Error Handling - Undefined Variable ===');
const test6 = parseLatex('x + y');
console.log('Parse result:', test6);

if (test6.ast) {
  const result6 = analyze(test6.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result6);
  console.log('Expected error for undefined variables');
}

// Test 7: Error handling - reserved words
console.log('\n=== Test 7: Error Handling - Reserved Words ===');
const test7 = parseLatex('sin + cos');
console.log('Parse result:', test7);
console.log('Expected error for using reserved function names as variables');

// Test 8: Power operations
console.log('\n=== Test 8: Power Operations ===');
const test8 = parseLatex('2^3');
console.log('Parse result:', test8);

if (test8.ast) {
  const result8 = analyze(test8.ast, { task: 'evaluate' });
  console.log('Evaluation result:', result8);
  console.log('Expected: 8, Got:', result8.value);
}

console.log('\n=== Basic Tests Complete ===');
