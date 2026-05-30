/**
 * blockchain-main.js — Blockchain tutorial page wiring
 */

import { buildChapterSteps, getChapterIds } from '../algorithms/blockchain/steps.js';
import { buildChainFromSamples, validateChain, tamperBlockData } from '../algorithms/blockchain/chain.js';
import { createBlock } from '../algorithms/blockchain/block.js';
import { hashBlock } from '../algorithms/blockchain/hash.js';
import { mineBlockBatch } from '../algorithms/blockchain/mining.js';
import { executeTransfer } from '../algorithms/blockchain/contract.js';
import { Stepper } from '../visualizer/stepper.js';
import { Animator } from '../visualizer/animator.js';
import { BlockchainRenderer } from '../visualizer/blockchain-renderer.js';

const FALLBACK_CONFIG = {
  powLeadingZeros: 2,
  miningBatchSize: 500,
  sampleBlocks: [
    { index: 0, data: 'Genesis Block', timestamp: 1700000000000 },
    { index: 1, data: 'Alice → Bob: 10 BTC', timestamp: 1700000060000 },
    { index: 2, data: 'Bob → Carol: 3 BTC', timestamp: 1700000120000 },
  ],
  contractDemo: {
    accounts: { Alice: 100, Bob: 50, Carol: 0 },
    defaultTransfer: { from: 'Alice', to: 'Bob', amount: 10 },
  },
  chapters: [
    { id: 'intro', title: '概要' },
    { id: 'block', title: 'ブロック' },
    { id: 'chain', title: 'チェーン' },
    { id: 'ledger', title: '分散台帳' },
    { id: 'pow', title: 'PoW' },
    { id: 'pos', title: 'PoS' },
    { id: 'fork', title: 'フォーク' },
    { id: 'contract', title: 'コントラクト' },
    { id: 'crypto-link', title: '暗号' },
  ],
};

const chapterButtons = document.querySelectorAll('[data-chapter]');
const btnStart = document.getElementById('btn-start-chapter');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnFirst = document.getElementById('btn-first');
const btnLast = document.getElementById('btn-last');
const btnPlay = document.getElementById('btn-play');
const speedSlider = document.getElementById('speed-slider');
const stepLabel = document.getElementById('step-label');
const progressBar = document.getElementById('progress-bar');
const vizArea = document.getElementById('viz-area');
const inputError = document.getElementById('input-error');
const controlBtns = [btnPlay, btnNext, btnPrev, btnFirst, btnLast];

let config = FALLBACK_CONFIG;
let currentChapter = 'intro';
let stepper = null;
let animator = null;
let currentSteps = [];
let activeStep = null;
let miningAbort = null;

const appState = {
  validatedChain: [],
  rawChain: [],
  demoBlock: null,
  demoBlockHash: '',
  previousHash: '',
  networkNodes: [],
  miningBlock: null,
  miningAttempts: 0,
  miningStatus: '待機中',
  miningRunning: false,
  balances: {},
  contractError: '',
  selectedValidator: 'ノードA',
  validators: [
    { name: 'ノードA', stake: 40 },
    { name: 'ノードB', stake: 35 },
    { name: 'ノードC', stake: 25 },
  ],
};

const renderer = new BlockchainRenderer(vizArea, {
  onBlockDataChange: (data) => updateDemoBlock(data),
  onChainTamper: (index) => tamperChain(index),
  onNodeTamper: (nodeIndex) => tamperNode(nodeIndex),
  onMineStart: () => startMining(),
  onMineStop: () => stopMining(),
  onContractTransfer: (from, to, amount) => runTransfer(from, to, amount),
  onReselectValidator: () => reselectValidator(),
});

async function loadConfig() {
  try {
    const res = await fetch('../assets/config/blockchain.json');
    if (res.ok) {
      config = await res.json();
    }
  } catch {
    config = FALLBACK_CONFIG;
  }
}

