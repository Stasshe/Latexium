// LLL x^5-1 factorization test
// Usage: node ./tests/temp/lll-x5minus1.test.mjs
import { parseLatex, analyze } from '../../dist/index.esm.js';

const expr = 'x^5-1';
const ast = parseLatex(expr);
const result = analyze(ast, { factor: true });
console.log('input:', expr);
console.log('factored:', result?.factorizedLatex || result?.latex || result);
