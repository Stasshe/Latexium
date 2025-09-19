// Test for exponential simplification with expand: false
import { parseLatex, analyze } from '../../dist/index.esm.js';
import assert from 'assert';

const expr = '(x-1)^3';
const ast = parseLatex(expr);
const result = analyze(ast, { task: 'simplify', options: { expand: false } });

console.log('Result:', result.resultLatex);
assert(result.resultLatex === '(x - 1)^{3}', 'Output should be (x - 1)^{3}');
console.log('Test passed!');
