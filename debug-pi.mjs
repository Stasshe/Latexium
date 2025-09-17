import { LaTeXParser } from './dist/parser/parser.js';
import { LaTeXTokenizer } from './dist/parser/tokenizer.js';

console.log('Debugging \\pi + 2\\pi parsing step by step:');

// Step 1: Get tokens
const tokenizer = new LaTeXTokenizer('\\pi + 2\\pi');
const tokens = tokenizer.tokenize();
console.log('Tokens:', tokens);

// Step 2: Try parsing manually
try {
  const parser = new LaTeXParser(tokens);
  const ast = parser.parse();
  console.log('Parse success:', JSON.stringify(ast, null, 2));
} catch (error) {
  console.log('Parse error:', error.message);
}

// Step 3: Try simpler cases
console.log('\nTesting simpler cases:');
const testCases = ['\\pi', '\\pi+1', '1+\\pi', '\\pi+\\pi'];

for (const testCase of testCases) {
  try {
    const tokenizerTest = new LaTeXTokenizer(testCase);
    const tokensTest = tokenizerTest.tokenize();
    const parserTest = new LaTeXParser(tokensTest);
    const astTest = parserTest.parse();
    console.log(`✅ ${testCase}: SUCCESS`);
  } catch (error) {
    console.log(`❌ ${testCase}: ${error.message}`);
  }
}