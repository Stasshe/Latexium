import { parseLatex, analyze } from '../../dist/index.esm.js';

function testQuarticAsQuadratic() {
    console.log('=== Debugging Quartic as Quadratic Factorization ===\n');
    
    const testCases = [
        {
            expression: 'x^4 - 13x^2 + 36',
            expected: '(x^2 - 4)(x^2 - 9)'
        },
        {
            expression: 'x^4 - 5x^2 + 4', 
            expected: '(x^2 - 1)(x^2 - 4)'
        },
        {
            expression: 'x^4 - 10x^2 + 9',
            expected: '(x^2 - 1)(x^2 - 9)'
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.expression}`);
        
        try {
            const ast = parseLatex(testCase.expression);
            console.log('Parsed AST:', JSON.stringify(ast, null, 2));
            
            const result = analyze(ast, { task: 'factor' });
            console.log('Result:', result.expression);
            console.log('Expected:', testCase.expected);
            console.log('Match:', result.expression === testCase.expected);
            console.log('Steps taken:', result.steps.length);
            
            // Show steps for debugging
            console.log('Steps:');
            result.steps.forEach((step, i) => {
                console.log(`  ${i + 1}. ${step.type}: ${step.expression}`);
            });
            
        } catch (error) {
            console.error('Error:', error.message);
        }
        
        console.log('---');
    });
}

testQuarticAsQuadratic();