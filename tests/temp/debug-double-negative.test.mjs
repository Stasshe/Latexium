import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== DOUBLE NEGATIVE DEBUG ===\n');

// Test double negative handling specifically
const testCases = [
  '--x',
  '-(-x)',
  '-(-x-1)',
  '-(-x-1-3x+x^2)',
  '-(-x+1)'
];

for (const testCase of testCases) {
  console.log(`Testing: ${testCase}`);
  
  const parseResult = parseLatex(testCase);
  if (parseResult.error) {
    console.log(`  Parse error: ${parseResult.error}`);
    continue;
  }
  
  console.log(`  AST: ${JSON.stringify(parseResult.ast, null, 2)}`);
  
  const analyzeResult = analyze(parseResult.ast, {
    task: 'simplify',
    variable: 'x'
  });
  
  console.log(`  Result: ${analyzeResult.value}`);
  console.log('');
}

console.log('=== SPECIFIC PROBLEMATIC EXPRESSION ===');
const problematic = '-(-x-1-3x+x^2)';
console.log(`Expression: ${problematic}`);

const parseResult = parseLatex(problematic);
if (!parseResult.error) {
  console.log('AST:');
  console.log(JSON.stringify(parseResult.ast, null, 2));
  
  const analyzeResult = analyze(parseResult.ast, {
    task: 'simplify', 
    variable: 'x'
  });
  
  console.log(`Simplified: ${analyzeResult.value}`);
  console.log('Expected: x + 1 + 3x - x^2 = 4x + 1 - x^2');
}