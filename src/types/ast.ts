/**
 * Latexium AST Type Definitions
 * Based on SPECIFICATION.md v3
 */

// Parse結果型（統一）
export type ParseResult = {
  ast: ASTNode | null;
  error: string | null;
};

// Analyze結果型
export type AnalyzeResult = {
  steps: string[]; // 計算過程（デバッグ・教育用）
  value: string | null; // 高精度数値の文字列表現（LaTeX形式）
  valueType: 'exact' | 'approximate' | 'symbolic'; // 値の種類
  precision?: number; // 実際の精度情報
  ast: ASTNode | null; // AST（シンボリック処理の結果）
  error: string | null; // エラー内容（成功時はnull、失敗時は文字列）
};

// AST型（基本構造）
export type ASTNode =
  | NumberLiteral
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | Fraction
  | Integral
  | Sum
  | Product;

export type NumberLiteral = {
  type: 'NumberLiteral';
  value: number;
};

export type Identifier = {
  type: 'Identifier';
  name: string; // 変数名
  scope?: 'bound' | 'free'; // 束縛変数か自由変数か（パース時に自動判定）
  bindingDepth?: number; // ネストした積分・総和での深度
  bindingContext?: 'integral' | 'sum' | 'product'; // 束縛の種類
  uniqueId?: string; // 変数の一意識別子（スコープ解決用）
};

export type BinaryExpression = {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '^' | '=' | '>' | '<' | '>=' | '<=';
  left: ASTNode;
  right: ASTNode;
};

export type UnaryExpression = {
  type: 'UnaryExpression';
  operator: '-' | '+';
  operand: ASTNode;
};

export type FunctionCall = {
  type: 'FunctionCall';
  name: string; // "sin", "cos", "tan", "log", "exp", "sqrt" など
  args: ASTNode[];
  expectedArgCount?: number; // 期待する引数数（バリデーション用）
};

export type Fraction = {
  type: 'Fraction';
  numerator: ASTNode;
  denominator: ASTNode;
};

export type Integral = {
  type: 'Integral';
  integrand: ASTNode;
  variable: string; // 束縛変数名
  lowerBound?: ASTNode; // 定積分の場合
  upperBound?: ASTNode;
};

export type Sum = {
  type: 'Sum';
  expression: ASTNode;
  variable: string; // 束縛変数名
  lowerBound: ASTNode;
  upperBound: ASTNode;
};

export type Product = {
  type: 'Product';
  expression: ASTNode;
  variable: string; // 束縛変数名
  lowerBound: ASTNode;
  upperBound: ASTNode;
};

// オプション型
export type Domain = {
  min: number | '-inf';
  max: number | 'inf';
  inclusive?: [boolean, boolean]; // [下限含む, 上限含む] デフォルト: [true, true]
};

export type BaseAnalyzeOptions = {
  variable?: string; // デフォルト: "x"
  domain?: Domain | [number, number]; // 定義域（配列形式は両端含む）
  values?: Record<string, number>; // 自由変数への代入値
  precision?: number; // 表示精度（デフォルト: 6）、内部計算は常に高精度
};

export type AnalyzeOptions =
  | (BaseAnalyzeOptions & { task: 'evaluate' })
  | (BaseAnalyzeOptions & { task: 'approx' })
  | (BaseAnalyzeOptions & { task: 'differentiate' })
  | (BaseAnalyzeOptions & { task: 'integrate' })
  | (BaseAnalyzeOptions & { task: 'solve'; solveFor?: string })
  | (BaseAnalyzeOptions & { task: 'factor' })
  | (BaseAnalyzeOptions & { task: 'analyze-polynomial' })
  | (BaseAnalyzeOptions & { task: 'min' | 'max' })
  | (BaseAnalyzeOptions & { task: 'functional'; solveFor: string });

// 予約語定義
export const RESERVED_CONSTANTS = new Set(['e', 'π', 'pi', 'i']);

export const RESERVED_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'log',
  'ln',
  'exp',
  'sqrt',
  'asin',
  'acos',
  'atan',
  'sinh',
  'cosh',
  'tanh',
  'abs',
]);

export const RESERVED_SYMBOLS = new Set(['∞', 'infinity', '∅']);

// 関数の期待引数数
export const FUNCTION_ARG_COUNTS: Record<string, number> = {
  sin: 1,
  cos: 1,
  tan: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  sinh: 1,
  cosh: 1,
  tanh: 1,
  log: 1,
  ln: 1,
  exp: 1,
  sqrt: 1,
  abs: 1,
};

// 数学定数の値
export const MATH_CONSTANTS: Record<string, number> = {
  e: Math.E,
  π: Math.PI,
  pi: Math.PI,
};
