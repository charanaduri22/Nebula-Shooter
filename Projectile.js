import { Graphics, Container } from 'pixi.js';

/**
 * Projectile entity — a single bullet/energy blast.
 * Designed for object pooling: lightweight, fast reset.
 */
export function createProjectile() {
  const container = new Container();
  container.label = 'projectile';

  // Core bullet graphic
  const body = new Graphics();
  body.roundRect(-10, -3, 20, 6, 3);
  body.fill({ color: 0x4da6ff });
  container.addChild(body);

  // Glow trail
  const glow = new Graphics();
  glow.roundRect(-16, -5, 28, 10, 5);
  glow.fill({ color: 0x4da6ff, alpha: 0.3 });
  container.addChild(glow);

  // Pool-required properties
  container.active = false;
  container.vx = 0;
  container.vy = 0;
  container.speed = 800;
  container.damage = 10;
  container.lifetime = 0;
  container.maxLifetime = 3; // seconds

  container.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.speed = 800;
    this.damage = 10;
    this.lifetime = 0;
    this.maxLifetime = 3;
    this.rotation = 0;
    this.scale.set(1);
    this.alpha = 1;
    this.visible = true;
  };

  container.update = function (dt) {
    this.x += this.vx * this.speed * dt;
    this.y += this.vy * this.speed * dt;
    this.lifetime += dt;
  };

  return container;
}

/**
 * Missile entity — heavier, slower projectile with smoke trail
 */
export function createMissile() {
  const container = new Container();
  container.label = 'missile';

  const body = new Graphics();
  body.roundRect(-14, -4, 28, 8, 2);
  body.fill({ color: 0xff6d00 });
  container.addChild(body);

  // Warhead tip
  const tip = new Graphics();
  tip.moveTo(14, -5);
  tip.lineTo(20, 0);
  tip.lineTo(14, 5);
  tip.fill({ color: 0xffab40 });
  container.addChild(tip);

  // Engine flame
  const flame = new Graphics();
  flame.moveTo(-14, -3);
  flame.lineTo(-22, 0);
  flame.lineTo(-14, 3);
  flame.fill({ color: 0xffd600, alpha: 0.8 });
  container.addChild(flame);

  container.active = false;
  container.vx = 0;
  container.vy = 0;
  container.speed = 450;
  container.damage = 80;
  container.lifetime = 0;
  container.maxLifetime = 5;

  container.reset = function () {
    this.x = 0;
    this.y = 0;
    this.vx = 1;
    this.vy = 0;
    this.speed = 450;
    this.damage = 80;
    this.lifetime = 0;
    this.maxLifetime = 5;
    this.rotation = 0;
    this.scale.set(1);
    this.alpha = 1;
    this.visible = true;
  };

  container.update = function (dt) {
    this.x += this.vx * this.speed * dt;
    this.y += this.vy * this.speed * dt;
    this.lifetime += dt;
  };

  return container;
}
