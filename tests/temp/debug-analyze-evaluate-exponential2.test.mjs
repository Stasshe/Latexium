// Test for analyze (task: evaluate) with direct AST input
import { analyze } from '../../dist/index.esm.js';

const ast = {
  type: 'BinaryExpression',
  operator: '^',
  left: {
    type: 'BinaryExpression',
    operator: '-',
    left: { type: 'Identifier', name: 'x', scope: 'free', uniqueId: 'free_x' },
    right: { type: 'NumberLiteral', value: 1 }
  },
  right: { type: 'NumberLiteral', value: 3 }
};

const result = analyze(ast, { task: 'evaluate' });
console.log('Full analyze result:', result);
