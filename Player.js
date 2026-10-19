import { Graphics, Container } from 'pixi.js';

/**
 * Creates a highly detailed, forward-facing sci-fi spacecraft
 * drawn entirely with PixiJS Graphics primitives.
 * 
 * The ship faces RIGHT (positive X) and is positioned on the
 * left side of the screen. Design features:
 *  - Angular fuselage with layered hull plates
 *  - Twin swept-back wings with cyan accent lines
 *  - Dual engine nacelles with animated thrust glow
 *  - Cockpit viewport with bright accent
 *  - Weapon hardpoints visible on wing edges
 */
export function createPlayerShip() {
  const ship = new Container();
  ship.label = 'player-ship';

  // ── MAIN FUSELAGE ──────────────────────────────────
  const fuselage = new Graphics();
  // Sleek tapered body
  fuselage.moveTo(38, 0);      // nose tip
  fuselage.lineTo(18, -7);     // upper nose slope
  fuselage.lineTo(-10, -9);    // upper mid-body
  fuselage.lineTo(-28, -6);    // rear upper
  fuselage.lineTo(-32, 0);     // rear center
  fuselage.lineTo(-28, 6);     // rear lower
  fuselage.lineTo(-10, 9);     // lower mid-body
  fuselage.lineTo(18, 7);      // lower nose slope
  fuselage.closePath();
  fuselage.fill({ color: 0x37474f });
  fuselage.stroke({ color: 0x607d8b, width: 1, alpha: 0.7 });
  ship.addChild(fuselage);

  // Upper hull plate detail
  const hullUpper = new Graphics();
  hullUpper.moveTo(30, -1);
  hullUpper.lineTo(14, -5);
  hullUpper.lineTo(-8, -6);
  hullUpper.lineTo(-22, -4);
  hullUpper.lineTo(-8, -3);
  hullUpper.lineTo(14, -2);
  hullUpper.closePath();
  hullUpper.fill({ color: 0x455a64, alpha: 0.8 });
  ship.addChild(hullUpper);

  // Lower hull plate detail
  const hullLower = new Graphics();
  hullLower.moveTo(30, 1);
  hullLower.lineTo(14, 5);
  hullLower.lineTo(-8, 6);
  hullLower.lineTo(-22, 4);
  hullLower.lineTo(-8, 3);
  hullLower.lineTo(14, 2);
  hullLower.closePath();
  hullLower.fill({ color: 0x455a64, alpha: 0.8 });
  ship.addChild(hullLower);

  // Center spine line
  const spine = new Graphics();
  spine.moveTo(32, 0);
  spine.lineTo(-28, 0);
  spine.stroke({ color: 0x90a4ae, width: 1, alpha: 0.4 });
  ship.addChild(spine);

  // ── COCKPIT / VIEWPORT ─────────────────────────────
  const cockpit = new Graphics();
  cockpit.moveTo(28, 0);
  cockpit.lineTo(18, -4);
  cockpit.lineTo(12, -3);
  cockpit.lineTo(12, 3);
  cockpit.lineTo(18, 4);
  cockpit.closePath();
  cockpit.fill({ color: 0x00bcd4, alpha: 0.7 });
  ship.addChild(cockpit);

  // Cockpit bright reflection
  const cockpitGlint = new Graphics();
  cockpitGlint.moveTo(24, -1);
  cockpitGlint.lineTo(18, -3);
  cockpitGlint.lineTo(16, -2);
  cockpitGlint.lineTo(22, 0);
  cockpitGlint.closePath();
  cockpitGlint.fill({ color: 0x80deea, alpha: 0.6 });
  ship.addChild(cockpitGlint);

  // ── TOP WING ──────────────────────────────────────
  const wingTop = new Graphics();
  wingTop.moveTo(8, -8);
  wingTop.lineTo(-4, -10);
  wingTop.lineTo(-24, -26);
  wingTop.lineTo(-30, -28);
  wingTop.lineTo(-28, -22);
  wingTop.lineTo(-18, -12);
  wingTop.lineTo(-10, -9);
  wingTop.closePath();
  wingTop.fill({ color: 0x263238 });
  wingTop.stroke({ color: 0x546e7a, width: 0.8, alpha: 0.6 });
  ship.addChild(wingTop);

  // Top wing cyan accent stripe
  const wingTopAccent = new Graphics();
  wingTopAccent.moveTo(4, -9);
  wingTopAccent.lineTo(-20, -22);
  wingTopAccent.stroke({ color: 0x00e5ff, width: 1.5, alpha: 0.7 });
  ship.addChild(wingTopAccent);

  // Top wing tip weapon hardpoint
  const hardpointTop = new Graphics();
  hardpointTop.circle(-27, -25, 2.5);
  hardpointTop.fill({ color: 0xff6d00, alpha: 0.8 });
  ship.addChild(hardpointTop);

  // ── BOTTOM WING ────────────────────────────────────
  const wingBot = new Graphics();
  wingBot.moveTo(8, 8);
  wingBot.lineTo(-4, 10);
  wingBot.lineTo(-24, 26);
  wingBot.lineTo(-30, 28);
  wingBot.lineTo(-28, 22);
  wingBot.lineTo(-18, 12);
  wingBot.lineTo(-10, 9);
  wingBot.closePath();
  wingBot.fill({ color: 0x263238 });
  wingBot.stroke({ color: 0x546e7a, width: 0.8, alpha: 0.6 });
  ship.addChild(wingBot);

  // Bottom wing cyan accent stripe
  const wingBotAccent = new Graphics();
  wingBotAccent.moveTo(4, 9);
  wingBotAccent.lineTo(-20, 22);
  wingBotAccent.stroke({ color: 0x00e5ff, width: 1.5, alpha: 0.7 });
  ship.addChild(wingBotAccent);

  // Bottom wing tip weapon hardpoint
  const hardpointBot = new Graphics();
  hardpointBot.circle(-27, 25, 2.5);
  hardpointBot.fill({ color: 0xff6d00, alpha: 0.8 });
  ship.addChild(hardpointBot);

  // ── ENGINE NACELLES ────────────────────────────────
  // Top engine
  const engineTop = new Graphics();
  engineTop.roundRect(-34, -14, 12, 6, 1);
  engineTop.fill({ color: 0x37474f });
  engineTop.stroke({ color: 0x78909c, width: 0.8, alpha: 0.5 });
  ship.addChild(engineTop);

  // Bottom engine
  const engineBot = new Graphics();
  engineBot.roundRect(-34, 8, 12, 6, 1);
  engineBot.fill({ color: 0x37474f });
  engineBot.stroke({ color: 0x78909c, width: 0.8, alpha: 0.5 });
  ship.addChild(engineBot);

  // ── ENGINE THRUST GLOW (animated in update) ────────
  const thrustTop = new Graphics();
  thrustTop.label = 'thrust-top';
  ship.addChild(thrustTop);

  const thrustBot = new Graphics();
  thrustBot.label = 'thrust-bot';
  ship.addChild(thrustBot);

  // ── NOSE CANNON ────────────────────────────────────
  const cannon = new Graphics();
  cannon.rect(34, -1.5, 8, 3);
  cannon.fill({ color: 0x546e7a });
  ship.addChild(cannon);

  const cannonTip = new Graphics();
  cannonTip.circle(42, 0, 2);
  cannonTip.fill({ color: 0x4da6ff, alpha: 0.6 });
  ship.addChild(cannonTip);

  // ── ADDITIONAL DETAIL ACCENTS ──────────────────────
  // Panel line details
  const panelLines = new Graphics();
  panelLines.moveTo(6, -7);
  panelLines.lineTo(6, 7);
  panelLines.moveTo(-4, -8);
  panelLines.lineTo(-4, 8);
  panelLines.moveTo(-16, -7);
  panelLines.lineTo(-16, 7);
  panelLines.stroke({ color: 0x78909c, width: 0.5, alpha: 0.3 });
  ship.addChild(panelLines);

  // Small running lights
  const lightLeft = new Graphics();
  lightLeft.circle(-10, -8, 1.2);
  lightLeft.fill({ color: 0x00e5ff, alpha: 0.9 });
  ship.addChild(lightLeft);

  const lightRight = new Graphics();
  lightRight.circle(-10, 8, 1.2);
  lightRight.fill({ color: 0xff1744, alpha: 0.9 });
  ship.addChild(lightRight);

  // Scale up slightly for visibility
  ship.scale.set(1.3);

  // ── SHIP STATE ──────────────────────────────────────
  ship.speed = 320;
  ship.hp = 55000;
  ship.maxHp = 55000;
  ship.shield = 100;
  ship.maxShield = 100;
  ship.energy = 1.0;
  ship.maxEnergy = 2.0;
  ship.isInvulnerable = false;
  ship.invulnerableTimer = 0;

  // Movement input state (set by InputManager)
  ship.inputX = 0;
  ship.inputY = 0;
  ship.isShooting = false;
  ship.shootTimer = 0;
  ship.shootCooldown = 0.08; // rapid fire

  // Weapon state
  ship.activeWeapon = 0; // 0 = plasma, 1 = missile
  ship.missileCount = 3;
  ship.maxMissiles = 5;
  ship.missileTimer = 0;
  ship.missileCooldown = 0.6;

  // Ability state
  ship.shieldAbilityCooldown = 0;
  ship.shieldAbilityMaxCooldown = 12;
  ship.bombAbilityCooldown = 0;
  ship.bombAbilityMaxCooldown = 18;

  // Animation state
  ship._thrustTimer = 0;

  /**
   * Muzzle positions (relative to ship) for spread shot
   * Returns array of {x, y, angle} for each barrel
   */
  ship.getMuzzlePositions = function () {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const noseX = 42 * 1.3;
    const noseY = 0;
    return [
      { x: this.x + noseX * cos - noseY * sin, y: this.y + noseX * sin + noseY * cos, angle: 0 },
    ];
  };

  /**
   * Get spread shot angles for the plasma blaster
   * Returns 5 slightly fanned-out angles
   */
  ship.getSpreadAngles = function () {
    const spreadDeg = 6; // degrees between each beam
    const count = 5;
    const half = Math.floor(count / 2);
    const angles = [];
    for (let i = 0; i < count; i++) {
      angles.push((i - half) * spreadDeg * (Math.PI / 180));
    }
    return angles;
  };

  /**
   * Update engine thrust animation
   */
  ship.updateThrust = function (dt) {
    this._thrustTimer += dt;
    const flicker = 0.7 + 0.3 * Math.sin(this._thrustTimer * 25);
    const length = 10 + 5 * Math.sin(this._thrustTimer * 15) + (Math.abs(this.inputX) > 0.1 ? 6 : 0);

    const tTop = this.getChildByLabel('thrust-top');
    const tBot = this.getChildByLabel('thrust-bot');

    if (tTop) {
      tTop.clear();
      tTop.moveTo(-34, -11);
      tTop.lineTo(-34 - length, -11);
      tTop.lineTo(-34 - length * 0.6, -8.5);
      tTop.closePath();
      tTop.fill({ color: 0x4fc3f7, alpha: 0.5 * flicker });

      tTop.moveTo(-34, -11);
      tTop.lineTo(-34 - length * 0.6, -11);
      tTop.lineTo(-34 - length * 0.3, -9);
      tTop.closePath();
      tTop.fill({ color: 0xffffff, alpha: 0.7 * flicker });
    }

    if (tBot) {
      tBot.clear();
      tBot.moveTo(-34, 11);
      tBot.lineTo(-34 - length, 11);
      tBot.lineTo(-34 - length * 0.6, 8.5);
      tBot.closePath();
      tBot.fill({ color: 0x4fc3f7, alpha: 0.5 * flicker });

      tBot.moveTo(-34, 11);
      tBot.lineTo(-34 - length * 0.6, 11);
      tBot.lineTo(-34 - length * 0.3, 9);
      tBot.closePath();
      tBot.fill({ color: 0xffffff, alpha: 0.7 * flicker });
    }
  };

  /**
   * Main player update — movement + bounds clamping + timers
   */
  ship.update = function (dt, screenW, screenH) {
    // Movement
    this.x += this.inputX * this.speed * dt;
    this.y += this.inputY * this.speed * dt;

    // Clamp to left half of screen (player stays on the left side)
    const margin = 50;
    const maxX = screenW * 0.55;
    this.x = Math.max(margin, Math.min(maxX, this.x));
    this.y = Math.max(margin, Math.min(screenH - margin, this.y));

    // Slight vertical tilt based on vertical input
    this.rotation = this.inputY * 0.12;

    // Weapon cooldowns
    this.shootTimer = Math.max(0, this.shootTimer - dt);
    this.missileTimer = Math.max(0, this.missileTimer - dt);

    // Ability cooldowns
    this.shieldAbilityCooldown = Math.max(0, this.shieldAbilityCooldown - dt);
    this.bombAbilityCooldown = Math.max(0, this.bombAbilityCooldown - dt);

    // Invulnerability
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      this.alpha = Math.sin(this._thrustTimer * 20) > 0 ? 1 : 0.4;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.alpha = 1;
      }
    }

    // Animate thrust
    this.updateThrust(dt);
  };

  return ship;
}
