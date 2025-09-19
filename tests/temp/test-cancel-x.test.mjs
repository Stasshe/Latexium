import { parseLatex, analyze } from '../../dist/index.esm.js';

function test() {
  const cases = [
    'x + (-x + 1)',
    'x + (1 - x)',
    'y + (-y + 2)',
    'y + (2 - y)',
    'x + (-x - 3)',
    'x + (-x)',
    'x + (5 - x)',
    'x + (-x + y)',
    'x + (y - x)',
  ];
  for (const input of cases) {
    const ast = parseLatex(input).ast;
    const result = analyze(ast, { task: 'distribute' });
    console.log(`${input} => ${result.value}`);
  }
}

test();
