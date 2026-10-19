/**
 * main.js — Project Nebula Shooter
 * Entry point. Initialises PixiJS, wires all systems, runs the game loop.
 *
 * Architecture (client-side only, zero backend):
 *   PixiJS Application  → WebGL canvas injected into #game-container
 *   Background          → parallax star layers + nebulae
 *   Player              → spacecraft entity + input
 *   EnemySpawner        → wave-based enemy pools
 *   ParticleSystem      → explosion / smoke pools
 *   ScreenShake         → trauma-based camera shake
 *   Radar               → 2D canvas minimap
 *   HudManager          → DOM HUD driven by in-memory game state
 *   GameLoop            → delta-time ticker
 */

import { Application, Container, Graphics } from 'pixi.js';

import { GameLoop }      from './core/GameLoop.js';
import { InputManager }  from './core/InputManager.js';
import { ObjectPool }    from './core/ObjectPool.js';

import { Background }    from './environment/Background.js';

import { createPlayerShip } from './entities/Player.js';
import { EnemySpawner }     from './entities/EnemySpawner.js';
import { createProjectile, createMissile } from './entities/Projectile.js';

import { ParticleSystem } from './vfx/ParticleSystem.js';
import { ScreenShake }    from './vfx/ScreenShake.js';

import { Radar }       from './hud/Radar.js';
import { HudManager }  from './hud/HudManager.js';

// ─────────────────────────────────────────────────────────────
// 1.  Bootstrap PixiJS Application
// ─────────────────────────────────────────────────────────────
const app = new Application();

await app.init({
  resizeTo: window,
  background: 0x060a14,
  antialias: false,       // off for perf on mid-range devices
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2), // cap at 2x
  powerPreference: 'high-performance',
});

document.getElementById('game-container').appendChild(app.canvas);

let W = app.screen.width;
let H = app.screen.height;

// ─────────────────────────────────────────────────────────────
// 2.  Scene graph — ordered containers (back to front)
// ─────────────────────────────────────────────────────────────
const rootScene = new Container();   // shaken by ScreenShake
app.stage.addChild(rootScene);

// Layer order (z-index via addChild sequence):
const bgContainer       = new Container();  // parallax background
const enemyLayer        = new Container();  // enemy ships (below projectiles)
const smokeLayer        = new Container();  // missile smoke
const projectileLayer   = new Container();  // player bullets + missiles
const playerLayer       = new Container();  // player ship
const debrisLayer       = new Container();  // explosion debris
const fireLayer         = new Container();  // explosion fire
const sparkLayer        = new Container();  // explosion sparks

rootScene.addChild(bgContainer);
rootScene.addChild(enemyLayer);
rootScene.addChild(smokeLayer);
rootScene.addChild(projectileLayer);
rootScene.addChild(playerLayer);
rootScene.addChild(debrisLayer);
rootScene.addChild(fireLayer);
rootScene.addChild(sparkLayer);

// ─────────────────────────────────────────────────────────────
// 3.  Systems
// ─────────────────────────────────────────────────────────────

// Background
const background = new Background(W, H);
bgContainer.addChild(background.container);

// Player
const player = createPlayerShip();
player.x = W * 0.18;
player.y = H * 0.5;
playerLayer.addChild(player);

// Enemy spawner
const spawner = new EnemySpawner(W, H);
enemyLayer.addChild(spawner.container);

// Particle system — attach its containers to the correct layers
const particles = new ParticleSystem();
smokeLayer.addChild(particles.smokeContainer);
debrisLayer.addChild(particles.debrisContainer);
fireLayer.addChild(particles.fireContainer);
sparkLayer.addChild(particles.sparkContainer);

// Screen shake — operates on rootScene
const shake = new ScreenShake(rootScene);

// Radar (2D canvas)
const radarCanvas = document.getElementById('radar-canvas');
const radar = new Radar(radarCanvas);

// HUD
const hud = new HudManager();

// Input
const input = new InputManager(document.getElementById('game-container'));

