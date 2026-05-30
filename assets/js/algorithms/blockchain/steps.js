/**
 * steps.js — Blockchain chapter step builders (pure, no DOM)
 */

const BASE = { algorithm: 'blockchain' };

/**
 * @param {string} chapter
 * @param {Object} config
 * @returns {Object[]}
 */
export function buildChapterSteps(chapter, config) {
  const builders = {
    intro: buildIntroSteps,
    block: buildBlockSteps,
    chain: buildChainSteps,
    ledger: buildLedgerSteps,
    pow: buildPowSteps,
    pos: buildPosSteps,
    fork: buildForkSteps,
    contract: buildContractSteps,
    'crypto-link': buildCryptoLinkSteps,
  };
  const fn = builders[chapter];
  if (!fn) return [];
  return fn(config);
}

function buildIntroSteps() {
  return [
    {
      ...BASE,
      chapter: 'intro',
      id: 'intro-1',
      phase: 'overview',
      label: 'ブロックチェーンとは',
      description:
        'ブロックチェーンは、取引やデータを「ブロック」という単位にまとめ、時系列に連鎖させた分散型の台帳（レジャー）です。単一の管理者に依存せず、多数の参加者が同じ履歴を共有します。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'intro',
      id: 'intro-2',
      phase: 'decentralized',
      label: '分散化の意味',
      description:
        '従来の銀行の台帳は中央が管理しますが、ブロックチェーンでは各参加者（ノード）がコピーを保持します。改ざんには複数ノードの合意が必要になるため、単一障害点を減らせます。',
      vizType: 'card',
      formula: '中央集権型台帳 → 1箇所の改ざんで全データが危険',
    },
    {
      ...BASE,
      chapter: 'intro',
      id: 'intro-3',
      phase: 'trust',
      label: '信頼の仕組み',
      description:
        '参加者同士が直接信頼しなくても、暗号学的なハッシュ連鎖と合意形成（コンセンサス）により「この履歴が正しい」と判断できます。次の章でブロックとハッシュを詳しく見ます。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'intro',
      id: 'intro-4',
      phase: 'components',
      label: '主要な構成要素',
      description:
        '本ツアーでは、ブロック・チェーン・分散台帳・PoW/PoS・フォーク・スマートコントラクト・暗号の関係を順に学びます。右のコントロールでステップを進めてください。',
      vizType: 'card',
      formula: 'ブロック + ハッシュ + 合意 + 暗号 = ブロックチェーン',
    },
  ];
}

function buildBlockSteps(config) {
  const sample = config.sampleBlocks[1] ?? { index: 1, data: 'Sample', timestamp: Date.now() };
  return [
    {
      ...BASE,
      chapter: 'block',
      id: 'block-1',
      phase: 'structure',
      label: 'ブロックの構造',
      description:
        '各ブロックにはインデックス、タイムスタンプ、データ（取引など）、前ブロックのハッシュ、そして自身のハッシュが含まれます。ハッシュはブロック内容から計算される「指紋」です。',
      vizType: 'block',
      interactive: false,
      demoBlock: { ...sample, prevHash: '0'.repeat(64), nonce: 0, hash: '（計算後に表示）' },
    },
    {
      ...BASE,
      chapter: 'block',
      id: 'block-2',
      phase: 'fields',
      label: '各フィールドの役割',
      description:
        'index は順序、timestamp は作成時刻、data は記録内容、prevHash は直前ブロックとのリンク、hash は改ざん検知に使われます。',
      vizType: 'block',
      interactive: false,
      highlightField: 'prevHash',
    },
    {
      ...BASE,
      chapter: 'block',
      id: 'block-3',
      phase: 'hash-input',
      label: 'ハッシュの計算',
      description:
        'デモでは SHA-256 を使用します。index + timestamp + data + prevHash + nonce を連結した文字列をハッシュ化します。下のデータを編集してハッシュの変化を確認してください。',
      vizType: 'block',
      interactive: true,
      editableField: 'data',
      demoBlock: sample,
    },
    {
      ...BASE,
      chapter: 'block',
      id: 'block-4',
      phase: 'tamper-fingerprint',
      label: '指紋としてのハッシュ',
      description:
        'データを1文字でも変えるとハッシュは全く異なる値になります。この性質により、内容の改ざんを検出できます。',
      vizType: 'block',
      interactive: true,
      editableField: 'data',
      showHashCompare: true,
    },
    {
      ...BASE,
      chapter: 'block',
      id: 'block-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        'ブロックはデータの容器であり、ハッシュはその完整性を保証する鍵です。次の章では複数ブロックを連鎖させます。',
      vizType: 'card',
    },
  ];
}

