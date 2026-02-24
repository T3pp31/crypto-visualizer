/**
 * utils.js — Shared utility functions for cryptographic algorithms
 * Pure functions only. No DOM access.
 */

/**
 * Convert a hex string to a byte array.
 * @param {string} hex - Hex string (e.g. '0f1e2d')
 * @returns {number[]} Array of bytes
 */
export function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Convert a byte array to a hex string.
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert a 16-byte flat array into a 4x4 column-major state matrix.
 * AES spec: state[row][col], filled column-by-column.
 * @param {number[]} bytes - 16-byte array
 * @returns {number[][]} 4x4 matrix
 */
export function bytesToMatrix(bytes) {
  const matrix = Array.from({ length: 4 }, () => new Array(4));
  for (let i = 0; i < 16; i++) {
    const row = i % 4;
    const col = Math.floor(i / 4);
    matrix[row][col] = bytes[i];
  }
  return matrix;
}

/**
 * Convert a 4x4 column-major state matrix back to a 16-byte flat array.
 * @param {number[][]} matrix - 4x4 matrix
 * @returns {number[]}
 */
export function matrixToBytes(matrix) {
  const bytes = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      bytes[col * 4 + row] = matrix[row][col];
    }
  }
  return bytes;
}

/**
 * XOR two byte arrays element-wise.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function xorBytes(a, b) {
  return a.map((val, i) => val ^ b[i]);
}

/**
 * Deep clone a 2D array.
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
export function clone2DArray(matrix) {
  return matrix.map((row) => [...row]);
}

/**
 * Modular exponentiation using BigInt for precision.
 * Computes (base^exp) mod mod.
 * @param {number} base
 * @param {number} exp
 * @param {number} mod
 * @returns {number}
 */
export function modPow(base, exp, mod) {
  let result = 1n;
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % m;
    }
    e = e / 2n;
    b = (b * b) % m;
  }
  return Number(result);
}

/**
 * Greatest common divisor (Euclidean algorithm).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Modular multiplicative inverse using the extended Euclidean algorithm.
 * Finds x such that (a * x) mod m === 1.
 * @param {number} a
 * @param {number} m
 * @returns {number}
 */
export function modInverse(a, m) {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  if (old_r !== 1) {
    throw new RangeError(`${a} の mod ${m} における逆元は存在しません`);
  }
  return ((old_s % m) + m) % m;
}
