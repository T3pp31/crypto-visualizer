/**
 * renderer.js — DOM generation for step visualization
 * Idempotent: calling renderStep() with the same data always produces identical DOM.
 */

export class Renderer {
  #vizArea;
  #roundKeyPanel;
  #roundKeyGrid;

  /**
   * @param {HTMLElement} vizArea - Container for step cards
   * @param {HTMLElement} roundKeyPanel - Sidebar panel for round keys
   */
  constructor(vizArea, roundKeyPanel) {
    this.#vizArea = vizArea;
    this.#roundKeyPanel = roundKeyPanel;
    this.#roundKeyGrid = roundKeyPanel.querySelector('#round-key-grid');
  }

  /**
   * Render a step into the visualization area.
   * @param {Object} step - Current step object
   * @param {Object|null} prevStep - Previous step (for transition context)
   */
  renderStep(step, prevStep) {
    this.#vizArea.innerHTML = '';
    if (step.algorithm === 'aes') {
      this.#renderAESStep(step);
    } else if (step.algorithm === 'rsa') {
      this.#renderRSAStep(step);
    } else if (step.algorithm === 'caesar') {
      this.#renderCaesarStep(step);
    }
  }

  /**
   * Render round keys in the sidebar panel.
   * @param {number[][][]} roundKeys - All 11 round keys
   * @param {number} activeRound - Currently active round index
   */
  renderRoundKeys(roundKeys, activeRound) {
    this.#roundKeyGrid.innerHTML = '';
    this.#roundKeyPanel.classList.remove('is-hidden');
    roundKeys.forEach((key, i) => {
      const entry = document.createElement('div');
      entry.className = 'round-key-entry';
      if (i === activeRound) entry.classList.add('round-key-entry--active');

      const label = document.createElement('div');
      label.className = 'round-key-entry__label';
      label.textContent = `ラウンドキー ${i}`;
      entry.append(label);

      const grid = this.#buildMiniGrid(key, i === activeRound);
      entry.append(grid);
      this.#roundKeyGrid.append(entry);
    });
  }

  hideRoundKeys() {
    this.#roundKeyPanel.classList.add('is-hidden');
  }

  #renderAESStep(step) {
    const card = this.#buildCard(step);
    const content = document.createElement('div');
    content.className = 'step-card__content';

    if (step.prevState) {
      const prevWrapper = this.#buildGridWrapper('変換前', step.prevState, []);
      content.append(prevWrapper);
      const arrow = document.createElement('div');
      arrow.className = 'xor-display__operator';
      arrow.textContent = '→';
      arrow.setAttribute('aria-hidden', 'true');
      content.append(arrow);
    }

