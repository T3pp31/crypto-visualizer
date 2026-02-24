# 暗号アルゴリズム ビジュアライザー

AES-128 と RSA の暗号化プロセスをステップごとに可視化する教育ツールです。

## 機能

- **AES-128**: SubBytes, ShiftRows, MixColumns, AddRoundKey の各操作を全10ラウンド・41ステップで可視化
- **RSA**: 鍵生成、暗号化、復号の全プロセスを12ステップで可視化
- ステップごとの前進/後退ナビゲーション
- 自動再生（速度調整可能）
- キーボードショートカット対応（← → Space Home End）
- ダークテーマ UI
- スクリーンリーダー対応（aria-live, aria-label）

## ローカル開発

ES Modules を使用しているため、ローカルでは HTTP サーバーが必要です。

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve .
```

ブラウザで `http://localhost:8000` を開いてください。

## プロジェクト構成

```
crypto-visualizer/
├── index.html                   # エントリーポイント
├── assets/
│   ├── css/
│   │   ├── base.css             # CSS変数・リセット
│   │   ├── layout.css           # ページレイアウト
│   │   └── components/          # コンポーネントCSS
│   ├── js/
│   │   ├── main.js              # イベント登録・初期化
│   │   ├── algorithms/          # 純粋関数（DOM禁止）
│   │   │   ├── aes.js           # AESステップ生成
│   │   │   ├── aes-constants.js # S-BOX, RCON
│   │   │   ├── aes-operations.js# SubBytes等
│   │   │   ├── aes-key-expansion.js
│   │   │   ├── rsa.js           # RSAステップ生成
│   │   │   └── utils.js         # 共通ユーティリティ
│   │   └── visualizer/          # DOM操作担当
│   │       ├── stepper.js       # ステップナビゲーション
│   │       ├── renderer.js      # DOM生成
│   │       └── animator.js      # 自動再生制御
│   └── vendor/                  # 外部ライブラリ（現在なし）
└── README.md
```

## 操作方法

1. アルゴリズムタブで AES-128 または RSA を選択
2. 入力値を設定（AES: 平文と鍵の16進数、RSA: 素数とメッセージ）
3. 「暗号化を開始」ボタンをクリック
4. コントロールボタンまたはキーボードでステップを操作

## テストベクター

### AES-128 (NIST FIPS-197 Appendix B)
- 平文: `3243f6a8885a308d313198a2e0370734`
- 鍵: `2b7e151628aed2a6abf7158809cf4f3c`
- 暗号文: `3925841d02dc09fbdc118597196a0b32`

### RSA
- p=61, q=53, e=17 → n=3233, d=2753
- M=65 → C=2790 → M=65
