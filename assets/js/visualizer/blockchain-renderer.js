/**
 * blockchain-renderer.js — DOM for blockchain tutorial steps
 */

export class BlockchainRenderer {
  #vizArea;
  #callbacks;

  /**
   * @param {HTMLElement} vizArea
   * @param {Object} callbacks
   * @param {Function} [callbacks.onBlockDataChange]
   * @param {Function} [callbacks.onChainTamper]
   * @param {Function} [callbacks.onNodeTamper]
   * @param {Function} [callbacks.onMineStart]
   * @param {Function} [callbacks.onMineStop]
   * @param {Function} [callbacks.onContractTransfer]
   */
  constructor(vizArea, callbacks = {}) {
    this.#vizArea = vizArea;
    this.#callbacks = callbacks;
  }

  /**
   * @param {Object} step
   * @param {Object} appState
   */
  renderStep(step, appState) {
    this.#vizArea.innerHTML = '';
    const card = this.#buildCard(step);
    const viz = document.createElement('div');
    viz.className = 'bc-viz';

    switch (step.vizType) {
      case 'block':
        viz.append(this.#renderBlock(step, appState));
        break;
      case 'chain':
        viz.append(this.#renderChain(step, appState));
        break;
      case 'network':
        viz.append(this.#renderNetwork(step, appState));
        break;
      case 'mining':
        viz.append(this.#renderMining(step, appState));
        break;
      case 'pos':
        viz.append(this.#renderPos(step, appState));
        break;
      case 'fork':
        viz.append(this.#renderFork(step, appState));
        break;
      case 'contract':
        viz.append(this.#renderContract(step, appState));
        break;
      default:
        if (step.linkToRsa || step.linkToAes) {
          viz.append(this.#renderLinks(step));
        }
        break;
    }

    if (viz.childNodes.length > 0) {
      card.append(viz);
    }
    this.#appendCard(card);
  }

  #buildCard(step) {
    const article = document.createElement('article');
    article.className = 'step-card';
    article.dataset.step = step.id;

    const header = document.createElement('div');
    header.className = 'step-card__header';

    if (step.phase) {
      const badge = document.createElement('span');
      badge.className = 'step-card__round-badge';
      badge.textContent = step.chapter;
      header.append(badge);
    }

    const title = document.createElement('h3');
    title.className = 'step-card__title';
    title.textContent = step.label;
    header.append(title);
    article.append(header);

    const desc = document.createElement('p');
    desc.className = 'step-card__description';
    desc.textContent = step.description;
    article.append(desc);

    if (step.formula) {
      const formula = document.createElement('div');
      formula.className = 'step-card__formula';
      formula.textContent = step.formula;
      article.append(formula);
    }

    return article;
  }

  #renderBlock(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-block-demo';

    const block = appState.demoBlock ?? step.demoBlock;
    if (!block) return wrap;

    const fields = [
      ['index', 'インデックス', block.index],
      ['timestamp', 'タイムスタンプ', block.timestamp],
      ['data', 'データ', block.data],
      ['prevHash', '前ブロックハッシュ', block.prevHash],
      ['nonce', 'nonce', block.nonce ?? 0],
      ['hash', 'ハッシュ', appState.demoBlockHash ?? block.hash ?? '—'],
    ];

    const grid = document.createElement('dl');
    grid.className = 'bc-fields';

    for (const [key, label, value] of fields) {
      const dt = document.createElement('dt');
      dt.className = 'bc-fields__label';
      if (step.highlightField === key) dt.classList.add('bc-fields__label--highlight');
      dt.textContent = label;

      const dd = document.createElement('dd');
      dd.className = 'bc-fields__value';
      if (key === 'hash' || key === 'prevHash') dd.classList.add('bc-fields__value--mono');

      if (step.interactive && step.editableField === key && key === 'data') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'bc-fields__input';
        input.value = String(block.data);
        input.setAttribute('aria-label', 'ブロックデータ');
        input.addEventListener('input', () => {
          this.#callbacks.onBlockDataChange?.(input.value);
        });
        dd.append(input);
      } else {
        dd.textContent = String(value);
      }
      grid.append(dt, dd);
    }

    wrap.append(grid);

    if (step.showHashCompare && appState.previousHash) {
      const cmp = document.createElement('p');
      cmp.className = 'bc-hash-compare';
      cmp.textContent = `変更前のハッシュ: ${appState.previousHash.slice(0, 16)}…`;
      wrap.append(cmp);
    }

    return wrap;
  }

  #renderChain(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-chain';

    const chain = appState.validatedChain ?? [];
    chain.forEach((block, i) => {
      if (i > 0) {
        const arrow = document.createElement('div');
        arrow.className = 'bc-chain__arrow';
        arrow.textContent = '↓ prevHash';
        arrow.setAttribute('aria-hidden', 'true');
        wrap.append(arrow);
      }

      const card = document.createElement('div');
      card.className = 'bc-block-card';
      if (!block.valid) {
        card.classList.add('bc-block-card--invalid');
        card.setAttribute('aria-invalid', 'true');
      }
      if (step.highlightIndex === i) {
        card.classList.add('bc-block-card--highlight');
      }

      const title = document.createElement('div');
      title.className = 'bc-block-card__title';
      title.textContent = `ブロック #${block.index}`;
      card.append(title);

      const data = document.createElement('div');
      data.className = 'bc-block-card__data';
      data.textContent = block.data;
      card.append(data);

      const hash = document.createElement('div');
      hash.className = 'bc-block-card__hash';
      hash.textContent = `hash: ${(block.hash || '').slice(0, 20)}…`;
      card.append(hash);

      const status = document.createElement('div');
      status.className = 'bc-block-card__status';
      status.textContent = block.valid ? '有効' : `無効: ${block.invalidReason}`;
      card.append(status);

      wrap.append(card);
    });

    if (step.interactive && step.tamperIndex !== undefined) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bc-action-btn';
      btn.textContent = `ブロック${step.tamperIndex}のデータを改ざん`;
      btn.setAttribute('aria-label', 'ブロックデータを改ざんしてチェーンを無効化');
      btn.addEventListener('click', () => {
        this.#callbacks.onChainTamper?.(step.tamperIndex);
      });
      wrap.append(btn);
    }

    return wrap;
  }

  #renderNetwork(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-network';

    const nodes = appState.networkNodes ?? [];
    nodes.forEach((node, i) => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'bc-node';
      if (!node.inSync) nodeEl.classList.add('bc-node--desync');

      const label = document.createElement('div');
      label.className = 'bc-node__label';
      label.textContent = node.name;
      nodeEl.append(label);

      const chainLen = document.createElement('div');
      chainLen.className = 'bc-node__info';
      chainLen.textContent = `ブロック数: ${node.chainLength} / 有効: ${node.valid ? 'はい' : 'いいえ'}`;
      nodeEl.append(chainLen);

      wrap.append(nodeEl);

      if (step.interactive && step.tamperNode === i) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bc-action-btn';
        btn.textContent = `${node.name}を改ざん`;
        btn.addEventListener('click', () => {
          this.#callbacks.onNodeTamper?.(i);
        });
        wrap.append(btn);
      }
    });

    return wrap;
  }

