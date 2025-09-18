/**
 * Test astToLatex conversion for factored expressions
 */

import { parseLatex } from '../../dist/index.esm.js';

// Test parsing different expressions to see the LaTeX conversion behavior
console.log('🔍 Testing LaTeX conversion\n');

// Test 1: Simple product (x+2)(x-2)
console.log('=== Test 1: Parsing (x+2)(x-2) ===');
const test1 = parseLatex('(x+2)(x-2)');
console.log('Result:', test1.value);
console.log('AST:', JSON.stringify(test1.ast, null, 2));

// Test 2: x^2 - 4 
console.log('\n=== Test 2: Parsing x^2 - 4 ===');
const test2 = parseLatex('x^2 - 4');
console.log('Result:', test2.value);

// Test 3: Factor x^2 - 4
console.log('\n=== Test 3: Factoring x^2 - 4 ===');
const test3 = parseLatex('x^2 - 4');
// We can use the analyze function to test factorization
import { analyze } from '../../dist/index.esm.js';
const factorResult = analyze(test3.ast, { task: 'factor' });
console.log('Factor result value:', factorResult.value);
console.log('Factor result AST type:', factorResult.ast?.type);
console.log('Factor result AST:', JSON.stringify(factorResult.ast, null, 2));

// The issue seems to be that the AST is correctly created as a product 
// but the LaTeX conversion is not handling it properly