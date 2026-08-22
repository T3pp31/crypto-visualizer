/**
 * bench/bench.mjs — パフォーマンス計測基盤 + characterization（挙動固定）
 *
 * 既存の純粋関数（DOM 非依存）の計測値と挙動を固定する。
 * 実行: node bench/bench.mjs [phase]  →  bench/results-<phase>.txt を生成
 *   既定の phase は before（results-before.txt）
 *
 * 使い分け:
 *   - runCharacterization(): 挙動の固定（期待値との一致可否を記録）
 *   - runBenchmark():        パフォーマンス計測（中位値採用）
 *
 * 制約: ソース（assets/js/...）は変更しない。
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  sha256Hex,
  blockHeaderString,
  hashBlock,
  meetsDifficulty,
} from '../assets/js/algorithms/blockchain/hash.js';
import { mineBlock } from '../assets/js/algorithms/blockchain/mining.js';
import { buildAESSteps } from '../assets/js/algorithms/aes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const phase = process.argv[2] ?? 'before';
const RESULTS_FILE = join(__dirname, `results-${phase}.txt`);

/**
 * 期待される既知値（characterization 用）
 */
const EXPECTED = {
  sha256_abc: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  sha256_empty: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  aes_cipher: '3925841d02dc09fbdc118597196a0b32',
};

/**
 * characterization 用の固定ブロック（決定論的）。
 */
const MINE_BLOCK = {
  index: 3,
  timestamp: 1700000180000,
  data: 'Charlie → Alice: 5 BTC',
  prevHash: 'a'.repeat(64),
  nonce: 0,
};

/**
 * 計測用の固定入力（blockHeaderString 風の ~100 文字）。
 */
const FIXED_INPUT_100 = blockHeaderString({
  index: 10,
  timestamp: 1700000190000,
  data: 'Bob → Carol: 2.5 BTC (payment for service)',
  prevHash: 'f'.repeat(64),
  nonce: 42,
});

/**
 * 中位数を返す（中位値採用のため）。
 * @param {number[]} values
 * @returns {number}
 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * 単発の計測時間を ms で返す（1 関数 1 責務: 計測のみ）。
 * @param {() => Promise<void>} fn
 * @returns {Promise<number>}
 */
async function timeOnce(fn) {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/**
 * パフォーマンス計測ヘルパー。
 * - warmup を 1 回行ってから正式計測に入る（初回コストを除外）。
 * - 複数回（runs）実施して中位値を採用（ノイズ低減）。
 *
 * @param {() => Promise<void>} fn  1 回の計測対象（内部で N 回処理する）
 * @param {string} label            結果表示用のラベル
 * @param {{ runs?: number, iterations?: number }} [opts]
 *   opts.runs        - 中位値算出のための試行回数（既定 5）
 *   opts.iterations  - fn が 1 回で処理する反復回数（1 回あたり平均算出用）
 * @returns {Promise<{ label: string, medianMs: number, perCallMs: number|null, samples: number[] }>}
 */
async function measure(fn, label, { runs = 5, iterations = null } = {}) {
  // warmup: 初回コスト（キャッシュ・JIT・メモリ確保）を除外
  await fn();

  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    samples.push(await timeOnce(fn));
  }

  const medianMs = median(samples);
  const perCallMs = iterations ? medianMs / iterations : null;

  return { label, medianMs, perCallMs, samples };
}

/**
 * characterization（挙動固定）を実施し、結果の配列を返す。
 * @returns {Promise<{ name: string, expected: string, actual: string, ok: boolean, extra?: string }[]>}
 */
async function runCharacterization() {
  const results = [];

  // 1. sha256Hex('abc')
  const shaAbc = await sha256Hex('abc');
  results.push({
    name: "sha256Hex('abc')",
    expected: EXPECTED.sha256_abc,
    actual: shaAbc,
    ok: shaAbc === EXPECTED.sha256_abc,
  });

  // 2. sha256Hex('')
  const shaEmpty = await sha256Hex('');
  results.push({
    name: "sha256Hex('')",
    expected: EXPECTED.sha256_empty,
    actual: shaEmpty,
    ok: shaEmpty === EXPECTED.sha256_empty,
  });

  // 3. buildAESSteps の最終 step の cipherHex
  const aesSteps = buildAESSteps(
    '3243f6a8885a308d313198a2e0370734',
    '2b7e151628aed2a6abf7158809cf4f3c',
  );
  const finalStep = aesSteps[aesSteps.length - 1];
  const cipherHex = finalStep?.detail?.cipherHex ?? '';
  results.push({
    name: 'buildAESSteps cipherHex',
    expected: EXPECTED.aes_cipher,
    actual: cipherHex,
    ok: cipherHex === EXPECTED.aes_cipher,
  });

  // 4. mineBlock の戻り値を記録（決定論的）
  const mined = await mineBlock(MINE_BLOCK, 2, 0, 1000000);
  const minedBlock = mined?.block ?? {};
  results.push({
    name: 'mineBlock(block, 2, 0, 1000000)',
    expected: '(deterministic)',
    actual: `nonce=${minedBlock.nonce}, attempts=${mined?.attempts}, hash=${minedBlock.hash}`,
    ok: Boolean(mined) && meetsDifficulty(minedBlock.hash, 2),
  });

  return results;
}

