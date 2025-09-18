/**
 * Debug AST Node Validation
 */

import { parseLatex } from '../../dist/index.esm.js';
import { expandExpression } from '../../dist/index.esm.js';

console.log('=== Debug AST Node Validation ===\n');

function validateASTNode(node, path = 'root') {
  if (node === null || node === undefined) {
    console.error(`❌ Undefined/null node at: ${path}`);
    return false;
  }

  if (typeof node !== 'object') {
    console.error(`❌ Non-object node at: ${path}`, typeof node);
    return false;
  }

  if (!node.type) {
    console.error(`❌ No type property at: ${path}`, node);
    return false;
  }

  console.log(`✅ Valid node at ${path}: ${node.type}`);

  // Recursively validate child nodes
  switch (node.type) {
    case 'BinaryExpression':
      if (!validateASTNode(node.left, `${path}.left`)) return false;
      if (!validateASTNode(node.right, `${path}.right`)) return false;
      break;
    case 'UnaryExpression':
      if (!validateASTNode(node.operand, `${path}.operand`)) return false;
      break;
    case 'FunctionCall':
      if (node.args) {
        for (let i = 0; i < node.args.length; i++) {
          if (!validateASTNode(node.args[i], `${path}.args[${i}]`)) return false;
        }
      }
      break;
    case 'Fraction':
      if (!validateASTNode(node.numerator, `${path}.numerator`)) return false;
      if (!validateASTNode(node.denominator, `${path}.denominator`)) return false;
      break;
  }

  return true;
}

async function debugAstValidation() {
  const testExpression = '6x + 9';
  console.log(`Testing expression: ${testExpression}`);

  try {
    const parsed = parseLatex(testExpression);
    
    console.log('\n--- Validating parsed AST ---');
    if (validateASTNode(parsed.ast)) {
      console.log('✅ Parsed AST is valid');
    }

    console.log('\n--- Validating expanded AST ---');
    const expanded = expandExpression(parsed.ast);
    if (validateASTNode(expanded)) {
      console.log('✅ Expanded AST is valid');
    }

  } catch (error) {
    console.error('Error during validation:', error.message);
  }
}

debugAstValidation();