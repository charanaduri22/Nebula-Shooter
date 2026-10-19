import { Graphics, Container } from 'pixi.js';

/**
 * Background — Multi-layer parallax deep space environment.
 * 
 * Layers (back to front):
 *   0. Nebula gradient (dark blues/purples, very slow scroll)
 *   1. Distant faint stars (tiny, slow)
 *   2. Mid-field stars (small, medium speed)
 *   3. Near-field stars (brighter, fast — gives sense of speed)
 * 
 * All stars wrap seamlessly for infinite scrolling.
 */
export class Background {
  /**
   * @param {number} width  — viewport width
   * @param {number} height — viewport height
   */
  constructor(width, height) {
    this.container = new Container();
    this.container.label = 'background';
    this.w = width;
    this.h = height;

    // ── Layer 0: Nebula / deep gradient blobs ─────────
    this._nebulaContainer = new Container();
    this._nebulaContainer.label = 'nebula-layer';
    this.container.addChild(this._nebulaContainer);
    this._createNebulae();

    // ── Star layers ───────────────────────────────────
    this._starLayers = [];
    const layerConfigs = [
      { count: 80,  minSize: 0.4, maxSize: 1.0, speed: 15,  alpha: 0.3, color: 0x6673aa },
      { count: 60,  minSize: 0.6, maxSize: 1.4, speed: 40,  alpha: 0.5, color: 0x8899cc },
      { count: 45,  minSize: 0.8, maxSize: 2.0, speed: 90,  alpha: 0.75, color: 0xbbccee },
      { count: 25,  minSize: 1.2, maxSize: 2.8, speed: 160, alpha: 0.9, color: 0xeeeeff },
    ];

    for (const cfg of layerConfigs) {
      const layer = this._createStarLayer(cfg);
      this._starLayers.push(layer);
      this.container.addChild(layer.container);
    }
  }

  /** Create soft nebula blobs using overlapping translucent circles */
  _createNebulae() {
    const nebulaData = [
      { x: 0.2,  y: 0.3,  r: 300, color: 0x0d1040, alpha: 0.35 },
      { x: 0.7,  y: 0.6,  r: 350, color: 0x1a0a3e, alpha: 0.3 },
      { x: 0.5,  y: 0.2,  r: 250, color: 0x0a1545, alpha: 0.25 },
      { x: 0.85, y: 0.15, r: 200, color: 0x200a40, alpha: 0.2 },
      { x: 0.15, y: 0.75, r: 280, color: 0x0f0d3a, alpha: 0.3 },
      { x: 0.6,  y: 0.85, r: 220, color: 0x150835, alpha: 0.25 },
      // Second wave for denser coverage
      { x: 1.3,  y: 0.4,  r: 320, color: 0x0d1040, alpha: 0.3 },
      { x: 1.6,  y: 0.7,  r: 270, color: 0x1a0a3e, alpha: 0.25 },
      { x: 1.1,  y: 0.1,  r: 240, color: 0x0a1545, alpha: 0.2 },
      { x: 1.8,  y: 0.5,  r: 300, color: 0x200a40, alpha: 0.22 },
    ];

    for (const n of nebulaData) {
      const blob = new Graphics();
      blob.circle(0, 0, n.r);
      blob.fill({ color: n.color, alpha: n.alpha });
      blob.x = n.x * this.w;
      blob.y = n.y * this.h;
      this._nebulaContainer.addChild(blob);
    }

    // Store for scrolling
    this._nebulaScrollX = 0;
    this._nebulaSpeed = 8;
  }

  /**
   * Create a single star layer.
   * @param {Object} cfg — { count, minSize, maxSize, speed, alpha, color }
   * @returns {{ container: Container, stars: Array, speed: number }}
   */
  _createStarLayer(cfg) {
    const layerContainer = new Container();
    layerContainer.label = 'star-layer';
    const stars = [];
    // Double-width for seamless wrapping
    const fieldWidth = this.w * 2;

    for (let i = 0; i < cfg.count; i++) {
      const star = new Graphics();
      const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
      star.circle(0, 0, size);

      // Some stars get a slightly different tint for variety
      const colorVariant = Math.random() > 0.8 ? 0xaaccff : cfg.color;
      star.fill({ color: colorVariant, alpha: cfg.alpha * (0.6 + Math.random() * 0.4) });

      star.x = Math.random() * fieldWidth;
      star.y = Math.random() * this.h;
      star._baseAlpha = star.alpha;
      star._twinkleSpeed = 1 + Math.random() * 3;
      star._twinklePhase = Math.random() * Math.PI * 2;

      layerContainer.addChild(star);
      stars.push(star);
    }

    return { container: layerContainer, stars, speed: cfg.speed, fieldWidth };
  }

  /**
   * Update parallax scroll. Call every frame.
   * @param {number} dt — delta time in seconds
   * @param {number} elapsed — total elapsed time
   */
  update(dt, elapsed) {
    // ── Scroll nebulae ──
    this._nebulaScrollX -= this._nebulaSpeed * dt;
    if (this._nebulaScrollX < -this.w) {
      this._nebulaScrollX += this.w;
    }
    this._nebulaContainer.x = this._nebulaScrollX;

    // ── Scroll & twinkle star layers ──
    for (const layer of this._starLayers) {
      for (const star of layer.stars) {
        star.x -= layer.speed * dt;

        // Wrap around seamlessly
        if (star.x < -4) {
          star.x += layer.fieldWidth;
          star.y = Math.random() * this.h;
        }

        // Subtle twinkle
        star.alpha = star._baseAlpha *
          (0.7 + 0.3 * Math.sin(elapsed * star._twinkleSpeed + star._twinklePhase));
      }
    }
  }

  /**
   * Resize all layers to new viewport dimensions.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.w = width;
    this.h = height;
  }
}
