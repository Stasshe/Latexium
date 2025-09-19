// Test for perfect power output simplification
import { parseLatex, analyze } from '../../dist/index.esm.js';
import assert from 'assert';

const expr = 'x^3 - 3x^2 + 3x - 1';
const ast = parseLatex(expr);
const result = analyze(ast, { task: 'factor' });

console.log('Result:', result.resultLatex);
assert(result.resultLatex === '(x - 1)^3', 'Output should be (x - 1)^3');
console.log('Test passed!');
