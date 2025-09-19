// Test for subscript (underscore) parsing: definite integral and log base
import { parseLatex } from '../../dist/index.esm.js';

function printAST(ast) {
  return JSON.stringify(ast, null, 2);
}

function testIntegral() {
  const input = String.raw`\int_{0}^{1} x^2 dx`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

function testLogBase() {
  const input = String.raw`\log_{2}{n}`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

testIntegral();
testLogBase();
