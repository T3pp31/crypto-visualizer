/**
 * stepper.js — Step array navigation (no DOM access)
 * Manages currentIndex and notifies via callback on step change.
 */

export class Stepper {
  #steps;
  #currentIndex;
  #onStepChange;

  /**
   * @param {Object[]} steps - Array of step objects from algorithm builders
   * @param {Function} onStepChange - Callback: (currentStep, prevStep, index, total)
   */
  constructor(steps, onStepChange) {
    this.#steps = steps;
    this.#currentIndex = 0;
    this.#onStepChange = onStepChange;
  }

  /** Advance to the next step. Returns the new index. */
  next() {
    if (this.#currentIndex < this.#steps.length - 1) {
      const prevStep = this.#steps[this.#currentIndex];
      this.#currentIndex++;
      this.#notify(prevStep);
    }
    return this.#currentIndex;
  }

  /** Go back to the previous step. Returns the new index. */
  prev() {
    if (this.#currentIndex > 0) {
      const prevStep = this.#steps[this.#currentIndex];
      this.#currentIndex--;
      this.#notify(prevStep);
    }
    return this.#currentIndex;
  }

  /**
   * Jump to a specific step index.
   * @param {number} index
   */
  goTo(index) {
    const clamped = Math.max(0, Math.min(index, this.#steps.length - 1));
    if (clamped !== this.#currentIndex) {
      const prevStep = this.#steps[this.#currentIndex];
      this.#currentIndex = clamped;
      this.#notify(prevStep);
    }
  }

  /**
   * Replace the step array and reset to index 0.
   * @param {Object[]} newSteps
   */
  reset(newSteps) {
    this.#steps = newSteps;
    this.#currentIndex = 0;
    this.#notify(null);
  }

  /** Fire the initial step callback (for step 0). */
  start() {
    this.#notify(null);
  }

  get currentIndex() {
    return this.#currentIndex;
  }

  get totalSteps() {
    return this.#steps.length;
  }

  get isAtStart() {
    return this.#currentIndex === 0;
  }

  get isAtEnd() {
    return this.#currentIndex === this.#steps.length - 1;
  }

  #notify(prevStep) {
    this.#onStepChange(
      this.#steps[this.#currentIndex],
      prevStep,
      this.#currentIndex,
      this.#steps.length,
    );
  }
}
