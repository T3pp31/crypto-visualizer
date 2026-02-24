# crypto-visualizer Development Rules

## 🏗 Project Structure

```
crypto-visualizer/
├── index.html               # エントリーポイント（HTMLは1ファイル）
├── assets/
│   ├── css/
│   │   ├── base.css         # リセット・変数・タイポグラフィ
│   │   ├── layout.css       # ページ全体のレイアウト（Grid/Flex）
│   │   └── components/
│   │       ├── step-card.css   # ステップカード1枚分のスタイル
│   │       ├── byte-grid.css   # バイト配列の可視化グリッド
│   │       └── controls.css    # 再生・停止・スライダーUI
│   ├── js/
│   │   ├── main.js              # 初期化・イベント購読のみ
│   │   ├── algorithms/
│   │   │   ├── aes.js           # AES純粋関数（DOM禁止）
│   │   │   ├── rsa.js           # RSA純粋関数（DOM禁止）
│   │   │   └── utils.js         # xor, rotWord など共通演算
│   │   └── visualizer/
│   │       ├── stepper.js       # ステップ配列の管理・前後移動
│   │       ├── renderer.js      # DOM生成・更新
│   │       └── animator.js      # アニメーション制御
│   └── vendor/              # 外部ライブラリのローカルコピー
└── README.md
```

---

## 📂 ファイル分割ルール

### 1. 「何を書くか」で分割する（機能ではなく責務で分ける）

| ファイル | 書いていいもの | 書いてはいけないもの |
|---|---|---|
| `algorithms/*.js` | 純粋関数・定数（SBOX等） | `document`, `window`, DOM操作 |
| `visualizer/renderer.js` | DOM生成・innerHTML更新 | アルゴリズム計算ロジック |
| `visualizer/stepper.js` | currentStep管理・前後移動 | DOM操作・アルゴリズム計算 |
| `visualizer/animator.js` | CSS class付け外し・タイマー | ビジネスロジック |
| `main.js` | イベントリスナー登録・初期化 | 計算・DOM生成の実装 |

### 2. CSSは「スコープ」で分割する

```
base.css       → 全体に影響するもの（:root変数, reset, body）
layout.css     → ページ骨格（header/main/sidebar の配置）
components/    → 1コンポーネント = 1ファイル
```

コンポーネントCSSの読み込み順：
```html
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components/step-card.css">
<link rel="stylesheet" href="assets/css/components/byte-grid.css">
<link rel="stylesheet" href="assets/css/components/controls.css">
```

### 3. JSファイルの肥大化を防ぐ目安

1ファイルが **150行を超えたら分割を検討**する。具体的には：

```
aes.js が大きくなってきたら…
  aes/subBytes.js
  aes/shiftRows.js
  aes/mixColumns.js
  aes/keyExpansion.js
  aes/index.js  ← 上記をまとめてre-export
```

### 4. `main.js` は薄く保つ

```js
// main.js はグルーコードのみ。ここに実装を書かない
import { buildAESSteps } from './algorithms/aes.js';
import { Stepper }        from './visualizer/stepper.js';
import { Renderer }       from './visualizer/renderer.js';

const steps    = buildAESSteps(getInput());
const renderer = new Renderer(document.getElementById('viz'));
const stepper  = new Stepper(steps, renderer);

document.getElementById('btn-next').addEventListener('click', () => stepper.next());
document.getElementById('btn-prev').addEventListener('click', () => stepper.prev());
```

### 5. 依存方向は一方向に保つ

```
main.js
  └── visualizer/stepper.js
        └── visualizer/renderer.js
        └── algorithms/aes.js
              └── algorithms/utils.js
```

逆方向の依存（`algorithms` が `visualizer` を import するなど）は禁止。

---

## 📄 HTML Rules

### 1. セマンティクスを徹底する
```html
<!-- ❌ Bad -->
<div class="header">...</div>
<div class="step-box">...</div>

<!-- ✅ Good -->
<header>...</header>
<article class="step-card" aria-label="AES Round 1">...</article>
```

### 2. data属性でJS連携する（classは汚染しない）
```html
<!-- ✅ Good -->
<div class="step-card" data-step="3" data-algo="aes">...</div>
```