function buildChainSteps() {
  return [
    {
      ...BASE,
      chapter: 'chain',
      id: 'chain-1',
      phase: 'linking',
      label: 'ブロックの連鎖',
      description:
        '各ブロックは prevHash に前ブロックの hash を格納します。これによりブロック同士が鎖のように繋がり、チェーン（鎖）を形成します。',
      vizType: 'chain',
      interactive: false,
    },
    {
      ...BASE,
      chapter: 'chain',
      id: 'chain-2',
      phase: 'genesis',
      label: 'ジェネシスブロック',
      description:
        '最初のブロック（インデックス0）は prevHash がゼロ埋めの特別な値です。これをジェネシスブロックと呼びます。',
      vizType: 'chain',
      interactive: false,
      highlightIndex: 0,
    },
    {
      ...BASE,
      chapter: 'chain',
      id: 'chain-3',
      phase: 'valid-chain',
      label: '有効なチェーン',
      description:
        'すべてのブロックでハッシュが正しく、prevHash が前ブロックと一致していれば、チェーンは有効とみなされます。',
      vizType: 'chain',
      interactive: false,
    },
    {
      ...BASE,
      chapter: 'chain',
      id: 'chain-4',
      phase: 'tamper',
      label: '改ざんの検知',
      description:
        'ブロック2のデータを改ざんしてみてください。ハッシュは変わりますが prevHash は古いままなので、ブロック3以降のリンクが無効になります。',
      vizType: 'chain',
      interactive: true,
      tamperIndex: 1,
    },
    {
      ...BASE,
      chapter: 'chain',
      id: 'chain-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        'ハッシュ連鎖により、過去の改ざんは後続ブロックにも波及して検出されます。次は複数ノードが同じチェーンを持つ「分散台帳」を見ます。',
      vizType: 'card',
    },
  ];
}

function buildLedgerSteps() {
  return [
    {
      ...BASE,
      chapter: 'ledger',
      id: 'ledger-1',
      phase: 'distributed',
      label: '分散台帳',
      description:
        'ブロックチェーンの各参加者（ノード）は、同じブロックチェーンのコピーを保持します。新しいブロックが追加されると、ネットワーク全体で共有・検証されます。',
      vizType: 'network',
      interactive: false,
    },
    {
      ...BASE,
      chapter: 'ledger',
      id: 'ledger-2',
      phase: 'sync',
      label: '同期された状態',
      description:
        '正常時は3つのノードすべてが同一のチェーンを持ちます。各ノードは受け取ったブロックを独自に検証してからチェーンに追加します。',
      vizType: 'network',
      interactive: false,
      nodesInSync: true,
    },
    {
      ...BASE,
      chapter: 'ledger',
      id: 'ledger-3',
      phase: 'desync',
      label: 'ノード間の不一致',
      description:
        '「ノード2を改ざん」ボタンで、1つのノードだけが不正なチェーンを持つ状況を再現できます。他ノードは正しいチェーンを保持し続けます。',
      vizType: 'network',
      interactive: true,
      tamperNode: 1,
    },
    {
      ...BASE,
      chapter: 'ledger',
      id: 'ledger-4',
      phase: 'summary',
      label: 'まとめ',
      description:
        '分散台帳では多数決や合意形成により「正しいチェーン」を決めます。次章では PoW（Proof of Work）による合意の一例を体験します。',
      vizType: 'card',
    },
  ];
}

