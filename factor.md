# 高度な因数分解システム構築指示書

## 循環依存回避設計

### 依存関係ルール

- **unified-simplify**: middle-simplify + factor/* を使用可能
- **middle-simplify**: 因数分解機能を一切使用禁止
- **factor/***: middle-simplifyのみ使用、unified-simplifyは禁止

### 実装順序

1. `cp unified-simplify middle-simplify`
1. middle-simplifyから因数分解コードを完全削除
1. unified-simplifyを因数分解統合版に改修

## 高度な因数分解アルゴリズム仕様

### 1. パターン認識モジュール (pattern-recognition/)

#### 実装必須パターン

- **共通因子抽出**: `gcd(coefficients) * gcd(variables)`
- **差の二乗**: `a² - b²` → `(a-b)(a+b)`
- **完全平方**: `a² ± 2ab + b²` → `(a ± b)²`
- **立方和/差**: `a³ ± b³` → `(a ± b)(a² ∓ ab + b²)`

#### 実装不要パターン（計算量的に非効率）

- 一般的な二次式の解の公式による因数分解
- 複雑な高次パターン

### 2. Berlekamp-Zassenhaus アルゴリズム (berlekamp-zassenhaus/)

#### Phase 1: 有限体での因数分解

- **前処理**: square-free分解
- **素数選択**: 係数に含まれない小さな素数
- **Berlekamp行列**: `Q[i,j] = [x^(pi)]_j mod f(x)`における係数
- **null space計算**: `(Q - I)`の零空間
- **因数構築**: `gcd(f, v^a - a)`for各null space vector

#### Phase 2: Hensel Lifting

- **初期lift**: `mod p` → `mod p²`
- **指数倍増**: 目標精度まで繰り返し
- **Extended Euclidean**: 補正項分配に使用
- **係数バウンド**: Mignotte’s boundによる打ち切り

#### 実装上の注意点

- **精度管理**: BigInt使用、有理数演算対応
- **メモリ効率**: 大きな多項式での行列操作最適化
- **エラーハンドリング**: 不正な素数選択時の回復

### 3. LLL格子基底約元 (lll-reduction/)

#### アルゴリズムパラメータ

- **δ = 0.75** (標準的なLovász定数)
- **精度**: floating point ではなく有理数演算推奨

#### 実装段階

1. **Gram-Schmidt直交化**: μ係数計算
1. **Size reduction**: `|μ[i,j]| ≤ 0.5`条件
1. **Lovász条件**: `||b*[k]||² ≥ (δ - μ[k,k-1]²)||b*[k-1]||²`
1. **基底交換**: 条件違反時のswap処理

#### 多項式への適用

- **格子構築**: 係数ベクトル + 適切なスケーリング
- **短ベクトル抽出**: 約元後の小さなベクトルから因数候補構築
- **検証**: 実際の因数かどうかの除算テスト

## 性能要件とベンチマーク

### 計算量目標

- **パターン認識**: O(n) - 線形時間
- **2-3次多項式**: 1秒以内
- **5-10次多項式**: 10秒以内
- **それ以上**: progressive timeout

### メモリ使用量

- **係数精度**: 必要最小限のBigInt precision
- **中間結果**: 可能な限り使い捨て
- **キャッシュ**: 重複計算の避けるが、メモリリーク注意

## テストケース設計

### 必須テストカテゴリ

1. **基本パターン**: 教科書レベルの因数分解
1. **エッジケース**: 係数0、定数項なし、等々
1. **高次多項式**: degree 5-20の実用的ケース
1. **病的ケース**: 巨大係数、稠密多項式
1. **既約多項式**: 因数分解不可能な場合の処理

### パフォーマンステスト

- **時間制限**: 各アルゴリズムの timeout設定
## 実装優先順位

### Phase 1 (MVP)

1. cp,middle-simplify分離
1. unified-simplify統合

### Phase 2 (Core Algorithm)

1. Berlekamp-Zassenhaus基本実装
1. Hensel lifting統合
1. エラーハンドリング整備

### Phase 3 (Advanced)

1. LLL格子基底約元追加
1. 性能最適化
1. 包括的テストスイート

## 品質保証

### 数学的正当性

- **検算機能**: 因数分解結果の積を計算して元多項式と照合
- **既知結果**: Mathematica/Sageとの結果比較
- **文献照合**: 標準的なアルゴリズム書籍との整合性



```ts
const factoredNumerator = advancedFactor(numerator);
    const factoredDenominator = advancedFactor(denominator);
    const simplified = simplifyPolynomialFraction(factoredNumerator, factoredDenominator)
``` 
ここは、
```
const simplified = simplifyPolynomialFraction(numerator, denominator);
```
これで。

すでにstrategies/に色々ある。必要な物以外は消して。
分数の訳文居着いては、middle-simplifyでは、factorに依存しないpolynomialのみ。