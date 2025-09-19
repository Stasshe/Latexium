// Test for exponential simplification with expand: false (AST and result)
import { parseLatex, analyze } from '../../dist/index.esm.js';

const expr = '(x-1)^3';
const ast = parseLatex(expr);
const result = analyze(ast, { task: 'simplify', options: { expand: false } });

console.log('AST:', JSON.stringify(ast, null, 2));
console.log('Result:', result.resultLatex);
console.log('Result AST:', JSON.stringify(result.resultAst, null, 2));