  #renderMining(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-mining';

    const info = document.createElement('dl');
    info.className = 'bc-fields';
    const fields = [
      ['データ', appState.miningBlock?.data ?? '—'],
      ['nonce', appState.miningBlock?.nonce ?? 0],
      ['ハッシュ', appState.miningBlock?.hash ?? '（未計算）'],
      ['試行回数', appState.miningAttempts ?? 0],
      ['状態', appState.miningStatus ?? '待機中'],
    ];
    for (const [label, value] of fields) {
      const dt = document.createElement('dt');
      dt.className = 'bc-fields__label';
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.className = 'bc-fields__value bc-fields__value--mono';
      dd.textContent = String(value);
      info.append(dt, dd);
    }
    wrap.append(info);

    if (step.interactive) {
      const controls = document.createElement('div');
      controls.className = 'bc-mining__controls';

      const startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'bc-action-btn bc-action-btn--primary';
      startBtn.textContent = 'マイニング開始';
      startBtn.disabled = appState.miningRunning;
      startBtn.addEventListener('click', () => this.#callbacks.onMineStart?.());

      const stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'bc-action-btn';
      stopBtn.textContent = '中断';
      stopBtn.disabled = !appState.miningRunning;
      stopBtn.addEventListener('click', () => this.#callbacks.onMineStop?.());

      controls.append(startBtn, stopBtn);
      wrap.append(controls);
    }

    return wrap;
  }

  #renderPos(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-pos';

    const validators = step.validators ?? appState.validators ?? [];
    validators.forEach((v) => {
      const row = document.createElement('div');
      row.className = 'bc-pos__row';
      if (appState.selectedValidator === v.name || step.selectedValidator === v.name) {
        row.classList.add('bc-pos__row--selected');
      }
      row.innerHTML = `<span class="bc-pos__name">${v.name}</span>
        <span class="bc-pos__stake">ステーク: ${v.stake}%</span>
        <div class="bc-pos__bar" style="width: ${v.stake}%"></div>`;
      wrap.append(row);
    });

    if (step.interactive) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bc-action-btn';
      btn.textContent = '検証者を再抽選';
      btn.addEventListener('click', () => this.#callbacks.onReselectValidator?.());
      wrap.append(btn);
    }

    return wrap;
  }

