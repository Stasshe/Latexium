import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== SIMPLIFICATION TEST SUITE ===\n');

const simplifyTests = [
  // 基本的な簡約テスト
  {
    expression: '\\frac{6}{9}',
    task: 'evaluate',
    expected: '\\frac{2}{3}', // 約分
    description: 'Fraction reduction'
  },
  {
    expression: '\\frac{4}{6}',
    task: 'evaluate', 
    expected: '\\frac{2}{3}',
    description: 'Fraction reduction GCD'
  },
  {
    expression: '\\frac{1}{2} + \\frac{1}{3}',
    task: 'evaluate',
    expected: '\\frac{5}{6}', // 通分
    description: 'Fraction addition'
  },
  {
    expression: '2x + 3x',
    task: 'evaluate',
    expected: '5x', // 同類項のまとめ
    description: 'Like terms combination'
  },
  {
    expression: 'x + 0',
    task: 'evaluate',
    expected: 'x', // ゼロの除去
    description: 'Zero addition elimination'
  },
  {
    expression: 'x * 1',
    task: 'evaluate',
    expected: 'x', // 1の乗算除去
    description: 'Multiplicative identity'
  },
  {
    expression: 'x * 0',
    task: 'evaluate',
    expected: '0', // ゼロ乗算
    description: 'Zero multiplication'
  },
  {
    expression: 'x^1',
    task: 'evaluate',
    expected: 'x', // 1乗の簡約
    description: 'Power of 1'
  },
  {
    expression: 'x^0',
    task: 'evaluate',
    expected: '1', // 0乗の簡約
    description: 'Power of 0'
  },
  {
    expression: '\\frac{x}{1}',
    task: 'evaluate',
    expected: 'x', // 1で除算
    description: 'Division by 1'
  },
  {
    expression: '\\sin^2(x) + \\cos^2(x)',
    task: 'evaluate',
    expected: '1', // 三角関数の恒等式
    description: 'Trigonometric identity'
  },
  {
    expression: '\\frac{x^2 - 1}{x - 1}',
    task: 'evaluate',
    expected: 'x + 1', // 分数の約分（因数分解）
    description: 'Rational function simplification'
  },
  {
    expression: '\\frac{x + 1}{x + 1}',
    task: 'evaluate',
    expected: '1', // 同じ因子の約分
    description: 'Common factor cancellation'
  },
  {
    expression: '2 + 2 + 2',
    task: 'evaluate',
    expected: '6', // 定数の加算
    description: 'Constant addition'
  },
  {
    expression: '\\frac{\\frac{1}{2}}{\\frac{1}{3}}',
    task: 'evaluate',
    expected: '\\frac{3}{2}', // 複分数の簡約
    description: 'Complex fraction simplification'
  },
  {
    expression: '-x(1 -(-x-1-3x+x^2)+ x-(-x+1)-x)-1',
    task: 'simplify',
    expected: 'x^3 + 4x^2 + 2x - 2',
  }
];

async function runSimplifyTest(test, index) {
  console.log(`Test ${index + 1}: ${test.expression}`);
  console.log(`Description: ${test.description}`);
  console.log(`Expected: ${test.expected}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      return { status: 'parse_error', error: parseResult.error };
    }
    
    const analyzeResult = analyze(parseResult.ast, {
      task: test.task,
      variable: 'x'
    });
    
    if (analyzeResult.error) {
      console.log(`⚠️  ANALYZE ERROR: ${analyzeResult.error}`);
      return { status: 'analyze_error', error: analyzeResult.error };
    }
    
    console.log(`✅ RESULT: ${analyzeResult.value}`);
    console.log(`   Type: ${analyzeResult.valueType}`);
    
    // 期待値との比較
    const expected = test.expected;
    const actual = analyzeResult.value;
    
    if (actual === expected) {
      console.log(`✅ EXPECTED MATCH`);
      return { status: 'success', match: true };
    } else {
      console.log(`⚠️  EXPECTED MISMATCH:`);
      console.log(`   Got: "${actual}"`);
      console.log(`   Expected: "${expected}"`);
      return { status: 'success', match: false, actual, expected };
    }
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { status: 'runtime_error', error: error.message };
  }
}

// テストの実行
let passed = 0;
let failed = 0;

for (let i = 0; i < simplifyTests.length; i++) {
  const result = await runSimplifyTest(simplifyTests[i], i);
  
  if (result.status === 'success' && result.match) {
    passed++;
  } else {
    failed++;
  }
  
  console.log('');
}

console.log(`\n=== SIMPLIFICATION TEST SUMMARY ===`);
console.log(`✅ Passed: ${passed}/${simplifyTests.length}`);
console.log(`❌ Failed: ${failed}/${simplifyTests.length}`);
console.log(`📊 Success Rate: ${((passed / simplifyTests.length) * 100).toFixed(1)}%`);

if (passed / simplifyTests.length < 0.5) {
  console.log('\n⚠️  SIMPLIFICATION NEEDS MAJOR IMPROVEMENT');
  console.log('Most basic simplification features are not working properly.');
} else if (passed / simplifyTests.length < 0.8) {
  console.log('\n👍 SIMPLIFICATION PARTIALLY WORKING');
  console.log('Some simplification features work, but needs enhancement.');
} else {
  console.log('\n🎉 SIMPLIFICATION WORKING WELL');
  console.log('Most simplification features are implemented correctly.');
}