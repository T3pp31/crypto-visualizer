/**
 * main.js — Initialization and event wiring (thin glue code)
 * No algorithm logic or DOM generation here.
 */

import { buildAESSteps, keyExpansion } from './algorithms/aes.js';
import { buildRSASteps } from './algorithms/rsa.js';
import { hexToBytes } from './algorithms/utils.js';
import { Stepper } from './visualizer/stepper.js';
import { Renderer } from './visualizer/renderer.js';
import { Animator } from './visualizer/animator.js';

// --- DOM References ---
const algoButtons = document.querySelectorAll('[data-algo]');
const btnEncrypt = document.getElementById('btn-encrypt');
const btnPlay = document.getElementById('btn-play');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnFirst = document.getElementById('btn-first');
const btnLast = document.getElementById('btn-last');
const speedSlider = document.getElementById('speed-slider');
const stepLabel = document.getElementById('step-label');
const progressBar = document.getElementById('progress-bar');
const vizArea = document.getElementById('viz-area');
const roundKeyPanel = document.getElementById('round-key-panel');
const inputError = document.getElementById('input-error');
const aesTextInput = document.getElementById('aes-text-input');
const aesPlaintext = document.getElementById('aes-plaintext');
const aesKey = document.getElementById('aes-key');
const btnRandomKey = document.getElementById('btn-random-key');
const presetButtons = document.querySelectorAll('[data-preset]');

// --- State ---
let currentAlgo = 'aes';
let stepper = null;
let animator = null;
let currentRoundKeys = null;
const renderer = new Renderer(vizArea, roundKeyPanel);
const controlBtns = [btnPlay, btnNext, btnPrev, btnFirst, btnLast];

// --- Algorithm Tab Switching ---
algoButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentAlgo = btn.dataset.algo;
    algoButtons.forEach((b) => {
      b.classList.toggle('algo-tabs__btn--active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    document.querySelectorAll('[data-input-for]').forEach((fs) => {
      fs.classList.toggle('is-hidden', fs.dataset.inputFor !== currentAlgo);
    });
    resetVisualization();
  });
});

// --- Encrypt Button ---
btnEncrypt.addEventListener('click', () => {
  try {
    inputError.textContent = '';
    if (currentAlgo === 'aes') {
      startAES();
    } else {
      startRSA();
    }
  } catch (err) {
    inputError.textContent = err.message;
  }
});

function startAES() {
  const pt = document.getElementById('aes-plaintext').value.trim();
  const key = document.getElementById('aes-key').value.trim();
  validateHex(pt, '平文');
  validateHex(key, '鍵');
  const steps = buildAESSteps(pt, key);
  currentRoundKeys = keyExpansion(hexToBytes(key));
  initVisualization(steps);
}

function startRSA() {
  const p = parseInt(document.getElementById('rsa-p').value, 10);
  const q = parseInt(document.getElementById('rsa-q').value, 10);
  const e = parseInt(document.getElementById('rsa-e').value, 10);
  const m = parseInt(document.getElementById('rsa-message').value, 10);
  if (isNaN(p) || isNaN(q) || isNaN(e) || isNaN(m)) {
    throw new RangeError('すべてのフィールドに数値を入力してください。');
  }
  const steps = buildRSASteps(m, p, q, e);
  currentRoundKeys = null;
  renderer.hideRoundKeys();
  initVisualization(steps);
}

function validateHex(value, name) {
  if (!/^[0-9a-fA-F]{32}$/.test(value)) {
    throw new RangeError(`${name}は32桁の16進数で入力してください（現在: ${value.length}桁）`);
  }
}

function initVisualization(steps) {
  if (animator) animator.pause();
  stepper = new Stepper(steps, onStepChange);
  animator = new Animator(stepper, parseInt(speedSlider.value, 10), onPlayStateChange);
  setControlsEnabled(true);
  stepper.start();
}

function onStepChange(currentStep, prevStep, index, total) {
  renderer.renderStep(currentStep, prevStep);
  stepLabel.textContent = `ステップ: ${index + 1} / ${total}`;
  progressBar.value = total > 1 ? (index / (total - 1)) * 100 : 100;
  updateButtonStates();

  if (currentAlgo === 'aes' && currentRoundKeys) {
    renderer.renderRoundKeys(currentRoundKeys, currentStep.round);
  }
}

