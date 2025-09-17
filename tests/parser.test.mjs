import { parseLatex, analyze } from '../dist/index.esm.js';

console.log('=== PARSER IMPROVEMENT TEST ===\n');

const parserTests = [
  // 隠れた乗算のテスト
  {
    expression: '2x',
    expected_parse: true,
    description: 'Implicit multiplication: number × variable'
  },
  {
    expression: 'xy',
    expected_parse: true, 
    description: 'Implicit multiplication: variable × variable'
  },
  {
    expression: '3\\sin(x)',
    expected_parse: true,
    description: 'Implicit multiplication: number × function'
  },
  {
    expression: 'x(y+1)',
    expected_parse: true,
    description: 'Implicit multiplication: variable × parentheses'
  },
  {
    expression: '2(x+1)',
    expected_parse: true,
    description: 'Implicit multiplication: number × parentheses'
  },
  // 関数指数記法のテスト
  {
    expression: '\\sin^{2}(x)',
    expected_parse: true,
    description: 'Function exponentiation with braces'
  },
  {
    expression: '\\cos^2(x)',
    expected_parse: true,
    description: 'Function exponentiation without braces'
  },
  {
    expression: '\\sin^{-1}(x)',
    expected_parse: true,
    description: 'Function negative exponentiation'
  }
];

async function testParser(test, index) {
  console.log(`Test ${index + 1}: ${test.expression}`);
  console.log(`Description: ${test.description}`);
  
  try {
    const parseResult = parseLatex(test.expression);
    
    if (parseResult.error) {
      console.log(`❌ PARSE ERROR: ${parseResult.error}`);
      return { status: 'parse_error', error: parseResult.error };
    }
    
    console.log(`✅ PARSE SUCCESS`);
    console.log(`   AST Type: ${parseResult.ast?.type}`);
    
    // 評価も試してみる
    const analyzeResult = analyze(parseResult.ast, {
      task: 'evaluate',
      variable: 'x'
    });
    
    if (analyzeResult.error) {
      console.log(`   Analysis: ${analyzeResult.error}`);
    } else {
      console.log(`   Result: ${analyzeResult.value}`);
      console.log(`   Type: ${analyzeResult.valueType}`);
    }
    
    return { status: 'success', ast: parseResult.ast };
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { status: 'runtime_error', error: error.message };
  }
}

// テストの実行
let passed = 0;
let failed = 0;

for (let i = 0; i < parserTests.length; i++) {
  const result = await testParser(parserTests[i], i);
  
  if (result.status === 'success') {
    passed++;
  } else {
    failed++;
  }
  
  console.log('');
}

console.log(`\n=== PARSER IMPROVEMENT SUMMARY ===`);
console.log(`✅ Passed: ${passed}/${parserTests.length}`);
console.log(`❌ Failed: ${failed}/${parserTests.length}`);
console.log(`📊 Success Rate: ${((passed / parserTests.length) * 100).toFixed(1)}%`);

if (passed === parserTests.length) {
  console.log('\n🎉 ALL PARSER IMPROVEMENTS WORKING!');
} else if (passed / parserTests.length > 0.7) {
  console.log('\n👍 MOST PARSER IMPROVEMENTS WORKING');
} else {
  console.log('\n⚠️  PARSER IMPROVEMENTS NEED MORE WORK');
}