/**
 * パフォーマンス計測を実施し、結果の配列を返す。
 * @returns {Promise<{ label: string, medianMs: number, perCallMs: number|null, iterations: number|null }[]>}
 */
async function runBenchmark() {
  const out = [];

  // 1. sha256Hex: 固定文字列（~100 文字）を N 回連続処理
  const N_SHA = 20000;
  const shaResult = await measure(
    async () => {
      for (let i = 0; i < N_SHA; i += 1) {
        await sha256Hex(FIXED_INPUT_100);
      }
    },
    `sha256Hex (${N_SHA} iters, ~100 char input)`,
    { runs: 5, iterations: N_SHA },
  );
  out.push({
    label: shaResult.label,
    medianMs: shaResult.medianMs,
    perCallMs: shaResult.perCallMs,
    iterations: N_SHA,
  });

  // 2. hashBlock: 固定 block を N 回処理
  const N_HASH = 5000;
  const hashResult = await measure(
    async () => {
      for (let i = 0; i < N_HASH; i += 1) {
        await hashBlock(MINE_BLOCK);
      }
    },
    `hashBlock (${N_HASH} iters)`,
    { runs: 5, iterations: N_HASH },
  );
  out.push({
    label: hashResult.label,
    medianMs: hashResult.medianMs,
    perCallMs: hashResult.perCallMs,
    iterations: N_HASH,
  });

  // 3. mineBlock: leadingZeros=2 で実際に nonce を探す（1 回分）
  const mineResult = await measure(
    async () => {
      await mineBlock(MINE_BLOCK, 2, 0, 100000);
    },
    'mineBlock (leadingZeros=2, single mine)',
    { runs: 5 },
  );
  out.push({
    label: mineResult.label,
    medianMs: mineResult.medianMs,
    perCallMs: null,
    iterations: null,
  });

  // 4. buildAESSteps: N 回処理
  const N_AES = 200;
  const aesResult = await measure(
    async () => {
      for (let i = 0; i < N_AES; i += 1) {
        buildAESSteps(
          '3243f6a8885a308d313198a2e0370734',
          '2b7e151628aed2a6abf7158809cf4f3c',
        );
      }
    },
    `buildAESSteps (${N_AES} iters)`,
    { runs: 5, iterations: N_AES },
  );
  out.push({
    label: aesResult.label,
    medianMs: aesResult.medianMs,
    perCallMs: aesResult.perCallMs,
    iterations: N_AES,
  });

  return out;
}

/**
 * 結果を整形して文字列を返す。
 * @param {string} phaseLabel
 * @param {{ name: string, expected: string, actual: string, ok: boolean }[]} charResults
 * @param {{ label: string, medianMs: number, perCallMs: number|null, iterations: number|null }[]} perfResults
 * @returns {string}
 */
function formatResults(phaseLabel, charResults, perfResults) {
  const lines = [];
  const now = new Date();
  lines.push(`# ${phaseLabel} — パフォーマンス計測結果`);
  lines.push(`# date: ${now.toISOString()}`);
  lines.push(`# node: ${process.version}`);
  lines.push('');

  lines.push('=== Characterization (挙動固定) ===');
  for (const r of charResults) {
    const mark = r.ok ? 'OK  ' : 'FAIL';
    lines.push(`[${mark}] ${r.name}`);
    lines.push(`       expected: ${r.expected}`);
    lines.push(`       actual:   ${r.actual}`);
  }
  lines.push('');

  lines.push('=== Performance (median ms) ===');
  for (const r of perfResults) {
    const perCall = r.perCallMs != null ? `  (avg ${r.perCallMs.toFixed(4)} ms/call, N=${r.iterations})` : '';
    lines.push(`${r.label}: ${r.medianMs.toFixed(3)} ms${perCall}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * メイン: characterization + ベンチマークを実行し、結果ファイルを書き出す。
 */
async function main() {
  process.stdout.write('Running characterization...\n');
  const charResults = await runCharacterization();

  process.stdout.write('Running benchmark (warmup + 5 runs each, median)...\n');
  const perfResults = await runBenchmark();

  const text = formatResults(phase.toUpperCase(), charResults, perfResults);
  writeFileSync(RESULTS_FILE, text, 'utf8');

  process.stdout.write('\n--- results ---\n');
  process.stdout.write(text);
  process.stdout.write(`\nWritten to: ${RESULTS_FILE}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
