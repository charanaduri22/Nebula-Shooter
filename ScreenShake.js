/**
 * ScreenShake — Applies procedural trauma-based screen shake.
 *
 * Uses the "trauma" model:
 *   - trauma is added on impact (0..1 range)
 *   - offset = trauma^2 * maxOffset  (squared gives snappier feel)
 *   - trauma decays exponentially each frame
 *
 * Shake is applied by displacing the root PixiJS stage container.
 * The original position is restored each frame before applying new offset.
 */
export class ScreenShake {
  /**
   * @param {import('pixi.js').Container} stage — the root scene container to shake
   */
  constructor(stage) {
    this._stage = stage;
    this._trauma = 0;
    this._maxTrauma = 1.0;
    this._decayRate = 2.2;   // trauma units lost per second
    this._maxOffsetX = 18;   // pixels
    this._maxOffsetY = 14;
    this._maxRotation = 0.018; // radians
    this._noiseX = 0;
    this._noiseY = 0;
    this._elapsed = 0;
  }

  /**
   * Add trauma from an event (explosion, hit, etc.)
   * @param {number} amount — 0..1, where 1 = maximum shake
   */
  addTrauma(amount) {
    this._trauma = Math.min(this._maxTrauma, this._trauma + amount);
  }

  /**
   * Update shake each frame. Decays trauma and applies displacement.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    if (this._trauma <= 0) {
      // Ensure stage is perfectly reset when idle
      this._stage.x = 0;
      this._stage.y = 0;
      this._stage.rotation = 0;
      return;
    }

    this._elapsed += dt;
    this._trauma = Math.max(0, this._trauma - this._decayRate * dt);

    const shake = this._trauma * this._trauma; // squared for "snap" curve

    // Use time-varying sine waves at different frequencies for organic noise
    const t = this._elapsed;
    const nx = Math.sin(t * 89.3) * Math.cos(t * 47.1) + Math.sin(t * 133.7) * 0.5;
    const ny = Math.cos(t * 73.1) * Math.sin(t * 61.9) + Math.cos(t * 97.3) * 0.5;
    const nr = Math.sin(t * 53.7) * Math.cos(t * 81.4);

    this._stage.x = nx * shake * this._maxOffsetX;
    this._stage.y = ny * shake * this._maxOffsetY;
    this._stage.rotation = nr * shake * this._maxRotation;
  }

  /** Instantly stop all shake */
  reset() {
    this._trauma = 0;
    this._stage.x = 0;
    this._stage.y = 0;
    this._stage.rotation = 0;
  }

  get isShaking() {
    return this._trauma > 0;
  }
}
