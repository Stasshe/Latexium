import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('Testing 1/x integration...');
const result = parseLatex('\\frac{1}{x}');
console.log('Parse result:', JSON.stringify(result, null, 2));
if (!result.error) {
  const integral = analyze(result.ast, { task: 'integrate', variable: 'x' });
  console.log('Integration result:', integral);
}