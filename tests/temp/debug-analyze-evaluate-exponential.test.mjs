// Test for analyzeEvaluate with free variable and (x-1)^3 AST
import { analyzeEvaluate } from '../../dist/index.esm.js';

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

const result = analyzeEvaluate(ast, { task: 'evaluate' });
console.log('Full analyzeEvaluate result:', result);
