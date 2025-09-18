import { parseLatex } from '../dist/index.esm.js';

// Import specific functions for testing
const { extractCommutativeCoefficient, AdvancedTermAnalyzer } = await import('../src/utils/commutative.ts');

console.log('Debug coefficient extraction...\n');

const expr = '6x^2';
console.log(`Testing extraction for: ${expr}`);

try {
  const ast = parseLatex(expr);
  console.log('Original AST:', JSON.stringify(ast.ast, null, 2));
  
  const analyzed = AdvancedTermAnalyzer.analyze(ast.ast);
  console.log('Analyzed term:', analyzed);
  
  const extracted = extractCommutativeCoefficient(ast.ast);
  console.log('Extracted coefficient:', extracted.coefficient);
  console.log('Canonical form:', JSON.stringify(extracted.canonicalForm, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}