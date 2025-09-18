console.log('=== MANUAL CALCULATION ===\n');

// Original: -x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1
// Let's break it down step by step:

console.log('Step 1: Inner expression breakdown');
console.log('1 -(-x-1-3x+x^2)+ x-(-x+1)-x');

console.log('\nStep 2: Simplify -(-x-1-3x+x^2)');
console.log('-(-x-1-3x+x^2) = -(-x) - (-1) - (-3x) + (-x^2)');
console.log('                = x + 1 + 3x - x^2');
console.log('                = 4x + 1 - x^2');

console.log('\nStep 3: Simplify -(-x+1)');
console.log('-(-x+1) = -(-x) - (1) = x - 1');

console.log('\nStep 4: Substitute back into inner expression');
console.log('1 + (4x + 1 - x^2) + x + (x - 1) - x');
console.log('= 1 + 4x + 1 - x^2 + x + x - 1 - x');
console.log('= (1 + 1 - 1) + (4x + x + x - x) - x^2');
console.log('= 1 + 5x - x^2');

console.log('\nStep 5: Apply outer multiplication by -x');
console.log('-x(1 + 5x - x^2)');
console.log('= -x * 1 + -x * 5x + -x * (-x^2)');
console.log('= -x - 5x^2 + x^3');

console.log('\nStep 6: Subtract 1');
console.log('(-x - 5x^2 + x^3) - 1');
console.log('= x^3 - 5x^2 - x - 1');

console.log('\nHowever, expected result is: x^3 + 4x^2 + 2x - 2');
console.log('There seems to be a discrepancy. Let me recalculate...');

console.log('\n=== RECALCULATION ===');

console.log('Let me be more careful with the parsing:');
console.log('Original: -x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1');

console.log('\nLet me parse this more carefully:');
console.log('The expression inside parentheses is:');
console.log('1 - (-x-1-3x+x^2) + x - (-x+1) - x');

console.log('\nStep 1: -(-x-1-3x+x^2)');
console.log('= -(-x) -(-1) -(-3x) -(x^2)');  
console.log('= x + 1 + 3x - x^2');
console.log('= 4x + 1 - x^2');

console.log('\nStep 2: -(-x+1)'); 
console.log('= -(-x) -(+1)');
console.log('= x - 1');

console.log('\nStep 3: Combine all terms');
console.log('1 + (4x + 1 - x^2) + x + (x - 1) - x');
console.log('= 1 + 4x + 1 - x^2 + x + x - 1 - x');
console.log('= (1 + 1 - 1) + (4x + x + x - x) - x^2');
console.log('= 1 + 5x - x^2');

console.log('\nStep 4: Multiply by -x');
console.log('-x(1 + 5x - x^2) = -x - 5x^2 + x^3');

console.log('\nStep 5: Subtract 1');
console.log('x^3 - 5x^2 - x - 1');

console.log('\nBut wait, let me check if I\'m parsing the original expression correctly...');
console.log('Maybe there\'s an issue with how the parentheses are being parsed?');