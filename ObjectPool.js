/**
 * ObjectPool — Generic object pooling system for high-performance recycling.
 * 
 * Prevents garbage collection stutter by pre-allocating and reusing objects
 * instead of creating/destroying them each frame. Used for projectiles,
 * enemies, particles, and debris.
 * 
 * Usage:
 *   const pool = new ObjectPool(Projectile, 200);
 *   const bullet = pool.acquire();
 *   pool.release(bullet);
 */
export class ObjectPool {
  /**
   * @param {Function} factory — Constructor or factory function that creates a new poolable object.
   *                              Created objects MUST implement: reset(), active (boolean property).
   * @param {number} initialSize — Number of objects to pre-allocate.
   */
  constructor(factory, initialSize = 50) {
    this._factory = factory;
    this._pool = [];
    this._active = [];
    this._totalCreated = 0;

    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this._createNew());
    }
  }

  /** @private */
  _createNew() {
    const obj = this._factory();
    obj.active = false;
    this._totalCreated++;
    return obj;
  }

  /**
   * Acquire an object from the pool.
   * If no inactive objects are available, grows the pool by 1.
   * @returns {Object} A reset, ready-to-use object.
   */
  acquire() {
    let obj;

    if (this._pool.length > 0) {
      obj = this._pool.pop();
    } else {
      // Pool exhausted — grow dynamically (but log for tuning)
      obj = this._createNew();
      if (import.meta.env?.DEV) {
        console.warn(
          `[ObjectPool] Pool exhausted, grew to ${this._totalCreated}. Consider increasing initial size.`
        );
      }
    }

    obj.active = true;
    obj.reset();
    this._active.push(obj);
    return obj;
  }

  /**
   * Release an object back to the pool.
   * @param {Object} obj — The object to recycle.
   */
  release(obj) {
    obj.active = false;
    const idx = this._active.indexOf(obj);
    if (idx !== -1) {
      // Swap with last for O(1) removal
      this._active[idx] = this._active[this._active.length - 1];
      this._active.pop();
    }
    this._pool.push(obj);
  }

  /**
   * Release all active objects back to the pool.
   */
  releaseAll() {
    while (this._active.length > 0) {
      const obj = this._active.pop();
      obj.active = false;
      this._pool.push(obj);
    }
  }

  /**
   * Iterate over all currently active objects.
   * @param {Function} fn — callback(obj, index)
   */
  forEachActive(fn) {
    // Iterate in reverse so we can safely release during iteration
    for (let i = this._active.length - 1; i >= 0; i--) {
      fn(this._active[i], i);
    }
  }

  /** Number of currently active objects */
  get activeCount() {
    return this._active.length;
  }

  /** Number of objects waiting in the pool */
  get availableCount() {
    return this._pool.length;
  }

  /** Total objects ever created */
  get totalCreated() {
    return this._totalCreated;
  }
}