  #renderFork(step) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-fork';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'フォークの分岐図');

    const phases = {
      split: ['共通: B0 → B1 → B2', '分岐: B3a', '分岐: B3b'],
      compete: ['枝A: B3a → B4a', '枝B: B3b → B4b'],
      resolved: ['採用: B3a → B4a → B5a（最長）', '孤立: B3b → B4b（オーファン）'],
    };
    const lines = phases[step.forkPhase] ?? phases.split;

    lines.forEach((line, i) => {
      const el = document.createElement('div');
      el.className = 'bc-fork__branch';
      if (step.forkPhase === 'resolved' && i === 1) {
        el.classList.add('bc-fork__branch--orphan');
      }
      if (step.forkPhase === 'resolved' && i === 0) {
        el.classList.add('bc-fork__branch--winner');
      }
      el.textContent = line;
      wrap.append(el);
    });

    return wrap;
  }

  #renderContract(step, appState) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-contract';

    const balances = appState.balances ?? step.balances ?? {};
    const table = document.createElement('dl');
    table.className = 'bc-balances';
    for (const [name, amount] of Object.entries(balances)) {
      const dt = document.createElement('dt');
      dt.textContent = name;
      const dd = document.createElement('dd');
      dd.textContent = `${amount}`;
      table.append(dt, dd);
    }
    wrap.append(table);

    if (step.interactive) {
      const form = document.createElement('div');
      form.className = 'bc-contract__form';

      const from = document.createElement('input');
      from.className = 'bc-fields__input';
      from.value = step.defaultTransfer?.from ?? 'Alice';
      from.setAttribute('aria-label', '送金元');

      const to = document.createElement('input');
      to.className = 'bc-fields__input';
      to.value = step.defaultTransfer?.to ?? 'Bob';
      to.setAttribute('aria-label', '送金先');

      const amount = document.createElement('input');
      amount.type = 'number';
      amount.className = 'bc-fields__input';
      amount.min = '1';
      amount.value = String(step.defaultTransfer?.amount ?? 10);
      amount.setAttribute('aria-label', '金額');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bc-action-btn bc-action-btn--primary';
      btn.textContent = '送金を実行';
      btn.addEventListener('click', () => {
        this.#callbacks.onContractTransfer?.(from.value, to.value, parseInt(amount.value, 10));
      });

      form.append(
        this.#labeledField('送金元', from),
        this.#labeledField('送金先', to),
        this.#labeledField('金額', amount),
        btn,
      );
      wrap.append(form);

      if (appState.contractError) {
        const err = document.createElement('p');
        err.className = 'bc-error';
        err.setAttribute('role', 'alert');
        err.textContent = appState.contractError;
        wrap.append(err);
      }
    }

    return wrap;
  }

  #labeledField(label, input) {
    const wrap = document.createElement('label');
    wrap.className = 'bc-contract__field';
    wrap.textContent = label;
    wrap.append(input);
    return wrap;
  }

  #renderLinks(step) {
    const wrap = document.createElement('div');
    wrap.className = 'bc-links';
    if (step.linkToRsa) {
      const a = document.createElement('a');
      a.className = 'bc-links__anchor';
      a.href = '../index.html';
      a.textContent = 'RSA ビジュアライザーを開く';
      wrap.append(a);
    }
    if (step.linkToAes) {
      const a = document.createElement('a');
      a.className = 'bc-links__anchor';
      a.href = '../index.html';
      a.textContent = 'AES ビジュアライザーを開く（トップページで AES タブを選択）';
      wrap.append(a);
    }
    return wrap;
  }

  #appendCard(card) {
    this.#vizArea.append(card);
    requestAnimationFrame(() => {
      card.classList.add('is-visible');
    });
  }
}
