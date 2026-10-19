import { Container } from 'pixi.js';
import { ObjectPool } from '../core/ObjectPool.js';
import { createFighter, createCruiser } from '../entities/Enemy.js';

/**
 * EnemySpawner — Wave-based enemy spawning system.
 *
 * Manages:
 *  - Two ObjectPools: fighters and cruisers
 *  - Wave number, spawn rates that scale with wave
 *  - Formation spawning (solo, pairs, wedge)
 *  - Enemy update loop: movement + off-screen culling
 *  - Collision radius for projectile hit-testing
 */
export class EnemySpawner {
  /**
   * @param {number} screenW
   * @param {number} screenH
   */
  constructor(screenW, screenH) {
    this.screenW = screenW;
    this.screenH = screenH;

    // Root container — add to stage in main.js
    this.container = new Container();
    this.container.label = 'enemies';

    // Object pools
    this.fighterPool = new ObjectPool(() => {
      const e = createFighter();
      this.container.addChild(e);
      return e;
    }, 30);

    this.cruiserPool = new ObjectPool(() => {
      const e = createCruiser();
      this.container.addChild(e);
      return e;
    }, 10);

    // Wave state (all client-side memory)
    this.wave = 1;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboDuration = 3.0; // seconds before combo resets

    // Spawn timing
    this._spawnTimer = 0;
    this._spawnInterval = 2.0;   // seconds between spawns (decreases with wave)
    this._elapsed = 0;

    // Boss wave flag
    this.isBossWave = false;
    this._waveTimer = 0;
    this._waveDuration = 45; // seconds per wave

    // Callbacks
    this.onEnemyKilled = null; // (enemy, x, y) => void
  }

  /** @private — compute spawn interval for current wave */
  _getSpawnInterval() {
    return Math.max(0.4, 2.0 - (this.wave - 1) * 0.12);
  }

  /** @private — compute enemy speed multiplier for current wave */
  _getSpeedMultiplier() {
    return 1 + (this.wave - 1) * 0.07;
  }

  /**
   * Spawn a fighter at a random Y position off right edge.
   * @private
   */
  _spawnFighter(yOverride = null) {
    const e = this.fighterPool.acquire();
    e.x = this.screenW + 60;
    e.y = yOverride ?? (60 + Math.random() * (this.screenH - 120));
    e.speed = 180 * this._getSpeedMultiplier();
    e.behaviorTimer = Math.random() * Math.PI * 2; // randomize sine phase
    e.visible = true;
  }

  /**
   * Spawn a cruiser off right edge.
   * @private
   */
  _spawnCruiser() {
    const e = this.cruiserPool.acquire();
    e.x = this.screenW + 80;
    e.y = 80 + Math.random() * (this.screenH - 160);
    e.speed = 80 * this._getSpeedMultiplier();
    e.visible = true;
  }

  /**
   * Spawn a formation based on current wave.
   * @private
   */
  _spawnFormation() {
    const roll = Math.random();

    if (this.wave <= 2) {
      // Single fighter
      this._spawnFighter();
    } else if (this.wave <= 5) {
      // Mostly fighters, occasional cruiser
      if (roll < 0.15) {
        this._spawnCruiser();
      } else if (roll < 0.5) {
        // Pair
        const cy = 80 + Math.random() * (this.screenH - 160);
        this._spawnFighter(cy - 40);
        this._spawnFighter(cy + 40);
      } else {
        this._spawnFighter();
      }
    } else {
      // Wave 6+: mixed, wedge formations
      if (roll < 0.2) {
        this._spawnCruiser();
      } else if (roll < 0.5) {
        // Wedge: 3 fighters in a V
        const cy = 80 + Math.random() * (this.screenH - 160);
        this._spawnFighter(cy);
        this._spawnFighter(cy - 55);
        this._spawnFighter(cy + 55);
      } else if (roll < 0.7) {
        // Pair with cruiser escort
        this._spawnCruiser();
        const cy = 80 + Math.random() * (this.screenH - 160);
        this._spawnFighter(cy - 50);
        this._spawnFighter(cy + 50);
      } else {
        this._spawnFighter();
      }
    }
  }

  /**
   * Main update — spawn logic, enemy movement, culling.
   * @param {number} dt
   */
  update(dt) {
    this._elapsed += dt;
    this._waveTimer += dt;
    this.comboTimer = Math.max(0, this.comboTimer - dt);

    // Reset combo if timer expired
    if (this.comboTimer <= 0 && this.combo > 0) {
      this.combo = 0;
    }

    // Advance wave every _waveDuration seconds
    if (this._waveTimer >= this._waveDuration) {
      this._waveTimer = 0;
      this.wave++;
      this.isBossWave = (this.wave % 5 === 0);
      this._spawnInterval = this._getSpawnInterval();
    }

    // Spawn logic
    this._spawnTimer += dt;
    if (this._spawnTimer >= this._spawnInterval) {
      this._spawnTimer = 0;
      this._spawnFormation();
    }

    const cullLeft = -120;

    // Update fighters
    this.fighterPool.forEachActive((e) => {
      e.update(dt);
      if (e.x < cullLeft) {
        e.visible = false;
        this.fighterPool.release(e);
      }
    });

    // Update cruisers
    this.cruiserPool.forEachActive((e) => {
      e.update(dt);
      if (e.x < cullLeft) {
        e.visible = false;
        this.cruiserPool.release(e);
      }
    });
  }

  /**
   * Check if a point (px, py) with radius r hits any active enemy.
   * On hit: deal damage, handle kill, return true.
   * @param {number} px
   * @param {number} py
   * @param {number} r — collision radius
   * @param {number} damage
   * @returns {boolean} whether something was hit
   */
  checkProjectileHit(px, py, r, damage) {
    let hit = false;

    const checkPool = (pool, hitRadius) => {
      pool.forEachActive((e) => {
        if (hit) return;
        const dx = px - e.x;
        const dy = py - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r + hitRadius) {
          e.hp -= damage;
          hit = true;
          if (e.hp <= 0) {
            this._killEnemy(e, pool);
          }
        }
      });
    };

    checkPool(this.fighterPool, 18);
    if (!hit) checkPool(this.cruiserPool, 26);

    return hit;
  }

  /**
   * Handle enemy death: score, combo, callback, release to pool.
   * @private
   */
  _killEnemy(e, pool) {
    this.combo++;
    this.comboTimer = this.comboDuration;
    this.score += e.scoreValue * this.combo;

    const ex = e.x;
    const ey = e.y;
    const intensity = e.enemyType === 'cruiser' ? 2.2 : 1.0;

    e.visible = false;
    pool.release(e);

    if (this.onEnemyKilled) {
      this.onEnemyKilled(ex, ey, intensity);
    }
  }

  /**
   * Resize — update spawn bounds.
   * @param {number} w
   * @param {number} h
   */
  resize(w, h) {
    this.screenW = w;
    this.screenH = h;
  }

  get activeEnemyCount() {
    return this.fighterPool.activeCount + this.cruiserPool.activeCount;
  }

  /**
   * Get all active enemy world positions for the radar (normalized -1..1).
   * Player is at the left edge so we use x/screenW as the radar X.
   */
  getRadarBlips() {
    const blips = [];
    const W = this.screenW;
    const H = this.screenH;
    const addBlip = (e) => {
      blips.push({
        // Normalize relative to center of screen
        x: (e.x / W) * 2 - 1,
        y: (e.y / H) * 2 - 1,
      });
    };
    this.fighterPool.forEachActive(addBlip);
    this.cruiserPool.forEachActive(addBlip);
    return blips;
  }
}
