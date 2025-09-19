// Test for exponential simplification with expand: false (raw analyze output)
import { parseLatex, analyze } from '../../dist/index.esm.js';

const expr = '(x-1)^3';
const ast = parseLatex(expr);
const result = analyze(ast, { task: 'simplify', options: { expand: false } });

console.log('Full analyze result:', result);
