# Latexium API 仕様（修正版 v3）
!important
エラーメッセージなどは全て英語で。コメントも英語でお願い。全て英語です。ここでは日本語を使っているが、コードはすべて英語。
## 1. 基本方針
Latexium では、ユーザーは LaTeX 数式を `parseLatex` で AST に変換し、  
その後 `analyze` 関数にタスクを指定することで計算を実行する。

- `analyze` の返り値は **Result オブジェクト** に統一  
- これにより「数値計算」「AST」「LaTeX 文字列」のいずれも簡単に利用可能  
- エラー時は `error` フィールドにメッセージ、成功時は `null`  
- デフォルト変数: `x, y` （指定しない場合は自動で使用）  
- LaTeX の `$$...$$` の中身をそのまま入力可能  
- **変数スコープ**: 積分変数・総和変数は束縛変数として自動識別
- **予約文字制限**: `x`, `y`, `e`, `π` など数学定数は変数名として使用不可
- !important --πではなく、\\piで最終的に返すように。

---

## 2. 型定義

### 2.1 Parse結果型（統一）
```ts
type ParseResult = {
  ast: ASTNode | null;
  error: string | null;
};
```

### 2.2 Analyze結果型
```ts
type AnalyzeResult = {
  steps: StepTree[];                // 計算過程（デバッグ・教育用）
  value: string | null;           // 高精度数値の文字列表現（LaTeX形式）
  valueType: "exact" | "approximate" | "symbolic";  // 値の種類
  precision?: number;             // 実際の精度情報
  ast: ASTNode | null;            // AST（シンボリック処理の結果）
  error: string | null;           // エラー内容（成功時はnull、失敗時は文字列）
};
```

### 2.3 AST型（基本構造）
```ts
type ASTNode = 
  | NumberLiteral
  | Identifier  
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | Fraction
  | Integral
  | Sum
  | Product;

type NumberLiteral = {
  type: "NumberLiteral";
  value: number;
};

type Identifier = {
  type: "Identifier";
  name: string;                         // 変数名
  scope?: "bound" | "free";             // 束縛変数か自由変数か（パース時に自動判定）
  bindingDepth?: number;                // ネストした積分・総和での深度
  bindingContext?: "integral" | "sum" | "product";  // 束縛の種類
  uniqueId?: string;                    // 変数の一意識別子（スコープ解決用）
};

type BinaryExpression = {
  type: "BinaryExpression";
  operator: "+" | "-" | "*" | "/" | "^" | "=" | ">" | "<" | ">=" | "<=";
  left: ASTNode;
  right: ASTNode;
};

type UnaryExpression = {
  type: "UnaryExpression";
  operator: "-" | "+";
  operand: ASTNode;
};

type FunctionCall = {
  type: "FunctionCall";
  name: string;                         // "sin", "cos", "tan", "log", "exp", "sqrt" など
  args: ASTNode[];
  expectedArgCount?: number;            // 期待する引数数（バリデーション用）
};

type Fraction = {
  type: "Fraction";
  numerator: ASTNode;
  denominator: ASTNode;
};

type Integral = {
  type: "Integral";
  integrand: ASTNode;
  variable: string;                     // 束縛変数名
  lowerBound?: ASTNode;                 // 定積分の場合
  upperBound?: ASTNode;
};

type Sum = {
  type: "Sum";
  expression: ASTNode;
  variable: string;                     // 束縛変数名
  lowerBound: ASTNode;
  upperBound: ASTNode;
};

type Product = {
  type: "Product";
  expression: ASTNode;
  variable: string;                     // 束縛変数名
  lowerBound: ASTNode;
  upperBound: ASTNode;
};
```

### 2.4 オプション型
```ts
type Domain = {
  min: number | '-inf';
  max: number | 'inf';
  inclusive?: [boolean, boolean];       // [下限含む, 上限含む] デフォルト: [true, true]
};

type BaseAnalyzeOptions = {
  variable?: string;                    // デフォルト: "x"
  domain?: Domain | [number, number];   // 定義域（配列形式は両端含む）
  values?: Record<string, number>;      // 自由変数への代入値
  precision?: number;                   // 表示精度（デフォルト: 6）、内部計算は常に高精度
};

type AnalyzeOptions =
  | (BaseAnalyzeOptions & { task: "evaluate" })
  | (BaseAnalyzeOptions & { task: "differentiate" })
  | (BaseAnalyzeOptions & { task: "integrate" })
  | (BaseAnalyzeOptions & { task: "solve"; solveFor?: string })
  | (BaseAnalyzeOptions & { task: "min" | "max" })
  | (BaseAnalyzeOptions & { task: "functional"; solveFor: string });
```

---

## 3. 変数スコープ解決システム

### 3.1 予約文字の制限
**使用不可な変数名**:
- 数学定数: `e`, `π` (pi), `i` (虚数単位)
これらの数学定数は全て、pi,eとして処理し、evaluateの時、最後に代入。
- 関数名: `sin`, `cos`, `tan`, `log`, `ln`, `exp`, `sqrt` など
- 特殊記号: `∞` (infinity), `∅` (empty set) など