### 3. アクセシビリティ
- `aria-live="polite"` をステップ表示エリアに付与
- ボタンには必ず `aria-label` を記述
- キーボード操作（Tab / Enter / Space）で全操作が完結すること

### 4. スクリプトは `defer` で読み込む
```html
<script src="assets/js/main.js" defer></script>
```

---

## 🎨 CSS Rules

### 1. カスタムプロパティで一元管理
```css
:root {
  /* Colors */
  --color-primary:    #6366f1;
  --color-highlight:  #f59e0b;
  --color-bg:         #0f172a;
  --color-surface:    #1e293b;
  --color-text:       #f1f5f9;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 32px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-step: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. BEM命名規則を使う
```css
/* Block__Element--Modifier */
.step-card { }
.step-card__title { }
.step-card__byte { }
.step-card__byte--active { }
.step-card__byte--modified { }
```

### 3. ステップアニメーションの基本パターン
```css
.step-card {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity var(--transition-step),
              transform var(--transition-step);
}
.step-card.is-visible {
  opacity: 1;
  transform: none;
}
```

### 4. レイアウトはGrid/Flexのみ（floatは禁止）

### 5. マジックナンバーを書かない
```css
/* ❌ Bad */
.byte-block { width: 38px; }

/* ✅ Good */
.byte-block { width: calc(var(--space-md) * 2 + 6px); }
```

---

## ⚙️ JavaScript Rules

### 1. アルゴリズムとUI描画を完全分離する

```js
// algorithms/aes.js → 純粋関数のみ（DOM操作禁止）
export function subBytes(state) { /* ... */ return newState; }
export function shiftRows(state) { /* ... */ return newState; }

// visualizer/stepper.js → DOMのみ担当
import { subBytes } from '../algorithms/aes.js';
```

### 2. ステップを「状態配列」として生成する

```js
// ❌ Bad: 処理しながら描画
function runAES(input) {
  renderStep(subBytes(input)); // 処理と描画が混在
}

// ✅ Good: 先に全ステップを計算し、配列として保持
function buildSteps(input) {
  const steps = [];
  let state = toMatrix(input);

  steps.push({ label: 'Initial State',  state: clone(state) });
  state = subBytes(state);
  steps.push({ label: 'After SubBytes', state: clone(state) });
  state = shiftRows(state);
  steps.push({ label: 'After ShiftRows',state: clone(state) });
  // ...
  return steps;
}
```

### 3. レンダラーは冪等（idempotent）に保つ

```js
// 同じstepIndexを何度呼んでも同じ結果になるように
function renderStep(stepIndex) {
  const step = steps[stepIndex];
  stepContainer.innerHTML = '';       // クリアしてから
  stepContainer.append(buildCard(step)); // 再描画
}
```

### 4. エラーハンドリングを必ず書く

```js
function parseHexInput(raw) {
  const hex = raw.trim().replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
    throw new RangeError(`AES requires 128-bit hex (32 chars). Got: ${hex.length}`);
  }
  return hex;
}
```

### 5. マジックナンバーは定数化

```js
// ✅ Good
const AES_BLOCK_BYTES = 16;
const RSA_DEFAULT_E   = 65537;
const SBOX = Object.freeze([0x63, 0x7c, 0x77, /* ... */]);
```

### 6. モジュールはES Modules（ESM）で書く
```js
// import/export で依存関係を明示
export { buildSteps } from './aes.js';
```

---

## ✅ Lint / Format

```jsonc
// .eslintrc 推奨設定
{
  "env": { "browser": true, "es2022": true },
  "parserOptions": { "ecmaVersion": 2022, "sourceType": "module" },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "eqeqeq": "error",
    "no-console": "warn"
  }
}
```

Prettierは `printWidth: 100`, `singleQuote: true`, `semi: true` を推奨。

---

## 📦 GitHub Pages デプロイ

- `main` ブランチの `/docs` フォルダ or `gh-pages` ブランチを使う
- ビルドが不要なVanilla JS構成なら `main` + root直置きが最シンプル
- 外部ライブラリは CDN ではなく `vendor/` にコピーして固定バージョン管理する
