/**
 * Radar — Draws the circular minimap/radar HUD element.
 * 
 * Renders onto the #radar-canvas with:
 *  - Cyan grid lines (crosshair + concentric circles)
 *  - A cyan arrow at center representing the player
 *  - Red dots for enemy positions
 *  - Animated sweep is handled by CSS overlay
 */
export class Radar {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cx = canvas.width / 2;
    this.cy = canvas.height / 2;
    this.radius = Math.min(this.cx, this.cy) - 2;

    // Simulated enemy positions (normalized -1 to 1)
    this.enemies = [];
    this._spawnSimulatedEnemies();

    // Player direction (radians, 0 = right)
    this.playerAngle = 0;

    // Animation
    this._elapsed = 0;
  }

  /** Generate some test enemy blips */
  _spawnSimulatedEnemies() {
    this.enemies = [
      { x:  0.6, y: -0.3 },
      { x:  0.8, y:  0.1 },
      { x:  0.5, y:  0.5 },
      { x:  0.7, y: -0.6 },
      { x:  0.9, y:  0.4 },
      { x:  0.4, y: -0.7 },
      { x:  0.65, y: 0.65 },
      { x:  0.85, y: -0.15 },
      { x:  0.3, y:  0.8 },
      { x:  0.55, y: -0.5 },
      { x:  0.75, y:  0.3 },
    ];
  }

  /**
   * Update and redraw the radar.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    this._elapsed += dt;
    this._draw();
  }

  /** @private */
  _draw() {
    const ctx = this.ctx;
    const cx = this.cx;
    const cy = this.cy;
    const r = this.radius;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bgGrad.addColorStop(0, 'rgba(0, 30, 50, 0.4)');
    bgGrad.addColorStop(1, 'rgba(0, 10, 20, 0.6)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid: Concentric circles
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid: Crosshair lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.lineWidth = 1;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // Diagonal lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    const diag = r * 0.707;
    ctx.beginPath();
    ctx.moveTo(cx - diag, cy - diag);
    ctx.lineTo(cx + diag, cy + diag);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + diag, cy - diag);
    ctx.lineTo(cx - diag, cy + diag);
    ctx.stroke();

    // Enemy blips (red dots with glow)
    for (const enemy of this.enemies) {
      const ex = cx + enemy.x * r * 0.85;
      const ey = cy + enemy.y * r * 0.85;

      // Pulsing glow
      const pulse = 0.6 + 0.4 * Math.sin(this._elapsed * 3 + enemy.x * 10);

      // Outer glow
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 23, 68, ${0.2 * pulse})`;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 80, ${0.7 + 0.3 * pulse})`;
      ctx.fill();
    }

    // Player arrow (cyan, pointing right)
    this._drawPlayerArrow(ctx, cx, cy);

    ctx.restore();

    // Outer ring glow
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Draw the player indicator — a small cyan arrow pointing right
   * @private
   */
  _drawPlayerArrow(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.playerAngle);

    // Arrow body
    const size = 10;
    ctx.beginPath();
    ctx.moveTo(size, 0);               // tip
    ctx.lineTo(-size * 0.6, -size * 0.55);  // top-left
    ctx.lineTo(-size * 0.3, 0);        // notch
    ctx.lineTo(-size * 0.6,  size * 0.55);  // bottom-left
    ctx.closePath();

    // Glow fill
    ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.fill();

    // Bright edge
    ctx.strokeStyle = 'rgba(0, 229, 255, 1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Set enemy positions for the radar.
   * @param {Array<{x: number, y: number}>} enemies — normalized -1 to 1
   */
  setEnemies(enemies) {
    this.enemies = enemies;
  }
}
