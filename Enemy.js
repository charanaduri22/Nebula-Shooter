import { Graphics, Container } from 'pixi.js';

/**
 * Enemy entity types for object pooling.
 * Each factory returns a Container with pool-compatible interface.
 */

/** Small fast fighter — reddish, approaches from right */
export function createFighter() {
  const container = new Container();
  container.label = 'enemy-fighter';

  // Ship body (triangle pointing left)
  const body = new Graphics();
  body.moveTo(16, 0);
  body.lineTo(-12, -10);
  body.lineTo(-8, 0);
  body.lineTo(-12, 10);
  body.closePath();
  body.fill({ color: 0xe53935 });
  body.stroke({ color: 0xff7043, width: 1, alpha: 0.6 });
  container.addChild(body);

  // Engine glow
  const engine = new Graphics();
  engine.circle(18, 0, 4);
  engine.fill({ color: 0xff9100, alpha: 0.7 });
  container.addChild(engine);

  // Wing accents
  const wingTop = new Graphics();
  wingTop.moveTo(-4, -6);
  wingTop.lineTo(-14, -14);
  wingTop.lineTo(-10, -6);
  wingTop.fill({ color: 0xb71c1c });
  container.addChild(wingTop);

  const wingBot = new Graphics();
  wingBot.moveTo(-4, 6);
  wingBot.lineTo(-14, 14);
  wingBot.lineTo(-10, 6);
  wingBot.fill({ color: 0xb71c1c });
  container.addChild(wingBot);

  // Pool interface
  container.active = false;
  container.hp = 30;
  container.maxHp = 30;
  container.speed = 180;
  container.vx = -1;
  container.vy = 0;
  container.scoreValue = 100;
  container.enemyType = 'fighter';
  container.shootTimer = 0;
  container.shootInterval = 1.5; // seconds between shots
  container.behaviorTimer = 0;

  container.reset = function () {
    this.x = 0;
    this.y = 0;
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 180;
    this.vx = -1;
    this.vy = 0;
    this.rotation = Math.PI; // face left
    this.scale.set(1);
    this.alpha = 1;
    this.visible = true;
    this.shootTimer = 0;
    this.shootInterval = 1.2 + Math.random() * 0.8;
    this.behaviorTimer = 0;
  };

  container.update = function (dt) {
    this.x += this.vx * this.speed * dt;
    this.y += this.vy * this.speed * dt;
    this.shootTimer += dt;
    this.behaviorTimer += dt;

    // Simple sine-wave weaving
    this.vy = Math.sin(this.behaviorTimer * 2) * 0.5;
  };

  return container;
}

/** Heavy cruiser — armored, slower, larger hitbox */
export function createCruiser() {
  const container = new Container();
  container.label = 'enemy-cruiser';

  // Main hull
  const hull = new Graphics();
  hull.roundRect(-20, -14, 40, 28, 4);
  hull.fill({ color: 0x455a64 });
  hull.stroke({ color: 0x78909c, width: 1.5, alpha: 0.8 });
  container.addChild(hull);

  // Armor plates
  const plate = new Graphics();
  plate.roundRect(-16, -10, 32, 20, 2);
  plate.fill({ color: 0x37474f });
  container.addChild(plate);

  // Red cockpit/eye
  const eye = new Graphics();
  eye.circle(-10, 0, 4);
  eye.fill({ color: 0xff3d3d });
  container.addChild(eye);

  // Guns (top and bottom)
  const gunTop = new Graphics();
  gunTop.rect(-24, -16, 8, 4);
  gunTop.fill({ color: 0x607d8b });
  container.addChild(gunTop);

  const gunBot = new Graphics();
  gunBot.rect(-24, 12, 8, 4);
  gunBot.fill({ color: 0x607d8b });
  container.addChild(gunBot);

  // Engine glow
  const engineGlow = new Graphics();
  engineGlow.roundRect(18, -6, 8, 12, 2);
  engineGlow.fill({ color: 0xff6d00, alpha: 0.6 });
  container.addChild(engineGlow);

  container.active = false;
  container.hp = 150;
  container.maxHp = 150;
  container.speed = 80;
  container.vx = -1;
  container.vy = 0;
  container.scoreValue = 500;
  container.enemyType = 'cruiser';
  container.shootTimer = 0;
  container.shootInterval = 2.5;
  container.behaviorTimer = 0;

  container.reset = function () {
    this.x = 0;
    this.y = 0;
    this.hp = 150;
    this.maxHp = 150;
    this.speed = 80;
    this.vx = -1;
    this.vy = 0;
    this.rotation = Math.PI;
    this.scale.set(1.2);
    this.alpha = 1;
    this.visible = true;
    this.shootTimer = 0;
    this.shootInterval = 2.0 + Math.random() * 1.0;
    this.behaviorTimer = 0;
  };

  container.update = function (dt) {
    this.x += this.vx * this.speed * dt;
    this.y += this.vy * this.speed * dt;
    this.shootTimer += dt;
    this.behaviorTimer += dt;

    // Slow drift
    this.vy = Math.sin(this.behaviorTimer * 0.8) * 0.3;
  };

  return container;
}