// ─────────────────────────────────────────────────────────────
// 4.  Projectile Pools (player weapons)
// ─────────────────────────────────────────────────────────────

// Plasma blaster bolts
const plasmaPool = new ObjectPool(() => {
  const p = createProjectile();
  projectileLayer.addChild(p);
  return p;
}, 120);

// Heavy missiles
const missilePool = new ObjectPool(() => {
  const m = createMissile();
  projectileLayer.addChild(m);
  return m;
}, 15);

// ─────────────────────────────────────────────────────────────
// 5.  Weapon firing helpers
// ─────────────────────────────────────────────────────────────

/** Spawn a spread of plasma bolts from the player's nose */
function fireSpread() {
  const muzzle = player.getMuzzlePositions()[0];
  const angles = player.getSpreadAngles();     // 5 spread angles
  const baseAngle = player.rotation;           // ship rotation angle

  const colors = [0x4da6ff, 0xff9100, 0x4da6ff, 0x80d8ff, 0xff9100];

  angles.forEach((spreadAngle, i) => {
    const bolt = plasmaPool.acquire();
    bolt.x = muzzle.x;
    bolt.y = muzzle.y;

    const totalAngle = baseAngle + spreadAngle;
    bolt.vx = Math.cos(totalAngle);
    bolt.vy = Math.sin(totalAngle);

    // Tint core body to alternate blue/orange
    const body = bolt.children[0];
    if (body) body.tint = colors[i % colors.length];

    bolt.speed = 820;
    bolt.damage = 12;
    bolt.maxLifetime = 2.5;
  });
}

/** Spawn a heavy missile in a straight line */
function fireMissile() {
  if (player.missileCount <= 0) return;
  player.missileCount--;
  player.missileTimer = player.missileCooldown;

  const muzzle = player.getMuzzlePositions()[0];
  const missile = missilePool.acquire();
  missile.x = muzzle.x;
  missile.y = muzzle.y;
  missile.vx = 1;
  missile.vy = 0;
  missile.rotation = player.rotation;
  missile.speed = 460;
  missile.damage = 90;
}

// ─────────────────────────────────────────────────────────────
// 6.  Enemy kill callback — triggers VFX + screen shake
// ─────────────────────────────────────────────────────────────
spawner.onEnemyKilled = (x, y, intensity) => {
  particles.spawnExplosion(x, y, intensity);
  const traumaAmount = intensity > 1.5 ? 0.55 : 0.25;
  shake.addTrauma(traumaAmount);
};

// ─────────────────────────────────────────────────────────────
// 7.  Game loop update function
// ─────────────────────────────────────────────────────────────
let smokeTimer = 0;