function initChapterTabs() {
  const ids = getChapterIds(config);
  chapterButtons.forEach((btn) => {
    if (!ids.includes(btn.dataset.chapter)) {
      btn.classList.add('is-hidden');
    }
    btn.addEventListener('click', () => {
      currentChapter = btn.dataset.chapter;
      chapterButtons.forEach((b) => {
        b.classList.toggle('chapter-tabs__btn--active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      resetVisualization();
    });
  });
}

async function prepareChapterState(chapter) {
  if (chapter === 'chain' || chapter === 'ledger') {
    appState.rawChain = await buildChainFromSamples(config.sampleBlocks);
    appState.validatedChain = await validateChain(appState.rawChain);
    updateNetworkNodes(false);
  }
  if (chapter === 'block') {
    const sample = config.sampleBlocks[1];
    appState.demoBlock = {
      index: sample.index,
      timestamp: sample.timestamp,
      data: sample.data,
      prevHash: '0'.repeat(64),
      nonce: 0,
    };
    await updateDemoBlock(sample.data);
  }
  if (chapter === 'pow') {
    const prev = appState.rawChain.length
      ? appState.rawChain[appState.rawChain.length - 1]
      : await buildChainFromSamples(config.sampleBlocks).then((c) => c[c.length - 1]);
    appState.miningBlock = createBlock({
      index: (prev?.index ?? 0) + 1,
      data: '新規ブロック（マイニング待ち）',
      prevHash: prev?.hash ?? '0'.repeat(64),
      timestamp: Date.now(),
    });
    appState.miningBlock.hash = '';
    appState.miningAttempts = 0;
    appState.miningStatus = '待機中';
    appState.miningRunning = false;
  }
  if (chapter === 'contract') {
    appState.balances = { ...config.contractDemo.accounts };
    appState.contractError = '';
  }
}

async function updateDemoBlock(data) {
  if (!appState.demoBlock) return;
  if (appState.demoBlockHash) {
    appState.previousHash = appState.demoBlockHash;
  }
  appState.demoBlock = { ...appState.demoBlock, data };
  appState.demoBlockHash = await hashBlock(appState.demoBlock);
  refreshView();
}

async function tamperChain(blockIndex) {
  const tampered = tamperBlockData(appState.rawChain, blockIndex, `${appState.rawChain[blockIndex].data} [改ざん]`);
  appState.rawChain = tampered;
  appState.validatedChain = await validateChain(tampered);
  refreshView();
}

function tamperNode(nodeIndex) {
  updateNetworkNodes(true, nodeIndex);
  refreshView();
}

function updateNetworkNodes(withTamper, tamperNodeIndex = -1) {
  const valid = appState.validatedChain.every((b) => b.valid);
  appState.networkNodes = [
    { name: 'ノード1', chainLength: appState.validatedChain.length, valid, inSync: true },
    { name: 'ノード2', chainLength: appState.validatedChain.length, valid: !withTamper || tamperNodeIndex !== 1, inSync: tamperNodeIndex !== 1 },
    { name: 'ノード3', chainLength: appState.validatedChain.length, valid, inSync: true },
  ];
  if (withTamper && tamperNodeIndex === 1) {
    appState.networkNodes[1].chainLength = appState.validatedChain.length;
    appState.networkNodes[1].valid = false;
    appState.networkNodes[1].inSync = false;
  }
}

function reselectValidator() {
  const names = appState.validators.map((v) => v.name);
  const weights = appState.validators.map((v) => v.stake);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < names.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      appState.selectedValidator = names[i];
      break;
    }
  }
  refreshView();
}

function runTransfer(from, to, amount) {
  const result = executeTransfer(appState.balances, from, to, amount);
  appState.balances = result.balances;
  appState.contractError = result.error ?? '';
  refreshView();
}

async function startMining() {
  if (appState.miningRunning || !appState.miningBlock) return;
  appState.miningRunning = true;
  appState.miningStatus = 'マイニング中…';
  miningAbort = new AbortController();
  refreshView();

  const leading = config.powLeadingZeros ?? 2;
  const batch = config.miningBatchSize ?? 500;
  let nonce = appState.miningBlock.nonce ?? 0;
  let attempts = appState.miningAttempts;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  while (!miningAbort.signal.aborted) {
    const result = await mineBlockBatch(
      appState.miningBlock,
      leading,
      nonce,
      batch,
      miningAbort.signal,
    );
    attempts += batch;
    appState.miningAttempts = attempts;
    appState.miningBlock = { ...appState.miningBlock, nonce: nonce + batch };
    const previewHash = await hashBlock({ ...appState.miningBlock, nonce: nonce + batch - 1 });
    appState.miningBlock.hash = previewHash;

    if (result) {
      appState.miningBlock = result.block;
      appState.miningAttempts = result.attempts;
      appState.miningStatus = '完了（ブロック承認）';
      appState.miningRunning = false;
      refreshView();
      return;
    }

    nonce += batch;
    appState.miningBlock.nonce = nonce;
    refreshView();

    if (!reducedMotion) {
      await new Promise((r) => requestAnimationFrame(r));
    }
  }
  appState.miningStatus = '中断';
  appState.miningRunning = false;
  refreshView();
}

function stopMining() {
  miningAbort?.abort();
  appState.miningRunning = false;
  appState.miningStatus = '中断';
  refreshView();
}

async function startChapter() {
  try {
    inputError.textContent = '';
    stopMining();
    await prepareChapterState(currentChapter);
    currentSteps = buildChapterSteps(currentChapter, config);
    if (currentSteps.length === 0) {
      throw new Error('この章のステップがありません。');
    }
    initVisualization(currentSteps);
  } catch (err) {
    inputError.textContent = err.message;
  }
}

function initVisualization(steps) {
  if (animator) animator.pause();
  stepper = new Stepper(steps, onStepChange);
  animator = new Animator(stepper, parseInt(speedSlider.value, 10), onPlayStateChange);
  setControlsEnabled(true);
  stepper.start();
}

function onStepChange(currentStep) {
  activeStep = currentStep;
  renderer.renderStep(currentStep, appState);
  const index = stepper.currentIndex;
  const total = stepper.totalSteps;
  stepLabel.textContent = `ステップ: ${index + 1} / ${total}`;
  progressBar.value = total > 1 ? (index / (total - 1)) * 100 : 100;
  updateButtonStates();
}

function refreshView() {
  if (!stepper || !activeStep) return;
  renderer.renderStep(activeStep, appState);
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
  controlBtns.forEach((btn) => {
    btn.disabled = !enabled;
  });
  updateButtonStates();
}

function resetVisualization() {
  if (animator) animator.pause();
  stopMining();
  stepper = null;
  animator = null;
  activeStep = null;
  vizArea.innerHTML =
    '<p class="viz-area__placeholder">章を選び「学習を開始」を押すとステップが表示されます。</p>';
  stepLabel.textContent = 'ステップ: -- / --';
  progressBar.value = 0;
  setControlsEnabled(false);
}

btnStart.addEventListener('click', () => startChapter());
btnNext.addEventListener('click', () => stepper?.next());
btnPrev.addEventListener('click', () => stepper?.prev());
btnFirst.addEventListener('click', () => stepper?.goTo(0));
btnLast.addEventListener('click', () => stepper?.goTo(stepper.totalSteps - 1));
btnPlay.addEventListener('click', () => animator?.toggle());
speedSlider.addEventListener('input', () => {
  if (animator) animator.setSpeed(parseInt(speedSlider.value, 10));
});

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
    default:
      break;
  }
});

loadConfig().then(() => {
  initChapterTabs();
});
