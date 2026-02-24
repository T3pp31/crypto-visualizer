/**
 * aes-operations.js — The four AES-128 round transformations
 * Pure functions only. No DOM access.
 */

import { SBOX, MIX_MATRIX } from './aes-constants.js';

/**
 * SubBytes: replace each byte with its S-BOX substitution.
 * @param {number[][]} state - 4x4 state matrix
 * @returns {number[][]} new state
 */
export function subBytes(state) {
  return state.map((row) => row.map((byte) => SBOX[byte]));
}

/**
 * ShiftRows: cyclically shift row i left by i positions.
 * @param {number[][]} state - 4x4 state matrix
 * @returns {number[][]} new state
 */
export function shiftRows(state) {
  return state.map((row, i) => [...row.slice(i), ...row.slice(0, i)]);
}

/**
 * MixColumns: matrix multiplication in GF(2^8) for each column.
 * @param {number[][]} state - 4x4 state matrix
 * @returns {number[][]} new state
 */
export function mixColumns(state) {
  const result = Array.from({ length: 4 }, () => new Array(4).fill(0));
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      result[row][col] =
        gmul(MIX_MATRIX[row][0], state[0][col]) ^
        gmul(MIX_MATRIX[row][1], state[1][col]) ^
        gmul(MIX_MATRIX[row][2], state[2][col]) ^
        gmul(MIX_MATRIX[row][3], state[3][col]);
    }
  }
  return result;
}

/**
 * AddRoundKey: XOR state with the round key.
 * @param {number[][]} state - 4x4 state matrix
 * @param {number[][]} roundKey - 4x4 round key matrix
 * @returns {number[][]} new state
 */
export function addRoundKey(state, roundKey) {
  return state.map((row, r) => row.map((byte, c) => byte ^ roundKey[r][c]));
}

/**
 * Galois Field GF(2^8) multiplication.
 * Uses the irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11b).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gmul(a, b) {
  let result = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) {
      result ^= a;
    }
    const hiBit = a & 0x80;
    a = (a << 1) & 0xff;
    if (hiBit) {
      a ^= 0x1b;
    }
    b >>= 1;
  }
  return result;
}