function update(dt, elapsed) {
  // ── Input ──
  input.poll();
  player.inputX = input.moveX;
  player.inputY = input.moveY;

  // Weapon switch
  if (input.weaponSwitch !== -1) {
    player.activeWeapon = input.weaponSwitch;
  }

  // ── Shoot ──
  if (input.isShooting) {
    if (player.activeWeapon === 0 && player.shootTimer <= 0) {
      fireSpread();
      player.shootTimer = player.shootCooldown;
    } else if (player.activeWeapon === 1 && player.missileTimer <= 0 && player.missileCount > 0) {
      fireMissile();
    }
  }

  // Abilities (one-shot flags)
  if (input.abilityShield && player.shieldAbilityCooldown <= 0) {
    player.shield = Math.min(player.maxShield, player.shield + 40);
    player.isInvulnerable = true;
    player.invulnerableTimer = 2.0;
    player.shieldAbilityCooldown = player.shieldAbilityMaxCooldown;
    shake.addTrauma(0.1);
  }

  if (input.abilityBomb && player.bombAbilityCooldown <= 0) {
    // Gravity bomb: kill all on-screen enemies instantly
    spawner.fighterPool.forEachActive((e) => {
      spawner.onEnemyKilled && spawner.onEnemyKilled(e.x, e.y, 1.0);
      e.visible = false;
      spawner.fighterPool.release(e);
    });
    spawner.cruiserPool.forEachActive((e) => {
      spawner.onEnemyKilled && spawner.onEnemyKilled(e.x, e.y, 2.0);
      e.visible = false;
      spawner.cruiserPool.release(e);
    });
    shake.addTrauma(0.8);
    player.bombAbilityCooldown = player.bombAbilityMaxCooldown;
  }

  input.consumeActions();

  // ── Entities ──
  player.update(dt, W, H);
  spawner.update(dt);

  // ── Projectile updates + hit testing ──
  plasmaPool.forEachActive((bolt) => {
    bolt.update(dt);

    // Off-screen cull
    if (bolt.x > W + 40 || bolt.x < -40 || bolt.y < -40 || bolt.y > H + 40) {
      bolt.visible = false;
      plasmaPool.release(bolt);
      return;
    }

    // Lifetime cull
    if (bolt.lifetime >= bolt.maxLifetime) {
      bolt.visible = false;
      plasmaPool.release(bolt);
      return;
    }

    // Hit test
    if (spawner.checkProjectileHit(bolt.x, bolt.y, 6, bolt.damage)) {
      bolt.visible = false;
      plasmaPool.release(bolt);
      // Small hit flash
      shake.addTrauma(0.04);
    }
  });

  missilePool.forEachActive((m) => {
    m.update(dt);

    // Smoke trail
    smokeTimer += dt;
    if (smokeTimer > 0.025) {
      particles.emitSmoke(m.x, m.y);
      smokeTimer = 0;
    }

    if (m.x > W + 60 || m.x < -60 || m.y < -60 || m.y > H + 60) {
      m.visible = false;
      missilePool.release(m);
      return;
    }

    if (m.lifetime >= m.maxLifetime) {
      m.visible = false;
      missilePool.release(m);
      return;
    }

    if (spawner.checkProjectileHit(m.x, m.y, 12, m.damage)) {
      // Missile hit — big explosion
      particles.spawnExplosion(m.x, m.y, 1.8);
      shake.addTrauma(0.4);
      m.visible = false;
      missilePool.release(m);
    }
  });

  // ── VFX ──
  particles.update(dt);
  shake.update(dt);
  background.update(dt, elapsed);

  // ── Radar ──
  radar.setEnemies(spawner.getRadarBlips());
  radar.update(dt);

  // ── HUD — all client-side state object, no server ──
  hud.update({
    hp:     player.hp,
    maxHp:  player.maxHp,
    shield: player.shield,
    energy: player.energy,
    maxEnergy: player.maxEnergy,
    wave:         spawner.wave,
    isBossWave:   spawner.isBossWave,
    combo:        spawner.combo,
    missileCount: player.missileCount,
    maxMissiles:  player.maxMissiles,
    activeWeapon: player.activeWeapon,
    shieldCooldownRatio: player.shieldAbilityCooldown / player.shieldAbilityMaxCooldown,
    bombCooldownRatio:   player.bombAbilityCooldown   / player.bombAbilityMaxCooldown,
    fps: gameLoop.fps,
  });
}

// ─────────────────────────────────────────────────────────────
// 8.  Start the game loop
// ─────────────────────────────────────────────────────────────
const gameLoop = new GameLoop(app);
gameLoop.onUpdate(update);

// ─────────────────────────────────────────────────────────────
// 9.  Resize handler
// ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  W = app.screen.width;
  H = app.screen.height;
  background.resize(W, H);
  spawner.resize(W, H);

  // Keep player in-bounds after resize
  player.x = Math.min(player.x, W * 0.55);
  player.y = Math.min(player.y, H - 50);
});

// ─────────────────────────────────────────────────────────────
// 10. Simple energy regeneration (client-side, no server)
// ─────────────────────────────────────────────────────────────
setInterval(() => {
  player.energy = Math.min(player.maxEnergy, player.energy + 0.05);
}, 500);
