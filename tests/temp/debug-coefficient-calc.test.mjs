/**
 * Debug Coefficient Calculation
 * Testing specific coefficient calculation issues
 */

import { parseLatex } from '../../dist/index.esm.js';

console.log('🔍 Debugging Coefficient Calculation\n');

// Test simple case step by step
const expression = '6x + 9';
const parseResult = parseLatex(expression);

console.log('AST Structure:');
console.log('Root:', parseResult.ast.type, parseResult.ast.operator);
console.log('Left:', parseResult.ast.left.type, parseResult.ast.left.operator);
console.log('  Left.Left:', parseResult.ast.left.left.type, parseResult.ast.left.left.value);
console.log('  Left.Right:', parseResult.ast.left.right.type, parseResult.ast.left.right.name);
console.log('Right:', parseResult.ast.right.type, parseResult.ast.right.value);

// The issue is likely in how we extract terms and coefficients
// Let's trace through what should happen:

console.log('\n=== Expected Term Extraction ===');
console.log('BinaryExpression(+)');
console.log('├── Left: BinaryExpression(*) -> 6 * x = 6x with coefficient=6, variables={x:1}');
console.log('└── Right: NumberLiteral(9) -> 9 with coefficient=9, variables={}');

console.log('\n=== The coefficient calculation might be doubling somewhere ===');
console.log('If we see 22x + 33, it suggests:');
console.log('- Original: 6x + 9');
console.log('- GCD: 3');
console.log('- Should be: 6/3 = 2, 9/3 = 3 -> 2x + 3');
console.log('- But getting: 22x + 33 means something is adding/multiplying incorrectly');

console.log('\nTesting factor analysis manually...');