function buildPowSteps(config) {
  const leading = config.powLeadingZeros ?? 2;
  return [
    {
      ...BASE,
      chapter: 'pow',
      id: 'pow-1',
      phase: 'concept',
      label: 'Proof of Work とは',
      description:
        'PoW では、ブロックのハッシュが特定の条件（例: 先頭にゼロが続く）を満たす nonce を探す「マイニング」作業が必要です。計算コストが改ざんのコストになります。',
      vizType: 'card',
      formula: `難易度: ハッシュ先頭 ${leading} 桁が 0`,
    },
    {
      ...BASE,
      chapter: 'pow',
      id: 'pow-2',
      phase: 'nonce',
      label: 'nonce の役割',
      description:
        'nonce は「使い捨ての数」です。データを変えずに nonce だけを変えてハッシュを繰り返し計算し、条件を満たす値を探します。',
      vizType: 'mining',
      interactive: false,
    },
    {
      ...BASE,
      chapter: 'pow',
      id: 'pow-3',
      phase: 'mine',
      label: 'マイニング体験',
      description:
        '「マイニング開始」を押すと nonce を増やしながらハッシュを試行します。条件を満たしたらブロックが承認された状態になります。',
      vizType: 'mining',
      interactive: true,
    },
    {
      ...BASE,
      chapter: 'pow',
      id: 'pow-4',
      phase: 'cost',
      label: '計算コストとセキュリティ',
      description:
        '難易度を上げるとマイニングに時間がかかり、チェーン全体の改ざんコストも増えます。ビットコインでは約10分ごとにブロックが生成されるよう難易度が調整されます。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'pow',
      id: 'pow-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        'PoW はエネルギーを消費しますが、実績のある合意形成方式です。次章ではエネルギー消費が少ない PoS（Proof of Stake）を学びます。',
      vizType: 'card',
    },
  ];
}

function buildPosSteps() {
  return [
    {
      ...BASE,
      chapter: 'pos',
      id: 'pos-1',
      phase: 'concept',
      label: 'Proof of Stake とは',
      description:
        'PoS では、保有するコイン（ステーク）の量に応じてブロック検証者（バリデータ）が選ばれます。計算競争の代わりに、経済的な担保で誠実な行動を促します。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'pos',
      id: 'pos-2',
      phase: 'stake',
      label: 'ステーク（持分）',
      description:
        'ステークが大きい参加者ほど検証者に選ばれやすくなりますが、不正をするとステークを没収（スラッシング）されるリスクがあります。',
      vizType: 'pos',
      interactive: false,
      validators: [
        { name: 'ノードA', stake: 40 },
        { name: 'ノードB', stake: 35 },
        { name: 'ノードC', stake: 25 },
      ],
    },
    {
      ...BASE,
      chapter: 'pos',
      id: 'pos-3',
      phase: 'selection',
      label: '検証者の選出',
      description:
        'ランダム性とステーク量を組み合わせて次のブロック提案者を選びます。エネルギー消費は PoW より大幅に少ないのが特徴です。',
      vizType: 'pos',
      interactive: true,
      selectedValidator: 'ノードA',
    },
    {
      ...BASE,
      chapter: 'pos',
      id: 'pos-4',
      phase: 'compare',
      label: 'PoW と PoS の比較',
      description:
        'PoW は計算証明、PoS は持分証明です。イーサリアムは The Merge 以降 PoS に移行しました。どちらも完全ではなく、それぞれトレードオフがあります。',
      vizType: 'card',
      formula: 'PoW: 計算量 | PoS: ステーク量',
    },
    {
      ...BASE,
      chapter: 'pos',
      id: 'pos-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        '合意形成には複数の方式があり、プロジェクトの目的に応じて選ばれます。次はチェーンが分岐する「フォーク」について学びます。',
      vizType: 'card',
    },
  ];
}

function buildForkSteps() {
  return [
    {
      ...BASE,
      chapter: 'fork',
      id: 'fork-1',
      phase: 'concept',
      label: 'フォークとは',
      description:
        'フォークはブロックチェーンの分岐です。同時に2つの有効なブロックが作られると、一時的にチェーンが枝分かれすることがあります。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'fork',
      id: 'fork-2',
      phase: 'split',
      label: 'チェーンの分岐',
      description:
        'ブロック3の時点で2つの候補ブロック（3a と 3b）が存在する状況を示します。ノードによってどちらを先に受け取るかが異なることがあります。',
      vizType: 'fork',
      forkPhase: 'split',
    },
    {
      ...BASE,
      chapter: 'fork',
      id: 'fork-3',
      phase: 'compete',
      label: '競合するチェーン',
      description:
        '両方の枝にそれぞれ後続ブロックが追加されます。ネットワークは一時的に2つの「正しい」履歴候補を持つことになります。',
      vizType: 'fork',
      forkPhase: 'compete',
    },
    {
      ...BASE,
      chapter: 'fork',
      id: 'fork-4',
      phase: 'longest',
      label: '最長チェーンルール',
      description:
        'PoW では一般に「累積難易度が高い（より長い）チェーン」が正と採用されます。図では上の枝が最終的に勝利し、下の枝は孤立（オーファン）になります。',
      vizType: 'fork',
      forkPhase: 'resolved',
    },
    {
      ...BASE,
      chapter: 'fork',
      id: 'fork-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        'ソフトフォーク・ハードフォークはプロトコル変更の互換性の違いです。次章ではスマートコントラクトを体験します。',
      vizType: 'card',
    },
  ];
}

