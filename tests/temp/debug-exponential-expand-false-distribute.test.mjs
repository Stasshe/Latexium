// Test for exponential simplification with expand: false (task: 'distribute')
import { parseLatex, analyze } from '../../dist/index.esm.js';

const expr = '(x-1)(x-1)(x-1)';
const ast = parseLatex(expr);
const result = analyze(ast, { task: 'evaluate'});

console.log('Full analyze result:', result);
