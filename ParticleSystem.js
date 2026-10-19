import { Graphics, Container } from 'pixi.js';
import { ObjectPool } from '../core/ObjectPool.js';

/**
 * ParticleSystem — Fully pooled particle effects.
 * 
 * Manages separate pools for:
 *  - Explosion fire particles (orange/yellow)
 *  - Sparks (bright white/yellow, high-velocity)
 *  - Debris chunks (dark, angular, slow)
 *  - Smoke trail particles (white/grey, for missiles)
 * 
 * All particles are pre-allocated and recycled to prevent GC stutter.
 */

// ── Individual particle factories ────────────────────

function createFireParticle() {
  const g = new Graphics();
  g.circle(0, 0, 1);
  g.fill({ color: 0xffffff }); // tinted at spawn
  g.active = false;
  g.vx = 0;
  g.vy = 0;
  g.life = 0;
  g.maxLife = 1;
  g.drag = 0.98;
  g.startScale = 1;
  g.startAlpha = 1;
  g.tintColor = 0xff9100;

  g.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0.4 + Math.random() * 0.6;
    this.drag = 0.96 + Math.random() * 0.03;
    this.rotation = Math.random() * Math.PI * 2;
    this.startScale = 1.5 + Math.random() * 3;
    this.scale.set(this.startScale);
    this.startAlpha = 0.8 + Math.random() * 0.2;
    this.alpha = this.startAlpha;
    this.visible = true;

    // Random orange-yellow tint
    const colors = [0xff6d00, 0xff9100, 0xffab40, 0xffd600, 0xffee58, 0xff8f00];
    this.tint = colors[Math.floor(Math.random() * colors.length)];
  };

  g.update = function (dt) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.drag;
    this.vy *= this.drag;

    const t = this.life / this.maxLife;
    this.alpha = this.startAlpha * (1 - t);
    this.scale.set(this.startScale * (1 - t * 0.6));
  };

  return g;
}

function createSparkParticle() {
  const g = new Graphics();
  g.rect(-3, -0.5, 6, 1);
  g.fill({ color: 0xffffff });
  g.active = false;
  g.vx = 0;
  g.vy = 0;
  g.life = 0;
  g.maxLife = 0.3;
  g.startAlpha = 1;

  g.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0.15 + Math.random() * 0.35;
    this.rotation = 0;
    this.scale.set(0.8 + Math.random() * 0.6);
    this.startAlpha = 0.9 + Math.random() * 0.1;
    this.alpha = this.startAlpha;
    this.visible = true;

    const colors = [0xffffff, 0xffd600, 0xffab40, 0xff9100];
    this.tint = colors[Math.floor(Math.random() * colors.length)];
  };

  g.update = function (dt) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const t = this.life / this.maxLife;
    this.alpha = this.startAlpha * (1 - t);
    this.scale.x = (0.8 + Math.random() * 0.4) * (1 - t * 0.5);
  };

  return g;
}

function createDebrisParticle() {
  const g = new Graphics();
  // Irregular angular chunk
  const s = 2 + Math.random() * 3;
  g.moveTo(-s, -s * 0.5);
  g.lineTo(s * 0.3, -s);
  g.lineTo(s, -s * 0.2);
  g.lineTo(s * 0.6, s * 0.8);
  g.lineTo(-s * 0.5, s);
  g.closePath();
  g.fill({ color: 0x263238 });
  g.stroke({ color: 0x37474f, width: 0.5, alpha: 0.5 });

  g.active = false;
  g.vx = 0;
  g.vy = 0;
  g.rotSpeed = 0;
  g.life = 0;
  g.maxLife = 1.5;
  g.startAlpha = 1;

  g.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0.8 + Math.random() * 1.2;
    this.rotSpeed = (Math.random() - 0.5) * 8;
    this.rotation = Math.random() * Math.PI * 2;
    this.scale.set(0.6 + Math.random() * 1.2);
    this.startAlpha = 0.9;
    this.alpha = this.startAlpha;
    this.visible = true;
  };

  g.update = function (dt) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;

    const t = this.life / this.maxLife;
    this.alpha = this.startAlpha * (1 - t * t);
  };

  return g;
}

