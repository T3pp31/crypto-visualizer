/**
 * contract.js — Simple balance transfer for demo (pure functions)
 */

/**
 * Execute transfer if balances allow.
 * @param {Record<string, number>} balances
 * @param {string} from
 * @param {string} to
 * @param {number} amount
 * @returns {{ balances: Record<string, number>, error?: string }}
 */
export function executeTransfer(balances, from, to, amount) {
  const next = { ...balances };
  if (amount <= 0) {
    return { balances: next, error: '金額は1以上にしてください' };
  }
  if (!(from in next) || !(to in next)) {
    return { balances: next, error: 'アカウントが存在しません' };
  }
  if (from === to) {
    return { balances: next, error: '送金元と送金先は異なる必要があります' };
  }
  if (next[from] < amount) {
    return { balances: next, error: `${from} の残高が不足しています` };
  }
  next[from] -= amount;
  next[to] += amount;
  return { balances: next };
}