function onPlayStateChange(isPlaying) {
  btnPlay.textContent = isPlaying ? '\u23F8' : '\u25B6';
  btnPlay.setAttribute('aria-label', isPlaying ? '一時停止' : '自動再生');
}

function updateButtonStates() {
  if (!stepper) return;
  btnPrev.disabled = stepper.isAtStart;
  btnFirst.disabled = stepper.isAtStart;
  btnNext.disabled = stepper.isAtEnd;
  btnLast.disabled = stepper.isAtEnd;
}

function setControlsEnabled(enabled) {
  controlBtns.forEach((btn) => { btn.disabled = !enabled; });
  updateButtonStates();
}

function resetVisualization() {
  if (animator) animator.pause();
  stepper = null;
  animator = null;
  currentRoundKeys = null;
  vizArea.innerHTML =
    '<p class="viz-area__placeholder">上の「かんたん入力」からサンプルを選ぶか、テキストを入力して「暗号化を開始」ボタンを押してください。</p>';
  stepLabel.textContent = 'ステップ: -- / --';
  progressBar.value = 0;
  setControlsEnabled(false);
  renderer.hideRoundKeys();
}

// --- Playback Controls ---
btnNext.addEventListener('click', () => stepper?.next());
btnPrev.addEventListener('click', () => stepper?.prev());
btnFirst.addEventListener('click', () => stepper?.goTo(0));
btnLast.addEventListener('click', () => stepper?.goTo(stepper.totalSteps - 1));
btnPlay.addEventListener('click', () => animator?.toggle());
speedSlider.addEventListener('input', () => {
  if (animator) animator.setSpeed(parseInt(speedSlider.value, 10));
});

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', (e) => {
  if (!stepper) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      stepper.next();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      stepper.prev();
      break;
    case ' ':
      e.preventDefault();
      animator?.toggle();
      break;
    case 'Home':
      e.preventDefault();
      stepper.goTo(0);
      break;
    case 'End':
      e.preventDefault();
      stepper.goTo(stepper.totalSteps - 1);
      break;
  }
});

// --- Input Helpers ---

const AES_BLOCK_BYTES = 16;

/**
 * Convert an ASCII string to a 32-char hex string (zero-padded to 16 bytes).
 */
function textToHex(text) {
  let hex = '';
  for (let i = 0; i < text.length && i < AES_BLOCK_BYTES; i++) {
    hex += text.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex.padEnd(AES_BLOCK_BYTES * 2, '0');
}

/**
 * Generate a random 32-char hex string (16 bytes).
 */
function randomHex() {
  const bytes = new Uint8Array(AES_BLOCK_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Presets: plaintext + key pairs
const PRESETS = {
  hello: {
    text: 'Hello, World!!!',
    key: '0123456789abcdef0123456789abcdef',
  },
  nist: {
    plaintext: '3243f6a8885a308d313198a2e0370734',
    key: '2b7e151628aed2a6abf7158809cf4f3c',
  },
};

// Text input → auto-convert to HEX
aesTextInput.addEventListener('input', () => {
  const text = aesTextInput.value;
  if (text.length > 0) {
    aesPlaintext.value = textToHex(text);
  } else {
    aesPlaintext.value = '';
  }
});

// If user manually edits the HEX field, clear text input
aesPlaintext.addEventListener('input', () => {
  aesTextInput.value = '';
});

// Random key button
btnRandomKey.addEventListener('click', () => {
  aesKey.value = randomHex();
});

// Preset buttons
presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset;
    if (preset === 'random') {
      aesPlaintext.value = randomHex();
      aesKey.value = randomHex();
      aesTextInput.value = '';
    } else if (PRESETS[preset]) {
      const p = PRESETS[preset];
      if (p.text) {
        aesTextInput.value = p.text;
        aesPlaintext.value = textToHex(p.text);
      } else {
        aesTextInput.value = '';
        aesPlaintext.value = p.plaintext;
      }
      aesKey.value = p.key;
    }
  });
});