```ts
// 不正な例
parseLatex("e + π = x");  // エラー: "e", "π"は予約語
parseLatex("sin * cos");  // エラー: "sin", "cos"は関数名

// 正しい例
parseLatex("a + b = c");  // OK: 一般的な変数名
parseLatex("u + v = w");  // OK
```

### 3.2 ネスト積分のスコープ解決アルゴリズム

**2段階処理**:
1. **全体AST構築**: 構文解析時に全ての積分・総和を識別
2. **スコープ付与**: 各変数にuniqueIdを割り当て、束縛関係を明確化

```ts
// 例: ∫₀¹ ∫₀ˣ f(t,s) dt ds の処理過程
parseLatex("\\int_0^1 \\int_0^x f(t,s) \\, dt \\, ds");

/* 
段階1: 構文解析完了時の生AST
- 外側積分: variable="s", bindingDepth=1
- 内側積分: variable="t", bindingDepth=2  
- 上限のx: scope="free" (積分外の変数)
- f(t,s): t, s それぞれ適切な束縛変数として識別

段階2: スコープ解決後の最終AST
{
  type: "Integral",
  variable: "s",
  uniqueId: "bound_s_1",
  bindingContext: "integral",
  bindingDepth: 1,
  lowerBound: { type: "NumberLiteral", value: 0 },
  upperBound: { type: "NumberLiteral", value: 1 },
  integrand: {
    type: "Integral", 
    variable: "t",
    uniqueId: "bound_t_2",
    bindingContext: "integral", 
    bindingDepth: 2,
    lowerBound: { type: "NumberLiteral", value: 0 },
    upperBound: { 
      type: "Identifier", 
      name: "x", 
      scope: "free",
      uniqueId: "free_x"
    },
    integrand: {
      type: "FunctionCall",
      name: "f", 
      args: [
        { 
          type: "Identifier", 
          name: "t", 
          scope: "bound", 
          bindingDepth: 2,
          uniqueId: "bound_t_2"  // 内側積分の束縛変数
        },
        { 
          type: "Identifier", 
          name: "s", 
          scope: "bound", 
          bindingDepth: 1,
          uniqueId: "bound_s_1"  // 外側積分の束縛変数
        }
      ]
    }
  }
}
*/
```

### 3.3 変数衝突の回避
```ts
// 同一変数名の異なるスコープでの処理
parseLatex("\\int_0^x \\int_0^x f(x) \\, dx \\, dx");

/*
結果:
- 外側のx (上限): uniqueId="free_x", scope="free"
- 外側積分変数x: uniqueId="bound_x_1", bindingDepth=1
- 内側積分変数x: uniqueId="bound_x_2", bindingDepth=2  
- f(x)のx: uniqueId="bound_x_2" (内側の束縛に紐付け)

エラーにせず、自動的にスコープを分離
*/
```

---

## 4. LaTeX出力規約

### 4.1 統一ルール
- **分数**: `\frac{a}{b}` 形式で統一
- **三角関数**: `\sin(x)`, `\cos(x)`, `\tan(x)` 形式（括弧必須）
- **指数・対数**: `\exp(x)`, `\log(x)`, `\ln(x)` 形式
- **根号**: `\sqrt{x}`, `\sqrt[n]{x}` 形式
- **積分**: `\int f(x) \, dx`, `\int_a^b f(x) \, dx`
- **総和・積**: `\sum_{i=a}^{b}`, `\prod_{i=a}^{b}`

### 4.2 数値表現
```ts
// 高精度数値の種類別表現
{
  value: "3.141592653589793",
  valueType: "approximate",     // π の数値近似
  precision: 15
}

{
  value: "\\frac{22}{7}",
  valueType: "exact",          // 有理数の厳密表現
  precision: undefined
}

{
  value: "x + \\sin(x)",
  valueType: "symbolic",       // シンボリック表現
  precision: undefined
}
```

---

## 5. API 使用例

### 5.1 基本的な使用方法
```ts
import { parseLatex, analyze } from "latexium/core";

const parseResult = parseLatex("a + \\sin(4a)");
if (parseResult.error) {
  console.error(parseResult.error);
  return;
}

// (1) 数値代入
const result = analyze(parseResult.ast, {
  task: "evaluate",
  values: { a: pi / 2 }
});
/*
成功時:
{
  value: "3.141592653589793",
  valueType: "approximate",
  precision: 15,
  ast: { type: "NumberLiteral", value: 3.141592653589793 },
  steps: ["代入: a = \\frac{\\pi}{2}", "\\sin(2\\pi) = 0", "結果: 3.141592653589793"],
  error: null
}

エラー時:
{
  value: null,
  valueType: "exact",
  ast: null, 
  steps: [],
  error: "自由変数 a の値が指定されていません"
}
*/
```
### 5.2 微分
```ts
const parseResult = parseLatex("a + \\sin(4a)");
const diff = analyze(parseResult.ast, { 
  task: "differentiate", 
  variable: "a" 
});
/*
{
  value: "1 + 4\\cos(4a)",
  valueType: "symbolic",
  ast: {
    type: "BinaryExpression",
    operator: "+",
    left: { type: "NumberLiteral", value: 1 },
    right: {
      type: "BinaryExpression", 
      operator: "*",
      left: { type: "NumberLiteral", value: 4 },
      right: { type: "FunctionCall", name: "cos", args: [...] }
    }
  },
  steps: [
    "\\frac{d}{da}(a) = 1", 
    "\\frac{d}{da}(\\sin(4a)) = 4\\cos(4a)", 
    "結果: 1 + 4\\cos(4a)"
  ],
  error: null
}
*/
```

