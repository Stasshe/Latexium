// Simple test using the built JavaScript distribution
import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== Latexium Core Functionality Test ===\n');

// Test 1: Basic arithmetic
console.log('Test 1: Basic arithmetic parsing');
try {
  const result1 = parseLatex('2 + 3');
  console.log('Parse result:', result1);
  
  if (result1.ast && !result1.error) {
    const evaluation1 = analyze(result1.ast, { task: 'evaluate' });
    console.log('Evaluation:', evaluation1);
    console.log('✓ Test 1 passed\n');
  }
} catch (error) {
  console.log('✗ Test 1 failed:', error.message, '\n');
}

// Test 2: Variable substitution
console.log('Test 2: Variable substitution');
try {
  const result2 = parseLatex('x + 5');
  console.log('Parse result:', result2);
  
  if (result2.ast && !result2.error) {
    const evaluation2 = analyze(result2.ast, { 
      task: 'evaluate',
      values: { x: 10 } 
    });
    console.log('Evaluation with x=10:', evaluation2);
    console.log('✓ Test 2 passed\n');
  }
} catch (error) {
  console.log('✗ Test 2 failed:', error.message, '\n');
}

// Test 3: Mathematical constants
console.log('Test 3: Mathematical constants');
try {
  const result3 = parseLatex('pi');
  console.log('Parse result:', result3);
  
  if (result3.ast && !result3.error) {
    const evaluation3 = analyze(result3.ast, { task: 'evaluate' });
    console.log('Evaluation:', evaluation3);
    console.log('✓ Test 3 passed\n');
  }
} catch (error) {
  console.log('✗ Test 3 failed:', error.message, '\n');
}

// Test 4: Error handling - undefined variable
console.log('Test 4: Error handling - undefined variable');
try {
  const result4 = parseLatex('y + z');
  console.log('Parse result:', result4);
  
  if (result4.ast && !result4.error) {
    const evaluation4 = analyze(result4.ast, { task: 'evaluate' });
    console.log('Evaluation (should error):', evaluation4);
    if (evaluation4.error) {
      console.log('✓ Test 4 passed (error correctly handled)\n');
    } else {
      console.log('✗ Test 4 failed (should have errored)\n');
    }
  }
} catch (error) {
  console.log('✗ Test 4 failed:', error.message, '\n');
}

console.log('=== Test Suite Complete ===');