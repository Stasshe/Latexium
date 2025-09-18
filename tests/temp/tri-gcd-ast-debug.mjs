import { parseLatex, analyze } from '../../dist/index.esm.js';

function showAST(expr) {
  const parsed = parseLatex(expr);
  const ans = analyze(parsed.ast, { task: 'simplify', variable: 'x' });
  console.log('ans', ans.value);
  console.log('---');
}

showAST('sin(2pi)');
showAST('cos(pi)');
showAST('tan(0)');
showAST('1/3 + 1/6');
showAST('6/8');
