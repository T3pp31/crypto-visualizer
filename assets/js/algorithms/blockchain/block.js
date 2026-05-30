/**
 * block.js — Block creation and validation (pure functions)
 */

import { hashBlock } from './hash.js';

const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Create a block object (hash computed separately).
 * @param {Object} params
 * @param {number} params.index
 * @param {string} params.data
 * @param {string} [params.prevHash]
 * @param {number} [params.timestamp]
 * @param {number} [params.nonce]
 * @returns {Object}
 */
export function createBlock({ index, data, prevHash = GENESIS_PREV_HASH, timestamp, nonce = 0 }) {
  return {
    index,
    timestamp: timestamp ?? Date.now(),
    data,
    prevHash,
    nonce,
    hash: '',
  };
}

/**
 * Fill in hash for a block.
 * @param {Object} block
 * @returns {Promise<Object>}
 */
export async function finalizeBlock(block) {
  const hash = await hashBlock(block);
  return { ...block, hash };
}

/**
 * Build genesis block.
 * @param {string} data
 * @param {number} [timestamp]
 * @returns {Promise<Object>}
 */
export async function createGenesisBlock(data, timestamp) {
  const block = createBlock({
    index: 0,
    data,
    prevHash: GENESIS_PREV_HASH,
    timestamp: timestamp ?? 1700000000000,
  });
  return finalizeBlock(block);
}

/**
 * Validate that block's prevHash matches previous block's hash.
 * @param {Object} block
 * @param {Object|null} previousBlock
 * @returns {boolean}
 */
export function isPrevHashValid(block, previousBlock) {
  if (block.index === 0) {
    return block.prevHash === GENESIS_PREV_HASH;
  }
  if (!previousBlock) return false;
  return block.prevHash === previousBlock.hash;
}

/**
 * Validate block hash matches recomputed hash.
 * @param {Object} block
 * @returns {Promise<boolean>}
 */
export async function isBlockHashValid(block) {
  const expected = await hashBlock(block);
  return block.hash === expected;
}

export { GENESIS_PREV_HASH };
