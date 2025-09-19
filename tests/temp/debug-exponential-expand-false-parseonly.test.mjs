// Test for exponential simplification with expand: false (raw parse output only)
import { parseLatex } from '../../dist/index.esm.js';

const expr = '(x-1)^3';
const ast = parseLatex(expr);
console.log('AST:', JSON.stringify(ast, null, 2));
