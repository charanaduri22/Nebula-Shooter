/**
 * GameLoop — Core update/render loop with delta-time normalization.
 * 
 * Uses PixiJS Ticker for frame callbacks, but wraps it with our own
 * delta-time calculations to ensure consistent movement regardless
 * of display refresh rate (60Hz, 120Hz, 144Hz, variable).
 * 
 * The loop caps delta to prevent spiral-of-death when the tab is
 * backgrounded or a frame takes too long.
 */
export class GameLoop {
  /**
   * @param {import('pixi.js').Application} app — The PixiJS application instance.
   */
  constructor(app) {
    this._app = app;
    this._updateCallbacks = [];
    this._fixedUpdateCallbacks = [];
    this._isPaused = false;
    this._timeScale = 1.0;
    this._elapsedTime = 0;

    // Fixed timestep for physics (60 updates/second)
    this._fixedTimestep = 1 / 60;
    this._fixedAccumulator = 0;

    // Cap delta to 100ms to prevent spiral-of-death
    this._maxDelta = 0.1;

    // Performance monitoring
    this._frameCount = 0;
    this._fpsTimer = 0;
    this._currentFPS = 0;

    // Bind the ticker
    this._app.ticker.add(this._tick, this);
  }

  /**
   * Main tick callback driven by PixiJS Ticker.
   * @param {import('pixi.js').Ticker} ticker
   * @private
   */
  _tick(ticker) {
    if (this._isPaused) return;

    // deltaTime from PixiJS ticker is in seconds (v8)
    let dt = ticker.deltaTime / 60; // PixiJS v8 ticker.deltaTime is frame-based, convert
    
    // Actually, in PixiJS v8, ticker.deltaMS gives milliseconds
    // and ticker.deltaTime is the frame multiplier (1.0 at 60fps).
    // Let's use elapsedMS for consistency.
    dt = ticker.elapsedMS / 1000;

    // Cap delta
    if (dt > this._maxDelta) {
      dt = this._maxDelta;
    }

    // Apply time scale
    dt *= this._timeScale;
    this._elapsedTime += dt;

    // === Variable update (render-coupled) ===
    for (let i = 0; i < this._updateCallbacks.length; i++) {
      this._updateCallbacks[i](dt, this._elapsedTime);
    }

    // === Fixed update (physics) ===
    this._fixedAccumulator += dt;
    while (this._fixedAccumulator >= this._fixedTimestep) {
      for (let i = 0; i < this._fixedUpdateCallbacks.length; i++) {
        this._fixedUpdateCallbacks[i](this._fixedTimestep, this._elapsedTime);
      }
      this._fixedAccumulator -= this._fixedTimestep;
    }

    // === FPS counter ===
    this._frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 1.0) {
      this._currentFPS = this._frameCount;
      this._frameCount = 0;
      this._fpsTimer -= 1.0;
    }
  }

  /**
   * Register a variable-rate update callback.
   * Called every frame with (deltaTime, elapsedTime).
   * @param {Function} fn
   */
  onUpdate(fn) {
    this._updateCallbacks.push(fn);
  }

  /**
   * Register a fixed-rate update callback (60Hz).
   * Called with (fixedDelta, elapsedTime) — ideal for physics/collision.
   * @param {Function} fn
   */
  onFixedUpdate(fn) {
    this._fixedUpdateCallbacks.push(fn);
  }

  /**
   * Remove an update callback.
   * @param {Function} fn
   */
  removeUpdate(fn) {
    const idx = this._updateCallbacks.indexOf(fn);
    if (idx !== -1) this._updateCallbacks.splice(idx, 1);
  }

  /**
   * Remove a fixed update callback.
   * @param {Function} fn
   */
  removeFixedUpdate(fn) {
    const idx = this._fixedUpdateCallbacks.indexOf(fn);
    if (idx !== -1) this._fixedUpdateCallbacks.splice(idx, 1);
  }

  /** Pause the loop */
  pause() {
    this._isPaused = true;
  }

  /** Resume the loop */
  resume() {
    this._isPaused = false;
  }

  /** Toggle pause state */
  togglePause() {
    this._isPaused = !this._isPaused;
  }

  /** @type {boolean} */
  get isPaused() {
    return this._isPaused;
  }

  /** Slow-mo or speed-up factor. 1.0 = normal. */
  get timeScale() {
    return this._timeScale;
  }

  set timeScale(value) {
    this._timeScale = Math.max(0, value);
  }

  /** Current measured FPS */
  get fps() {
    return this._currentFPS;
  }

  /** Total elapsed game time in seconds */
  get elapsedTime() {
    return this._elapsedTime;
  }

  /** Destroy and detach from ticker */
  destroy() {
    this._app.ticker.remove(this._tick, this);
    this._updateCallbacks.length = 0;
    this._fixedUpdateCallbacks.length = 0;
  }
}
