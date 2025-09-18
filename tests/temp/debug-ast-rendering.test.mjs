/**
 * Test AST to LaTeX conversion
 * Check if the issue is in the rendering
 */

console.log('🔍 Testing AST to LaTeX conversion\n');

// Manually create the expected AST for (x+2)(x-2)
const expectedAST = {
  type: 'BinaryExpression',
  operator: '*',
  left: {
    type: 'BinaryExpression',
    operator: '+',
    left: {
      type: 'Identifier',
      name: 'x',
      scope: 'free',
      uniqueId: 'free_x'
    },
    right: {
      type: 'NumberLiteral',
      value: 2
    }
  },
  right: {
    type: 'BinaryExpression',
    operator: '-',
    left: {
      type: 'Identifier',
      name: 'x',
      scope: 'free',
      uniqueId: 'free_x'
    },
    right: {
      type: 'NumberLiteral',
      value: 2
    }
  }
};

// This should represent (x+2)(x-2)
console.log('Expected AST for (x+2)(x-2):');
console.log(JSON.stringify(expectedAST, null, 2));

// The issue might be that the conversion or analyzer is not preserving the factored form
// Let's check what our factorization is actually producing