function buildContractSteps(config) {
  const demo = config.contractDemo ?? {};
  return [
    {
      ...BASE,
      chapter: 'contract',
      id: 'contract-1',
      phase: 'concept',
      label: 'スマートコントラクト',
      description:
        'スマートコントラクトはブロックチェーン上で自動実行されるプログラムです。条件が満たされると送金や状態更新が自動で行われます。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'contract',
      id: 'contract-2',
      phase: 'state',
      label: '台帳の状態',
      description:
        '簡易デモでは各アカウントの残高を「状態」として保持します。すべての取引はこの状態を更新する操作として記録されます。',
      vizType: 'contract',
      interactive: false,
      balances: { ...demo.accounts },
    },
    {
      ...BASE,
      chapter: 'contract',
      id: 'contract-3',
      phase: 'transfer',
      label: '送金の実行',
      description:
        '送金元・送金先・金額を入力して「実行」すると、残高が条件チェックのうえ更新されます。残高不足の場合はエラーになります。',
      vizType: 'contract',
      interactive: true,
      balances: { ...demo.accounts },
      defaultTransfer: { ...demo.defaultTransfer },
    },
    {
      ...BASE,
      chapter: 'contract',
      id: 'contract-4',
      phase: 'immutable',
      label: '不変性と透明性',
      description:
        '一度記録された取引は改ざんが困難です。誰でも（パブリックチェーンでは）履歴を検証できます。実際のコントラクトはより複雑な条件をプログラムします。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'contract',
      id: 'contract-5',
      phase: 'summary',
      label: 'まとめ',
      description:
        'スマートコントラクトは DeFi や NFT などの基盤技術です。最後の章では暗号（ハッシュ・署名）との関係を整理します。',
      vizType: 'card',
    },
  ];
}

function buildCryptoLinkSteps() {
  return [
    {
      ...BASE,
      chapter: 'crypto-link',
      id: 'crypto-1',
      phase: 'hash-role',
      label: 'ハッシュの役割',
      description:
        'ブロックチェーンは暗号学的ハッシュ関数（SHA-256 等）でデータの完整性を守ります。本サイトのブロックデモでも同じ SHA-256 を使用しています。',
      vizType: 'card',
    },
    {
      ...BASE,
      chapter: 'crypto-link',
      id: 'crypto-2',
      phase: 'signature',
      label: 'デジタル署名',
      description:
        '取引の送信者は秘密鍵で署名し、誰でも公開鍵で検証できます。RSA 暗号はこの仕組みの学習に使われます。トップページの RSA ビジュアライザーで鍵生成・署名の流れを確認できます。',
      vizType: 'card',
      linkToRsa: true,
    },
    {
      ...BASE,
      chapter: 'crypto-link',
      id: 'crypto-3',
      phase: 'symmetric',
      label: '共通鍵暗号との関係',
      description:
        '大量データの暗号化には AES などの共通鍵暗号が使われます。ブロックチェーンでは主にハッシュと公開鍵暗号が中心ですが、レイヤー2やオフチェーンで AES 等も活用されます。',
      vizType: 'card',
      linkToAes: true,
    },
    {
      ...BASE,
      chapter: 'crypto-link',
      id: 'crypto-4',
      phase: 'summary',
      label: '学習の次のステップ',
      description:
        'ブロックチェーンは暗号技術の応用例です。暗号ビジュアライザーでシーザー・AES・RSA を体験し、本ページで学んだ分散台帳の概念と結びつけて理解を深めてください。',
      vizType: 'card',
    },
  ];
}

/**
 * All chapter IDs in display order.
 * @param {Object} config
 * @returns {string[]}
 */
export function getChapterIds(config) {
  return (config.chapters ?? []).map((c) => c.id);
}
