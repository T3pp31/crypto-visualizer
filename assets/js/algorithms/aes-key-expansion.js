/**
 * aes-key-expansion.js — AES-128 key schedule (key expansion)
 * Pure function. No DOM access.
 */

import { SBOX, RCON } from './aes-constants.js';

const NK = 4;  // key length in 32-bit words (AES-128)
const NR = 10; // number of rounds

/**
 * Expand a 16-byte key into 11 round keys (each a 4x4 column-major matrix).
 * @param {number[]} keyBytes - 16-byte flat array
 * @returns {number[][][]} Array of 11 round keys, each 4x4 matrix [row][col]
 */
export function keyExpansion(keyBytes) {
  const W = [];

  // Copy original key into first NK words
  for (let i = 0; i < NK; i++) {
    W[i] = keyBytes.slice(i * 4, i * 4 + 4);
  }

  // Generate remaining words
  for (let i = NK; i < 4 * (NR + 1); i++) {
    let temp = [...W[i - 1]];
    if (i % NK === 0) {
      temp = rotWord(temp);
      temp = temp.map((b) => SBOX[b]);
      temp[0] ^= RCON[i / NK];
    }
    W[i] = W[i - NK].map((b, j) => b ^ temp[j]);
  }

  // Pack into 11 round keys (each 4x4 matrix, column-major)
  const roundKeys = [];
  for (let r = 0; r <= NR; r++) {
    const key = Array.from({ length: 4 }, () => new Array(4));
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        key[row][col] = W[r * 4 + col][row];
      }
    }
    roundKeys.push(key);
  }
  return roundKeys;
}

/**
 * Rotate a 4-byte word left by one position.
 * @param {number[]} word - 4-byte array
 * @returns {number[]}
 */
function rotWord(word) {
  return [word[1], word[2], word[3], word[0]];
}
