/**
 * mining.js — Simplified Proof-of-Work (pure functions)
 */

import { hashBlock, meetsDifficulty } from './hash.js';

/**
 * Mine a block by incrementing nonce until difficulty is met.
 * @param {Object} block - Block without valid hash/nonce
 * @param {number} leadingZeros
 * @param {number} [startNonce=0]
 * @param {number} [maxAttempts=100000]
 * @returns {Promise<{ block: Object, attempts: number }|null>}
 */
export async function mineBlock(block, leadingZeros, startNonce = 0, maxAttempts = 100000) {
  let nonce = startNonce;
  for (let attempts = 0; attempts < maxAttempts; attempts++, nonce++) {
    const candidate = { ...block, nonce };
    const hash = await hashBlock(candidate);
    if (meetsDifficulty(hash, leadingZeros)) {
      return { block: { ...candidate, hash }, attempts: attempts + 1 };
    }
  }
  return null;
}

/**
 * Mine in batches for UI responsiveness.
 * @param {Object} block
 * @param {number} leadingZeros
 * @param {number} startNonce
 * @param {number} batchSize
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ block: Object, attempts: number }|null>}
 */
export async function mineBlockBatch(block, leadingZeros, startNonce, batchSize, signal) {
  let nonce = startNonce;
  while (!signal?.aborted) {
    const result = await mineBlock(block, leadingZeros, nonce, batchSize);
    if (result) return { ...result, attempts: result.attempts + (nonce - startNonce) };
    nonce += batchSize;
  }
  return null;
}
