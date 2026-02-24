/**
 * animator.js — Auto-play controller for step navigation
 * Drives the Stepper at a configurable interval.
 */

export class Animator {
  #stepper;
  #intervalId;
  #speed;
  #playing;
  #onStateChange;

  /**
   * @param {import('./stepper.js').Stepper} stepper
   * @param {number} [speed=800] - Milliseconds between steps
   * @param {Function} [onStateChange] - Called with (isPlaying) when play state changes
   */
  constructor(stepper, speed = 800, onStateChange = null) {
    this.#stepper = stepper;
    this.#speed = speed;
    this.#playing = false;
    this.#intervalId = null;
    this.#onStateChange = onStateChange;
  }

  /** Start auto-playing steps. */
  play() {
    if (this.#playing) return;
    this.#playing = true;
    this.#intervalId = setInterval(() => {
      this.#stepper.next();
      if (this.#stepper.isAtEnd) {
        this.pause();
      }
    }, this.#speed);
    this.#fireStateChange();
  }

  /** Pause auto-play. */
  pause() {
    if (!this.#playing) return;
    this.#playing = false;
    clearInterval(this.#intervalId);
    this.#intervalId = null;
    this.#fireStateChange();
  }

  /** Toggle between play and pause. */
  toggle() {
    if (this.#playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Update the playback speed.
   * @param {number} ms - Milliseconds between steps
   */
  setSpeed(ms) {
    this.#speed = ms;
    if (this.#playing) {
      this.pause();
      this.play();
    }
  }

  get isPlaying() {
    return this.#playing;
  }

  #fireStateChange() {
    if (this.#onStateChange) {
      this.#onStateChange(this.#playing);
    }
  }
}
