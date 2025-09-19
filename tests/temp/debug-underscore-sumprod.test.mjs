// Test for subscript (underscore) parsing: sum, prod, and other common LaTeX constructs
import { parseLatex } from '../../dist/index.esm.js';

function printAST(ast) {
  return JSON.stringify(ast, null, 2);
}

function testSum() {
  const input = String.raw`\sum_{i=1}^{n} i^2`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

function testProd() {
  const input = String.raw`\prod_{k=1}^{N} k`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

function testIntegralNoBounds() {
  const input = String.raw`\int x dx`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

function testSumNoBounds() {
  const input = String.raw`\sum i`;
  const result = parseLatex(input);
  console.log('input:', input);
  if (result.error) {
    console.error('error:', result.error);
  } else {
    console.log('ast:', printAST(result.ast));
  }
}

testSum();
testProd();
testIntegralNoBounds();
testSumNoBounds();
