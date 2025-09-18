import { parseLatex } from '../../dist/index.esm.js';

function showAST(expr) {
  const parsed = parseLatex(expr);
  console.log('Input:', expr);
  console.log('AST:', JSON.stringify(parsed && parsed.ast, null, 2));
  console.log('---');
}

showAST('sin(2pi)');
showAST('cos(pi)');
showAST('tan(0)');
showAST('1/3 + 1/6');
showAST('6/8');