### 5.3 ネスト積分（最初にスコープ解決済み）
```ts
const parseResult = parseLatex("\\int_0^b \\int_0^t \\sin(s) \\, ds \\, dt");
const result = analyze(parseResult.ast, {
  task: "evaluate",
  values: { b: pi }  // 自由変数bに代入
});
/*
{
  value: "\\pi - 2",
  valueType: "exact",
  ast: { 結果のAST },
  steps: [
    "\\int_0^{\\pi} \\int_0^t \\sin(s) \\, ds \\, dt",
    "内側積分: \\int_0^t \\sin(s) \\, ds = [-\\cos(s)]_0^t = 1 - \\cos(t)",
    "外側積分: \\int_0^{\\pi} (1 - \\cos(t)) \\, dt = [t - \\sin(t)]_0^{\\pi} = \\pi - 2"
  ],
  error: null
}
*/
```

### 5.4 方程式の解
```ts
const parseResult = parseLatex("u^2 - 5u + 6 = 0");
const sol = analyze(parseResult.ast, { 
  task: "solve",
  solveFor: "u"
});
/*
{
  value: "u \\in \\{2, 3\\}",
  valueType: "exact",
  ast: {
    type: "BinaryExpression",
    operator: "=", 
    left: { type: "Identifier", name: "u", scope: "free" },
    right: { /* 解集合のAST表現 */ }
  },
  steps: [
    "因数分解: (u-2)(u-3) = 0",
    "u - 2 = 0 \\text{ または } u - 3 = 0",
    "解: u \\in \\{2, 3\\}"
  ],
  error: null
}
*/
```

### 5.5 最小値・最大値（Domain型の明確化）
```ts
const parseResult = parseLatex("a + \\sin(4a)");
const minVal = analyze(parseResult.ast, {
  task: "min",
  variable: "a",
  domain: { min: 0, max: pi, inclusive: [true, true] }
  // または domain: [0, pi]  // 配列形式（両端含む）
});
/*
{
  value: "0",
  valueType: "approximate",
  precision: 10,
  ast: { type: "NumberLiteral", value: 0 },
  steps: [
    "f(a) = a + \\sin(4a) \\text{ on } [0, \\pi]",
    "f'(a) = 1 + 4\\cos(4a)",
    "臨界点: f'(a) = 0 \\Rightarrow \\cos(4a) = -\\frac{1}{4}",
    "境界値: f(0) = 0, f(\\pi) = \\pi",
    "最小値: f(0) = 0"
  ],
  error: null
}
*/
```

---

## 6. エラーハンドリング（統一）

### 6.1 パースエラー（Result型で統一）
```ts
const parseResult = parseLatex("a + \\unknown{command}");
/*
{
  ast: null,
  error: "未対応のLaTeXコマンド: \\unknown at position 4"
}
*/
```

### 6.2 予約語エラー
```ts
const parseResult = parseLatex("\\int_0^π e \\, de");
/*
{
  ast: null, 
  error: "予約語は変数名として使用できません: π, e"
}
*/
```

### 6.3 関数引数エラー
```ts
const parseResult = parseLatex("\\sin(a, b)");  
/*
{
  ast: null,
  error: "関数 \\sin は1個の引数を期待しますが、2個指定されました"
}
*/
```

### 6.4 解析エラー
```ts
const result = analyze(ast, { task: "evaluate" });
// 自由変数未定義の場合:
/*
{
  value: null,
  valueType: "exact",
  ast: null,
  steps: [],
  error: "自由変数 a の値が指定されていません"
}
*/
```

### 6.5 スコープエラー（改良済み）
```ts
const parseResult = parseLatex("\\int_0^z f(w) \\, dw");  // zが未定義
const result = analyze(parseResult.ast, { task: "evaluate" });
/*
{
  value: null,
  valueType: "exact", 
  ast: null,
  steps: [],
  error: "積分上限に含まれる自由変数 z の値が指定されていません"
}
*/
```

---

## 7. 品質・実用性向上
- [ ] **包括的テスト**
  - 各タスクの正常系・異常系テスト
  - **ネスト積分でのスコープ解決テスト**
  - **予約語バリデーションテスト**
  - **関数引数チェックテスト**
- [ ] **TypeScriptビルド環境**
  - バンドル設定、型定義ファイル生成