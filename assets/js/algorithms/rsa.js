/**
 * rsa.js — RSA key generation, encryption, decryption, and step builder
 * Pure functions only. No DOM access.
 */

import { modPow, gcd, modInverse } from './utils.js';

/**
 * Check if a number is prime (trial division).
 * @param {number} n
 * @returns {boolean}
 */
function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Generate RSA key parameters from two primes and a public exponent.
 * @param {number} p - First prime
 * @param {number} q - Second prime
 * @param {number} e - Public exponent
 * @returns {{ p: number, q: number, n: number, phi: number, e: number, d: number }}
 */
export function generateRSAKeys(p, q, e) {
  if (!isPrime(p)) throw new RangeError(`p = ${p} は素数ではありません`);
  if (!isPrime(q)) throw new RangeError(`q = ${q} は素数ではありません`);
  if (p === q) throw new RangeError('p と q は異なる素数を選んでください');
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  if (e < 2 || e >= phi) {
    throw new RangeError(`e = ${e} は 2 ≤ e < φ(n) = ${phi} を満たす必要があります`);
  }
  if (gcd(e, phi) !== 1) {
    throw new RangeError(`e = ${e} と φ(n) = ${phi} は互いに素ではありません`);
  }
  const d = modInverse(e, phi);
  return { p, q, n, phi, e, d };
}

/**
 * RSA encryption: C = M^e mod n
 * @param {number} m - Plaintext message (0 ≤ m < n)
 * @param {number} e - Public exponent
 * @param {number} n - Modulus
 * @returns {number} Ciphertext
 */
export function rsaEncrypt(m, e, n) {
  if (m < 0 || m >= n) {
    throw new RangeError(`メッセージ M = ${m} は 0 ≤ M < n = ${n} を満たす必要があります`);
  }
  return modPow(m, e, n);
}

/**
 * RSA decryption: M = C^d mod n
 * @param {number} c - Ciphertext
 * @param {number} d - Private exponent
 * @param {number} n - Modulus
 * @returns {number} Plaintext message
 */
export function rsaDecrypt(c, d, n) {
  return modPow(c, d, n);
}

/**
 * Build the full sequence of RSA steps for visualization.
 * @param {number} message - Plaintext number
 * @param {number} [p=61] - First prime
 * @param {number} [q=53] - Second prime
 * @param {number} [e=17] - Public exponent
 * @returns {Object[]} Array of step objects
 */
export function buildRSASteps(message, p = 61, q = 53, e = 17) {
  const steps = [];
  const keys = generateRSAKeys(p, q, e);
  const { n, phi, d } = keys;

  // Key Generation
  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-primes', phase: 'keygen',
    operation: 'choosePrimes', label: '素数の選択',
    description: '2つの素数 p と q を選びます。これらは秘密にしておきます。',
    formula: `p = ${p}, q = ${q}`,
    values: { p, q }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-n', phase: 'keygen',
    operation: 'computeN', label: 'n の計算',
    description: 'p と q の積 n を計算します。n は公開鍵の一部になります。',
    formula: `n = p × q = ${p} × ${q} = ${n}`,
    values: { p, q, n }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-phi', phase: 'keygen',
    operation: 'computePhi', label: 'φ(n) の計算',
    description: 'オイラーのトーシェント関数 φ(n) = (p−1)(q−1) を計算します。',
    formula: `φ(n) = (p−1)(q−1) = ${p - 1} × ${q - 1} = ${phi}`,
    values: { p, q, n, phi }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-e', phase: 'keygen',
    operation: 'chooseE', label: '公開指数 e の選択',
    description: `gcd(e, φ(n)) = 1 を満たす e を選びます。`,
    formula: `e = ${e} (gcd(${e}, ${phi}) = ${gcd(e, phi)})`,
    values: { e, phi, gcdResult: gcd(e, phi) }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-d', phase: 'keygen',
    operation: 'computeD', label: '秘密指数 d の計算',
    description: 'e × d ≡ 1 (mod φ(n)) を満たす d を計算します（拡張ユークリッド互除法）。',
    formula: `d = e⁻¹ mod φ(n) = ${e}⁻¹ mod ${phi} = ${d}`,
    values: { e, phi, d }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-keygen-keys', phase: 'keygen',
    operation: 'showKeys', label: '鍵ペアの確認',
    description: '公開鍵 (e, n) と秘密鍵 (d, n) が生成されました。',
    formula: `公開鍵 (e, n) = (${e}, ${n})\n秘密鍵 (d, n) = (${d}, ${n})`,
    values: { e, n, d }, detail: null,
  });

  // Encryption
  steps.push({
    algorithm: 'rsa', id: 'rsa-encrypt-input', phase: 'encrypt',
    operation: 'inputMessage', label: '平文の入力',
    description: '暗号化するメッセージ M を数値で入力します（0 ≤ M < n）。',
    formula: `M = ${message}`,
    values: { message, n }, detail: null,
  });

  const ciphertext = rsaEncrypt(message, e, n);
  steps.push({
    algorithm: 'rsa', id: 'rsa-encrypt-compute', phase: 'encrypt',
    operation: 'computePower', label: 'べき乗剰余の計算',
    description: '公開鍵 (e, n) を使って C = Mᵉ mod n を計算します。',
    formula: `C = M^e mod n = ${message}^${e} mod ${n}`,
    values: { message, e, n }, detail: null,
  });

  steps.push({
    algorithm: 'rsa', id: 'rsa-encrypt-result', phase: 'encrypt',
    operation: 'showCipher', label: '暗号文の出力',
    description: '暗号文 C が得られました。',
    formula: `C = ${ciphertext}`,
    values: { ciphertext }, detail: null,
  });

  // Decryption
  steps.push({
    algorithm: 'rsa', id: 'rsa-decrypt-input', phase: 'decrypt',
    operation: 'inputCipher', label: '暗号文の入力',
    description: '復号する暗号文 C を入力します。',
    formula: `C = ${ciphertext}`,
    values: { ciphertext }, detail: null,
  });

  const decrypted = rsaDecrypt(ciphertext, d, n);
  steps.push({
    algorithm: 'rsa', id: 'rsa-decrypt-compute', phase: 'decrypt',
    operation: 'computeDecrypt', label: '復号の計算',
    description: '秘密鍵 (d, n) を使って M = Cᵈ mod n を計算します。',
    formula: `M = C^d mod n = ${ciphertext}^${d} mod ${n}`,
    values: { ciphertext, d, n }, detail: null,
  });

  const match = decrypted === message;
  steps.push({
    algorithm: 'rsa', id: 'rsa-decrypt-result', phase: 'decrypt',
    operation: 'showPlain', label: '復号結果の確認',
    description: match
      ? '復号された値が元のメッセージと一致しました。'
      : '復号された値が元のメッセージと一致しませんでした。',
    formula: `M = ${decrypted} ${match ? '✓ 一致' : '✗ 不一致'}`,
    values: { decrypted, original: message, match }, detail: null,
  });

  return steps;
}
