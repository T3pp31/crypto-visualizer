/**
 * aes.js — AES-128 step builder for visualization
 * Orchestrates all AES operations and produces a step array.
 * Pure functions only. No DOM access.
 */

import { subBytes, shiftRows, mixColumns, addRoundKey } from './aes-operations.js';
import { keyExpansion } from './aes-key-expansion.js';
import { hexToBytes, bytesToMatrix, matrixToBytes, bytesToHex, clone2DArray } from './utils.js';

const AES_ROUNDS = 10;

/**
 * Compute indices of bytes that changed between two 4x4 matrices.
 * Returns flat indices 0..15 in row-major order (row * 4 + col).
 */
function diffIndices(prev, curr) {
  const indices = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (prev[r][c] !== curr[r][c]) {
        indices.push(r * 4 + c);
      }
    }
  }
  return indices;
}

/**
 * Build the full sequence of AES-128 encryption steps.
 * @param {string} plaintextHex - 32-char hex string
 * @param {string} keyHex - 32-char hex string
 * @returns {Object[]} Array of step objects for the visualizer
 */
export function buildAESSteps(plaintextHex, keyHex) {
  const steps = [];
  const plainBytes = hexToBytes(plaintextHex);
  const keyBytes = hexToBytes(keyHex);
  let state = bytesToMatrix(plainBytes);
  const roundKeys = keyExpansion(keyBytes);

  // Step: Initial State
  steps.push({
    algorithm: 'aes',
    id: 'aes-initial',
    round: 0,
    operation: 'initial',
    label: '初期状態',
    description: '平文を4×4のバイト行列（ステート）に変換します。',
    state: clone2DArray(state),
    prevState: null,
    roundKey: null,
    changedIndices: [],
    detail: null,
  });

  // Step: Initial AddRoundKey (Round 0)
  let prevState = clone2DArray(state);
  state = addRoundKey(state, roundKeys[0]);
  steps.push({
    algorithm: 'aes',
    id: 'aes-round0-addRoundKey',
    round: 0,
    operation: 'addRoundKey',
    label: '初期 AddRoundKey',
    description: '平文とラウンドキー 0 の XOR を計算します。',
    state: clone2DArray(state),
    prevState,
    roundKey: clone2DArray(roundKeys[0]),
    changedIndices: diffIndices(prevState, state),
    detail: { type: 'addRoundKey', roundKeyIndex: 0 },
  });

  // Rounds 1–9 (full rounds: SubBytes, ShiftRows, MixColumns, AddRoundKey)
  for (let round = 1; round <= AES_ROUNDS - 1; round++) {
    prevState = clone2DArray(state);
    state = subBytes(state);
    steps.push({
      algorithm: 'aes',
      id: `aes-round${round}-subBytes`,
      round,
      operation: 'subBytes',
      label: `ラウンド ${round} - SubBytes`,
      description: '各バイトを S-BOX で置換します。',
      state: clone2DArray(state),
      prevState,
      roundKey: null,
      changedIndices: diffIndices(prevState, state),
      detail: { type: 'subBytes' },
    });

    prevState = clone2DArray(state);
    state = shiftRows(state);
    steps.push({
      algorithm: 'aes',
      id: `aes-round${round}-shiftRows`,
      round,
      operation: 'shiftRows',
      label: `ラウンド ${round} - ShiftRows`,
      description: '各行を左に循環シフトします（行0: 0, 行1: 1, 行2: 2, 行3: 3）。',
      state: clone2DArray(state),
      prevState,
      roundKey: null,
      changedIndices: diffIndices(prevState, state),
      detail: { type: 'shiftRows' },
    });

    prevState = clone2DArray(state);
    state = mixColumns(state);
    steps.push({
      algorithm: 'aes',
      id: `aes-round${round}-mixColumns`,
      round,
      operation: 'mixColumns',
      label: `ラウンド ${round} - MixColumns`,
      description: 'ガロア体 GF(2⁸) 上で列ごとの行列乗算を行います。',
      state: clone2DArray(state),
      prevState,
      roundKey: null,
      changedIndices: diffIndices(prevState, state),
      detail: { type: 'mixColumns' },
    });

    prevState = clone2DArray(state);
    state = addRoundKey(state, roundKeys[round]);
    steps.push({
      algorithm: 'aes',
      id: `aes-round${round}-addRoundKey`,
      round,
      operation: 'addRoundKey',
      label: `ラウンド ${round} - AddRoundKey`,
      description: `ラウンドキー ${round} との XOR を計算します。`,
      state: clone2DArray(state),
      prevState,
      roundKey: clone2DArray(roundKeys[round]),
      changedIndices: diffIndices(prevState, state),
      detail: { type: 'addRoundKey', roundKeyIndex: round },
    });
  }

  // Round 10 (final): SubBytes, ShiftRows, AddRoundKey (no MixColumns)
  prevState = clone2DArray(state);
  state = subBytes(state);
  steps.push({
    algorithm: 'aes',
    id: 'aes-round10-subBytes',
    round: 10,
    operation: 'subBytes',
    label: 'ラウンド 10 - SubBytes',
    description: '最終ラウンド: 各バイトを S-BOX で置換します。',
    state: clone2DArray(state),
    prevState,
    roundKey: null,
    changedIndices: diffIndices(prevState, state),
    detail: { type: 'subBytes' },
  });

  prevState = clone2DArray(state);
  state = shiftRows(state);
  steps.push({
    algorithm: 'aes',
    id: 'aes-round10-shiftRows',
    round: 10,
    operation: 'shiftRows',
    label: 'ラウンド 10 - ShiftRows',
    description: '最終ラウンド: 各行を左に循環シフトします。',
    state: clone2DArray(state),
    prevState,
    roundKey: null,
    changedIndices: diffIndices(prevState, state),
    detail: { type: 'shiftRows' },
  });

  prevState = clone2DArray(state);
  state = addRoundKey(state, roundKeys[10]);
  steps.push({
    algorithm: 'aes',
    id: 'aes-round10-addRoundKey',
    round: 10,
    operation: 'addRoundKey',
    label: 'ラウンド 10 - AddRoundKey',
    description: '最終ラウンド: ラウンドキー 10 との XOR を計算します。',
    state: clone2DArray(state),
    prevState,
    roundKey: clone2DArray(roundKeys[10]),
    changedIndices: diffIndices(prevState, state),
    detail: { type: 'addRoundKey', roundKeyIndex: 10 },
  });

  // Final summary
  const cipherHex = bytesToHex(matrixToBytes(state));
  steps.push({
    algorithm: 'aes',
    id: 'aes-complete',
    round: 10,
    operation: 'complete',
    label: '暗号化完了',
    description: `暗号文: ${cipherHex}`,
    state: clone2DArray(state),
    prevState: null,
    roundKey: null,
    changedIndices: [],
    detail: { type: 'complete', cipherHex },
  });

  return steps;
}

export { keyExpansion } from './aes-key-expansion.js';