    const currWrapper = this.#buildGridWrapper(
      step.prevState ? '変換後' : 'ステート',
      step.state,
      step.changedIndices,
    );
    content.append(currWrapper);

    if (step.roundKey) {
      const rkWrapper = this.#buildGridWrapper('ラウンドキー', step.roundKey, []);
      content.append(rkWrapper);
    }

    card.append(content);
    this.#appendCard(card);
  }

  #renderRSAStep(step) {
    const card = this.#buildCard(step);
    const content = document.createElement('div');
    content.className = 'step-card__content';

    if (step.formula) {
      const formula = document.createElement('div');
      formula.className = 'step-card__formula';
      formula.textContent = step.formula;
      content.append(formula);
    }

    if (step.values) {
      const valGrid = document.createElement('div');
      valGrid.className = 'step-card__values';
      for (const [k, v] of Object.entries(step.values)) {
        const keyEl = document.createElement('span');
        keyEl.className = 'step-card__value-key';
        keyEl.textContent = k;
        const valEl = document.createElement('span');
        valEl.className = 'step-card__value-val';
        valEl.textContent = String(v);
        valGrid.append(keyEl, valEl);
      }
      content.append(valGrid);
    }

    card.append(content);
    this.#appendCard(card);
  }

  #renderCaesarStep(step) {
    const card = this.#buildCard(step);
    const content = document.createElement('div');
    content.className = 'step-card__content step-card__content--vertical';

    // Formula
    if (step.formula) {
      const formula = document.createElement('div');
      formula.className = 'step-card__formula';
      formula.textContent = step.formula;
      content.append(formula);
    }

    // Character grid
    if (step.charResults) {
      const charSection = document.createElement('div');
      charSection.className = 'caesar-chars';

      // Original text row
      const origRow = document.createElement('div');
      origRow.className = 'caesar-chars__row';
      const origLabel = document.createElement('span');
      origLabel.className = 'caesar-chars__row-label';
      origLabel.textContent = '平文:';
      origRow.append(origLabel);

      const origCells = document.createElement('div');
      origCells.className = 'caesar-chars__cells';
      step.charResults.forEach((r) => {
        const cell = document.createElement('span');
        cell.className = 'caesar-chars__cell';
        if (r.status === 'active') cell.classList.add('caesar-chars__cell--active');
        if (r.status === 'done') cell.classList.add('caesar-chars__cell--done');
        cell.textContent = r.original;
        origCells.append(cell);
      });
      origRow.append(origCells);
      charSection.append(origRow);

      // Arrow row
      const arrowRow = document.createElement('div');
      arrowRow.className = 'caesar-chars__row';
      const arrowLabel = document.createElement('span');
      arrowLabel.className = 'caesar-chars__row-label';
      arrowLabel.textContent = '';
      arrowRow.append(arrowLabel);

      const arrowCells = document.createElement('div');
      arrowCells.className = 'caesar-chars__cells';
      step.charResults.forEach((r) => {
        const cell = document.createElement('span');
        cell.className = 'caesar-chars__arrow';
        if (r.status === 'active' || r.status === 'done') {
          cell.textContent = r.isAlpha ? '↓' : '·';
          if (r.status === 'active') cell.classList.add('caesar-chars__arrow--active');
        }
        arrowCells.append(cell);
      });
      arrowRow.append(arrowCells);
      charSection.append(arrowRow);

      // Cipher text row
      const cipherRow = document.createElement('div');
      cipherRow.className = 'caesar-chars__row';
      const cipherLabel = document.createElement('span');
      cipherLabel.className = 'caesar-chars__row-label';
      cipherLabel.textContent = '暗号文:';
      cipherRow.append(cipherLabel);

      const cipherCells = document.createElement('div');
      cipherCells.className = 'caesar-chars__cells';
      step.charResults.forEach((r) => {
        const cell = document.createElement('span');
        cell.className = 'caesar-chars__cell';
        if (r.status === 'active') cell.classList.add('caesar-chars__cell--active');
        if (r.status === 'done') cell.classList.add('caesar-chars__cell--done');
        cell.textContent = (r.status === 'active' || r.status === 'done') ? r.shifted : '';
        cipherCells.append(cell);
      });
      cipherRow.append(cipherCells);
      charSection.append(cipherRow);

      content.append(charSection);
    }

    // Values (for result / decrypt steps)
    if (step.values) {
      const valGrid = document.createElement('div');
      valGrid.className = 'step-card__values';
      for (const [k, v] of Object.entries(step.values)) {
        const keyEl = document.createElement('span');
        keyEl.className = 'step-card__value-key';
        keyEl.textContent = k;
        const valEl = document.createElement('span');
        valEl.className = 'step-card__value-val';
        valEl.textContent = String(v);
        valGrid.append(keyEl, valEl);
      }
      content.append(valGrid);
    }

    card.append(content);
    this.#appendCard(card);
  }

  #buildCard(step) {
    const article = document.createElement('article');
    article.className = 'step-card';
    article.dataset.step = step.id;
    article.dataset.algo = step.algorithm;
    article.setAttribute('aria-label', step.label);

    const header = document.createElement('div');
    header.className = 'step-card__header';

    if (step.round !== undefined || step.phase) {
      const badge = document.createElement('span');
      badge.className = 'step-card__round-badge';
      if (step.algorithm === 'aes') {
        badge.textContent = `R${step.round}`;
      } else if (step.algorithm === 'caesar') {
        const phaseLabels = { overview: '概要', encrypt: '暗号化', result: '結果', decrypt: '復号' };
        badge.textContent = phaseLabels[step.phase] || step.phase;
      } else {
        badge.textContent = step.phase.toUpperCase();
      }
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

    return article;
  }

  #buildGridWrapper(label, matrix, changedIndices) {
    const wrapper = document.createElement('div');
    wrapper.className = 'byte-grid-wrapper';

    const labelEl = document.createElement('span');
    labelEl.className = 'byte-grid-wrapper__label';
    labelEl.textContent = label;
    wrapper.append(labelEl);

    const grid = document.createElement('div');
    grid.className = 'byte-grid';

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = document.createElement('div');
        cell.className = 'byte-grid__cell';
        const flatIdx = row * 4 + col;
        if (changedIndices.includes(flatIdx)) {
          cell.classList.add('byte-grid__cell--changed');
        }
        cell.textContent = matrix[row][col].toString(16).padStart(2, '0');
        cell.dataset.row = row;
        cell.dataset.col = col;
        grid.append(cell);
      }
    }

    wrapper.append(grid);
    return wrapper;
  }

  #buildMiniGrid(key, isActive) {
    const grid = document.createElement('div');
    grid.className = 'round-key-mini';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = document.createElement('div');
        cell.className = 'round-key-mini__cell';
        if (isActive) cell.classList.add('round-key-mini__cell--active');
        cell.textContent = key[row][col].toString(16).padStart(2, '0');
        grid.append(cell);
      }
    }
    return grid;
  }

  #appendCard(card) {
    this.#vizArea.append(card);
    requestAnimationFrame(() => {
      card.classList.add('is-visible');
    });
  }
}
