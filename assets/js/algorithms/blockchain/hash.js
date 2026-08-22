/**
 * hash.js — SHA-256 helpers for blockchain demos (pure, no DOM)
 */

const textEncoder = new TextEncoder();
const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

/**
 * Compute SHA-256 hex digest of a string.
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function sha256Hex(input) {
  const encoded = textEncoder.encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += HEX[bytes[i]];
  }
  return hex;
}

/**
 * Build the canonical header string used for block hashing.
 * @param {Object} block
 * @param {number} block.index
 * @param {number} block.timestamp
 * @param {string} block.data
 * @param {string} block.prevHash
 * @param {number} [block.nonce]
 * @returns {string}
 */
export function blockHeaderString({ index, timestamp, data, prevHash, nonce = 0 }) {
  return `${index}${timestamp}${data}${prevHash}${nonce}`;
}

/**
 * Hash a block header (includes nonce for PoW).
 * @param {Object} block
 * @returns {Promise<string>}
 */
export async function hashBlock(block) {
  return sha256Hex(blockHeaderString(block));
}

/**
 * Hash a block header with only the nonce overridden (PoW mining path).
 * @param {Object} block
 * @param {number} nonce
 * @returns {Promise<string>}
 */
export async function hashBlockWithNonce(block, nonce) {
  return sha256Hex(blockHeaderString({ ...block, nonce }));
}

/**
 * Check if hash meets PoW difficulty (leading hex zeros).
 * @param {string} hash
 * @param {number} leadingZeros
 * @returns {boolean}
 */
export function meetsDifficulty(hash, leadingZeros) {
  const prefix = '0'.repeat(leadingZeros);
  return hash.startsWith(prefix);
}
