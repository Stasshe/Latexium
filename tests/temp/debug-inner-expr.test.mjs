import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== DETAILED AST STRUCTURE ANALYSIS ===\n');

// Test the parsing of -x-1-3x+x^2
const innerExpr = '-x-1-3x+x^2';
console.log(`Inner expression: ${innerExpr}`);

const innerParseResult = parseLatex(innerExpr);
if (!innerParseResult.error) {
  console.log('Inner AST structure:');
  console.log(JSON.stringify(innerParseResult.ast, null, 2));
  
  const innerSimplifyResult = analyze(innerParseResult.ast, {
    task: 'distribute',
    variable: 'x'
  });
  
  console.log(`Inner simplified: ${innerSimplifyResult.value}`);
  
  // Expected: -x - 1 - 3x + x^2 = -4x - 1 + x^2
  console.log('Expected inner simplified: -4x - 1 + x^2');
}

console.log('\n=== NEGATION OF INNER EXPRESSION ===');

const negatedExpr = '-(-x-1-3x+x^2)';
console.log(`Negated: ${negatedExpr}`);

const negatedParseResult = parseLatex(negatedExpr);
if (!negatedParseResult.error) {
  console.log('Negated AST structure:');
  console.log(JSON.stringify(negatedParseResult.ast, null, 2));
  
  const negatedSimplifyResult = analyze(negatedParseResult.ast, {
    task: 'distribution',
    variable: 'x'
  });
  
  console.log(`Negated simplified: ${negatedSimplifyResult.value}`);
  
  // Expected: -(-4x - 1 + x^2) = 4x + 1 - x^2
  console.log('Expected negated simplified: 4x + 1 - x^2');
}

console.log('\n=== STEP BY STEP MANUAL VERIFICATION ===');
console.log('Original: -x-1-3x+x^2');
console.log('Groups: (-x) + (-1) + (-3x) + (x^2)');
console.log('Simplified: -x - 1 - 3x + x^2 = -4x - 1 + x^2');
console.log('');
console.log('Negation: -(-4x - 1 + x^2)');
console.log('Distribute minus: -(-4x) - (-1) - (x^2)');
console.log('Result: 4x + 1 - x^2');