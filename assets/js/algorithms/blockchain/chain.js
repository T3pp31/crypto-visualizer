/**
 * chain.js — Chain building and tamper detection (pure functions)
 */

import { createGenesisBlock, finalizeBlock, isPrevHashValid, isBlockHashValid } from './block.js';

/**
 * Build a chain from sample block definitions (without hashes).
 * @param {Array<{index: number, data: string, timestamp?: number}>} samples
 * @returns {Promise<Object[]>}
 */
export async function buildChainFromSamples(samples) {
  const chain = [];
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const prevHash = i === 0 ? undefined : chain[i - 1].hash;
    if (i === 0) {
      const genesis = await createGenesisBlock(sample.data, sample.timestamp);
      chain.push(genesis);
    } else {
      const block = {
        index: sample.index,
        timestamp: sample.timestamp ?? Date.now(),
        data: sample.data,
        prevHash: chain[i - 1].hash,
        nonce: 0,
      };
      chain.push(await finalizeBlock(block));
    }
  }
  return chain;
}

/**
 * Annotate each block with validity status.
 * @param {Object[]} chain
 * @returns {Promise<Array<Object & { valid: boolean, invalidReason?: string }>>}
 */
export async function validateChain(chain) {
  const result = [];
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    const prev = i > 0 ? chain[i - 1] : null;
    let valid = true;
    let invalidReason = '';

    if (!(await isBlockHashValid(block))) {
      valid = false;
      invalidReason = 'ハッシュが一致しません';
    } else if (!isPrevHashValid(block, prev)) {
      valid = false;
      invalidReason = '前ブロックのハッシュとリンクが切れています';
    } else if (prev && !result[i - 1].valid) {
      valid = false;
      invalidReason = '前のブロックが無効なため連鎖が破綻しています';
    }

    result.push({ ...block, valid, invalidReason: valid ? undefined : invalidReason });
  }
  return result;
}

/**
 * Apply tamper to a block's data (does not recompute hash).
 * @param {Object[]} chain
 * @param {number} blockIndex
 * @param {string} newData
 * @returns {Object[]}
 */
export function tamperBlockData(chain, blockIndex, newData) {
  return chain.map((b, i) => (i === blockIndex ? { ...b, data: newData } : { ...b }));
}

/**
 * Clone chain for a network node.
 * @param {Object[]} chain
 * @returns {Object[]}
 */
export function cloneChain(chain) {
  return chain.map((b) => ({ ...b }));
}