function createSmokeParticle() {
  const g = new Graphics();
  g.circle(0, 0, 1);
  g.fill({ color: 0xffffff });
  g.active = false;
  g.vx = 0;
  g.vy = 0;
  g.life = 0;
  g.maxLife = 0.6;
  g.startScale = 1;
  g.startAlpha = 0.4;

  g.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0.3 + Math.random() * 0.5;
    this.rotation = Math.random() * Math.PI * 2;
    this.startScale = 1.5 + Math.random() * 2;
    this.scale.set(this.startScale * 0.3);
    this.startAlpha = 0.3 + Math.random() * 0.2;
    this.alpha = this.startAlpha;
    this.visible = true;

    const colors = [0xcccccc, 0xdddddd, 0xeeeeee, 0xaaaaaa];
    this.tint = colors[Math.floor(Math.random() * colors.length)];
  };

  g.update = function (dt) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const t = this.life / this.maxLife;
    this.alpha = this.startAlpha * (1 - t);
    this.scale.set(this.startScale * (0.3 + t * 0.7)); // expands
  };

  return g;
}


export class ParticleSystem {
  constructor() {
    // Display containers (added to stage by main.js)
    this.fireContainer = new Container();
    this.fireContainer.label = 'particles-fire';

    this.sparkContainer = new Container();
    this.sparkContainer.label = 'particles-sparks';

    this.debrisContainer = new Container();
    this.debrisContainer.label = 'particles-debris';

    this.smokeContainer = new Container();
    this.smokeContainer.label = 'particles-smoke';

    // Object pools
    this.firePools = new ObjectPool(() => {
      const p = createFireParticle();
      this.fireContainer.addChild(p);
      return p;
    }, 200);

    this.sparkPool = new ObjectPool(() => {
      const p = createSparkParticle();
      this.sparkContainer.addChild(p);
      return p;
    }, 150);

    this.debrisPool = new ObjectPool(() => {
      const p = createDebrisParticle();
      this.debrisContainer.addChild(p);
      return p;
    }, 80);

    this.smokePool = new ObjectPool(() => {
      const p = createSmokeParticle();
      this.smokeContainer.addChild(p);
      return p;
    }, 120);
  }

  /**
   * Spawn a massive explosion at (x, y).
   * @param {number} x
   * @param {number} y
   * @param {number} [intensity=1] — scale multiplier (1=fighter, 2=cruiser)
   */
  spawnExplosion(x, y, intensity = 1) {
    const fireCount = Math.floor(18 * intensity);
    const sparkCount = Math.floor(24 * intensity);
    const debrisCount = Math.floor(8 * intensity);

    // Fire particles — radiate outward
    for (let i = 0; i < fireCount; i++) {
      const p = this.firePools.acquire();
      p.x = x + (Math.random() - 0.5) * 10;
      p.y = y + (Math.random() - 0.5) * 10;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200 * intensity;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    }

    // Sparks — fast, directional
    for (let i = 0; i < sparkCount; i++) {
      const p = this.sparkPool.acquire();
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 500 * intensity;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.rotation = angle;
    }

    // Debris chunks — slower, tumbling
    for (let i = 0; i < debrisCount; i++) {
      const p = this.debrisPool.acquire();
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y + (Math.random() - 0.5) * 8;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    }
  }

  /**
   * Emit a single smoke puff at (x, y) — used for missile trails.
   * @param {number} x
   * @param {number} y
   */
  emitSmoke(x, y) {
    const p = this.smokePool.acquire();
    p.x = x + (Math.random() - 0.5) * 4;
    p.y = y + (Math.random() - 0.5) * 4;
    p.vx = -30 - Math.random() * 40; // drift backward
    p.vy = (Math.random() - 0.5) * 20;
  }

  /**
   * Update all active particles. Call every frame.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    this._updatePool(this.firePools, dt);
    this._updatePool(this.sparkPool, dt);
    this._updatePool(this.debrisPool, dt);
    this._updatePool(this.smokePool, dt);
  }

  /** @private */
  _updatePool(pool, dt) {
    pool.forEachActive((p) => {
      p.update(dt);
      if (p.life >= p.maxLife) {
        p.visible = false;
        pool.release(p);
      }
    });
  }

  /** Get total active particle count (for debug) */
  get activeCount() {
    return (
      this.firePools.activeCount +
      this.sparkPool.activeCount +
      this.debrisPool.activeCount +
      this.smokePool.activeCount
    );
  }
}
