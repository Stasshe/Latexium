import { parseLatex, analyze } from '../../dist/index.esm.js';

console.log('=== COMPLEX DISTRIBUTION DEBUG ===\n');

const expression = '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1';
console.log(`Original expression: ${expression}`);

// Parse the expression
const parseResult = parseLatex(expression);

if (parseResult.error) {
  console.log(`Parse error: ${parseResult.error}`);
}

console.log('\n=== AST Structure ===');
console.log(JSON.stringify(parseResult.ast, null, 2));

// Analyze with simplify task
console.log('\n=== Simplify Analysis ===');
const simplifyResult = analyze(parseResult.ast, {
  task: 'distribute',
  variable: 'x'
});

console.log(`Result: ${simplifyResult.value}`);
console.log(`Expected: x^3 + 4x^2 + 2x - 2`);

// Let's manually work through the inner expression step by step
console.log('\n=== Step-by-step Manual Analysis ===');

// First, let's analyze the inner expression: 1 -(-x-1-3x+x^2)+ x-(-x+1)-x
const innerExpression = '1 -(-x-1-3x+x^2)+ x-(-x+1)-x';
console.log(`Inner expression: ${innerExpression}`);

const innerParseResult = parseLatex(innerExpression);
if (!innerParseResult.error) {
  console.log('\nInner AST:');
  console.log(JSON.stringify(innerParseResult.ast, null, 2));
  
  const innerSimplifyResult = analyze(innerParseResult.ast, {
    task: 'distribute',
    variable: 'x'
  });
  console.log(`Inner simplified: ${innerSimplifyResult.value}`);
}

// Then the negative of that
const negativeInnerExpression = `-(-x-1-3x+x^2)`;
console.log(`\nNegative inner: ${negativeInnerExpression}`);

const negativeInnerParseResult = parseLatex(negativeInnerExpression);
if (!negativeInnerParseResult.error) {
  const negativeInnerSimplifyResult = analyze(negativeInnerParseResult.ast, {
    task: 'distribute',
    variable: 'x'
  });
  console.log(`Negative inner simplified: ${negativeInnerSimplifyResult.value}`);
}

// Break down components
console.log('\n=== Component Analysis ===');

const components = [
  '1',
  '-(-x-1-3x+x^2)',
  'x',
  '-(-x+1)',
  '-x'
];

for (const component of components) {
  const componentParseResult = parseLatex(component);
  if (!componentParseResult.error) {
    const componentSimplifyResult = analyze(componentParseResult.ast, {
      task: 'distribute',
      variable: 'x'
    });
    console.log(`${component} → ${componentSimplifyResult.value}`);
  }
}