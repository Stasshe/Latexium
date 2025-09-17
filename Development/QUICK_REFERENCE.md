# 開発環境設定クイックリファレンス

## 🚀 セットアップコマンド

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# リント＆フォーマット
npm run lint:fix
npm run format
```

## 🚀 重要：コマンドの使い分け

### npm run format vs npm run lint

#### `npm run format`
**用途**: コードの**見た目・スタイル**を統一
```bash
npm run format        # 全ファイルをフォーマット
npm run format:check  # フォーマットチェックのみ（修正しない）
```

**実行内容**:
- Prettierでコードフォーマット
- インデント、改行、クォート、セミコロンなどの統一
- **エラー修正はしない**（見た目のみ）

#### `npm run lint`
**用途**: コードの**品質・エラー**をチェック
```bash
npm run lint      # エラーチェックのみ
npm run lint:fix  # エラーの自動修正も実行
```

**実行内容**:
- ESLintでコード品質チェック
- 未使用変数、型エラー、ベストプラクティス違反の検出
- `--fix`オプションで修正可能なエラーを自動修正

#### 使い分けガイド

| コマンド | 目的 | 修正 | 使用タイミング |
|----------|------|------|------------|
| `npm run format` | スタイル統一 | ✅ | コミット前、チーム開発時 |
| `npm run format:check` | スタイルチェック | ❌ | CI/CD、確認時 |
| `npm run lint` | 品質チェック | ❌ | エラー確認時 |
| `npm run lint:fix` | 品質+修正 | ✅ | **日常開発で推奨** |

#### 推奨ワークフロー

**日常開発**:
```bash
# 基本的にはこれだけでOK（lint + format両方実行）
npm run lint:fix
```

**コミット前**:
```bash
# 最終確認
npm run lint:fix && npm run format
```

**CI/CD**:
```bash
# チェックのみ（修正しない）
npm run lint && npm run format:check
```

## 📝 よく使うスニペット

| スニペット | 説明 | 使用方法 |
|------------|------|----------|
| `rfc` | React Functional Component | `rfc` + Tab |
| `rhook` | Custom React Hook | `rhook` + Tab |
| `npage` | Next.js Page Component | `npage` + Tab |
| `clg` | Console.log | `clg` + Tab |

## ⚡ 自動化機能

### 保存時（VSCode）
- ✅ ESLint自動修正
- ✅ Prettier自動フォーマット
- ✅ Import文自動整理

### コミット時（Git Hooks）
- ✅ ステージングファイルのlint
- ✅ 自動フォーマット
- ✅ エラー時はコミット中止

## 🛠️ 主要設定ファイル

| ファイル | 役割 |
|----------|------|
| `.vscode/settings.json` | VSCode設定 |
| `.vscode/extensions.json` | 推奨拡張機能 |
| `.vscode/react.code-snippets` | コードスニペット |
| `eslint.config.mjs` | ESLint設定 |
| `.prettierrc` | Prettier設定 |
| `.prettierignore` | フォーマット除外ファイル |
| `tsconfig.json` | TypeScript設定 |
| `.editorconfig` | エディタ統一設定 |
| `.husky/pre-commit` | Git Hooks |
| `package.json` | lint-staged設定 |

## 🎯 重要な設定項目

### TypeScript厳格モード
```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

### Import Order（ESLint）
- 外部ライブラリ → 内部モジュール → 相対パス
- アルファベット順ソート
- グループ間に空行

### Quote Rules（Prettier）
- JavaScript/TypeScript: Single Quote (`'`)
- JSX属性: Double Quote (`"`)
- JSON: Double Quote (`"`)

## 🔧 トラブルシューティング

### ESLintが動かない
```bash
# 拡張機能の確認
code --list-extensions | grep eslint

# 設定の確認
cat .vscode/settings.json | grep eslint
```

### Prettierが動かない
```bash
# 拡張機能の確認
code --list-extensions | grep prettier

# 設定ファイルの確認
cat .prettierrc
```

### Git Hooksが動かない
```bash
# Huskyの再セットアップ
npx husky install

# pre-commitの権限確認
ls -la .husky/pre-commit
```

## 📚 推奨拡張機能

必須の6つ:
1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier** (`esbenp.prettier-vscode`)
3. **Tailwind CSS** (`bradlc.vscode-tailwindcss`)
4. **TypeScript** (`ms-vscode.vscode-typescript-next`)
5. **GitHub Copilot** (`github.copilot`)
6. **GitHub Copilot Chat** (`github.copilot-chat`)

## 🎨 開発体験向上機能

### 型ヒント表示
- パラメータ名の表示
- 変数型の表示
- 戻り値型の表示

### UI改善
- ブラケットペアの色分け
- スムーズなカーソル動作
- 改善されたフォルダ表示

### 自動補完
- 自動import提案
- ファイル移動時のimport更新
- TypeScript IntelliSense

## 📈 コード品質指標

このテンプレートで保証される品質:
- ✅ 一貫したコードスタイル
- ✅ 型安全性の確保
- ✅ 未使用コードの検出
- ✅ Import文の整理
- ✅ アクセシビリティ対応
- ✅ パフォーマンス最適化