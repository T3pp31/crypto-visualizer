/**
 * caesar.js — Caesar cipher pure functions and step builder
 * Pure functions only. No DOM access.
 */

const ALPHABET_SIZE = 26;

/**
 * Shift a single character by the given amount.
 * Only shifts A-Z and a-z; other characters are unchanged.
 * @param {string} char - Single character
 * @param {number} shift - Shift amount (can be negative for decryption)
 * @returns {{ original: string, shifted: string, isAlpha: boolean, base: number, pos: number, newPos: number }}
 */
function shiftChar(char, shift) {
  const code = char.charCodeAt(0);
  let base;

  if (code >= 65 && code <= 90) {
    base = 65; // 'A'
  } else if (code >= 97 && code <= 122) {
    base = 97; // 'a'
  } else {
    return { original: char, shifted: char, isAlpha: false, base: 0, pos: 0, newPos: 0 };
  }

  const pos = code - base;
  const newPos = ((pos + shift) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
  const shifted = String.fromCharCode(base + newPos);

  return { original: char, shifted, isAlpha: true, base, pos, newPos };
}

/**
 * Encrypt a plaintext string with Caesar cipher.
 * @param {string} text
 * @param {number} shift
 * @returns {string}
 */
export function caesarEncrypt(text, shift) {
  return [...text].map((ch) => shiftChar(ch, shift).shifted).join('');
}

/**
 * Decrypt a ciphertext string with Caesar cipher.
 * @param {string} text
 * @param {number} shift
 * @returns {string}
 */
export function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, -shift);
}

/**
 * Build the full sequence of Caesar cipher steps for visualization.
 * @param {string} plaintext
 * @param {number} shift - Shift amount (1-25)
 * @returns {Object[]} Array of step objects
 */
export function buildCaesarSteps(plaintext, shift) {
  if (plaintext.length === 0) {
    throw new RangeError('テキストを入力してください。');
  }
  const normalizedShift = ((shift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
  if (normalizedShift === 0) {
    throw new RangeError('シフト量は1〜25の範囲で指定してください。');
  }

  const steps = [];
  const chars = [...plaintext];
  const charResults = chars.map((ch) => shiftChar(ch, normalizedShift));

  // Step 1: Overview
  steps.push({
    algorithm: 'caesar',
    id: 'caesar-overview',
    phase: 'overview',
    label: 'シーザー暗号の概要',
    description: `各アルファベットを${normalizedShift}文字分ずらして暗号化します。記号・数字・スペースはそのまま残ります。`,
    formula: `シフト量: ${normalizedShift}`,
    plaintext,
    shift: normalizedShift,
    charResults: charResults.map((r) => ({ ...r, status: 'pending' })),
    ciphertextSoFar: '',
  });

  // Per-character steps
  let ciphertextSoFar = '';
  for (let i = 0; i < chars.length; i++) {
    const r = charResults[i];
    ciphertextSoFar += r.shifted;

    const charLabel = r.isAlpha
      ? `${r.original} → ${r.shifted}`
      : `${r.original}（変換なし）`;

    const charDesc = r.isAlpha
      ? `'${r.original}' はアルファベットの${r.pos + 1}番目。${normalizedShift}つずらすと${r.newPos + 1}番目の '${r.shifted}' になります。`
      : `'${r.original}' はアルファベットではないため、そのまま残します。`;

    const formula = r.isAlpha
      ? `${r.original}(${r.pos}) + ${normalizedShift} = ${r.newPos} → ${r.shifted}`
      : `${r.original} → ${r.shifted}（変換なし）`;

    steps.push({
      algorithm: 'caesar',
      id: `caesar-char-${i}`,
      phase: 'encrypt',
      label: `文字 ${i + 1}: ${charLabel}`,
      description: charDesc,
      formula,
      plaintext,
      shift: normalizedShift,
      currentCharIndex: i,
      charResults: charResults.map((cr, j) => ({
        ...cr,
        status: j < i ? 'done' : j === i ? 'active' : 'pending',
      })),
      ciphertextSoFar,
    });
  }

  // Final result
  const fullCiphertext = ciphertextSoFar;
  steps.push({
    algorithm: 'caesar',
    id: 'caesar-result',
    phase: 'result',
    label: '暗号化完了',
    description: 'すべての文字の変換が完了しました。',
    formula: `平文: ${plaintext}\n暗号文: ${fullCiphertext}`,
    plaintext,
    shift: normalizedShift,
    charResults: charResults.map((r) => ({ ...r, status: 'done' })),
    ciphertextSoFar: fullCiphertext,
    values: { '平文': plaintext, '暗号文': fullCiphertext, 'シフト量': normalizedShift },
  });

  // Decryption verification
  const decrypted = caesarDecrypt(fullCiphertext, normalizedShift);
  steps.push({
    algorithm: 'caesar',
    id: 'caesar-decrypt-verify',
    phase: 'decrypt',
    label: '復号の検証',
    description: `暗号文を逆方向に${normalizedShift}文字ずらすと元のテキストに戻ります。`,
    formula: `暗号文: ${fullCiphertext}\n復号: ${decrypted}`,
    plaintext,
    shift: normalizedShift,
    charResults: charResults.map((r) => ({ ...r, status: 'done' })),
    ciphertextSoFar: fullCiphertext,
    values: {
      '暗号文': fullCiphertext,
      '復号結果': decrypted,
      '一致': decrypted === plaintext ? 'Yes' : 'No',
    },
  });

  return steps;
}
