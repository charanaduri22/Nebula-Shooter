/**
 * HudManager — Bridges game state (client-side memory) to the HTML HUD overlay.
 *
 * All game state is kept in plain JS objects in browser memory.
 * No server calls, no localStorage, no external APIs.
 * This module reads that state and updates the DOM elements.
 */
export class HudManager {
  constructor() {
    // Cache DOM refs once — cheap to update, avoids repeated querySelector
    this._hpFill    = document.getElementById('hp-fill');
    this._hpValue   = document.getElementById('hp-value');
    this._shFill    = document.getElementById('shield-fill');
    this._shValue   = document.getElementById('shield-value');
    this._engFill   = document.getElementById('energy-fill');
    this._engValue  = document.getElementById('energy-value');

    this._waveStatus   = document.getElementById('wave-status');
    this._comboValue   = document.getElementById('combo-value');
    this._missileAmmo  = document.getElementById('missile-ammo');
    this._missileAmmo2 = document.querySelector('.missile-badge');
    this._fpsCtr       = document.getElementById('fps-counter');

    this._slot1 = document.getElementById('weapon-slot-1');
    this._slot2 = document.getElementById('weapon-slot-2');

    this._shieldCD = document.getElementById('shield-cooldown');
    this._bombCD   = document.getElementById('bomb-cooldown');

    this._rotateOverlay = document.getElementById('rotate-overlay');

    // Combo pulse state
    this._lastCombo = 0;

    // Portrait detection
    this._setupOrientationGuard();
  }

  // ── Orientation guard ──────────────────────────────────────
  _setupOrientationGuard() {
    const check = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (this._rotateOverlay) {
        this._rotateOverlay.style.display = isPortrait ? 'flex' : 'none';
      }
    };
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    check();
  }

  // ── HP bar ─────────────────────────────────────────────────
  /**
   * @param {number} current
   * @param {number} max
   */
  setHP(current, max) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    if (this._hpFill) this._hpFill.style.width = pct + '%';
    if (this._hpValue) this._hpValue.textContent =
      `${Math.round(current).toLocaleString()}/${max.toLocaleString()}`;
  }

  // ── Shield bar ────────────────────────────────────────────
  /**
   * @param {number} current  0..100
   */
  setShield(current) {
    const pct = Math.max(0, Math.min(100, current));
    if (this._shFill) this._shFill.style.width = pct + '%';
    if (this._shValue) this._shValue.textContent = `${Math.round(pct)}%`;
  }

  // ── Energy bar ────────────────────────────────────────────
  /**
   * @param {number} current  0..maxEnergy
   * @param {number} max
   */
  setEnergy(current, max) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    if (this._engFill) this._engFill.style.width = pct + '%';
    if (this._engValue) this._engValue.textContent = `x${current.toFixed(1)}`;
  }

  // ── Wave status ───────────────────────────────────────────
  /**
   * @param {number} wave
   * @param {boolean} isBossWave
   */
  setWave(wave, isBossWave = false) {
    if (this._waveStatus) {
      this._waveStatus.textContent = isBossWave
        ? `WAVE ${wave} / BOSS APPROACHING`
        : `WAVE ${wave} / INCOMING`;
    }
  }

  // ── Combo counter ─────────────────────────────────────────
  /**
   * @param {number} combo
   */
  setCombo(combo) {
    if (!this._comboValue) return;
    this._comboValue.textContent = `x${combo}`;

    // Pulse animation on increment
    if (combo > this._lastCombo && combo > 1) {
      this._comboValue.classList.add('pulse');
      clearTimeout(this._pulseTimeout);
      this._pulseTimeout = setTimeout(() => {
        this._comboValue?.classList.remove('pulse');
      }, 120);
    }
    this._lastCombo = combo;
  }

  // ── Missile ammo ──────────────────────────────────────────
  /**
   * @param {number} current
   * @param {number} max
   */
  setMissileAmmo(current, max) {
    const text = `${current}/${max}`;
    if (this._missileAmmo)  this._missileAmmo.textContent  = `(${text})`;
    if (this._missileAmmo2) this._missileAmmo2.textContent = text;
  }

  // ── Active weapon highlight ───────────────────────────────
  /**
   * @param {number} index  0 = plasma, 1 = missile
   */
  setActiveWeapon(index) {
    if (this._slot1) this._slot1.classList.toggle('active', index === 0);
    if (this._slot2) this._slot2.classList.toggle('active', index === 1);
  }

  // ── Ability cooldowns ─────────────────────────────────────
  /**
   * @param {number} shieldRatio  0..1  (1 = fully on cooldown)
   * @param {number} bombRatio    0..1
   */
  setCooldowns(shieldRatio, bombRatio) {
    if (this._shieldCD) {
      this._shieldCD.style.height = `${shieldRatio * 100}%`;
    }
    if (this._bombCD) {
      this._bombCD.style.height = `${bombRatio * 100}%`;
    }
  }

  // ── FPS counter ───────────────────────────────────────────
  /**
   * @param {number} fps
   */
  setFPS(fps) {
    if (this._fpsCtr) this._fpsCtr.textContent = `FPS: ${fps}`;
  }

  /**
   * Single call to refresh all HUD elements from game state.
   *
   * @param {Object} state — plain JS object, all in browser memory:
   *   { hp, maxHp, shield, energy, maxEnergy, wave, isBossWave,
   *     combo, missileCount, maxMissiles, activeWeapon,
   *     shieldCooldownRatio, bombCooldownRatio, fps }
   */
  update(state) {
    this.setHP(state.hp, state.maxHp);
    this.setShield(state.shield);
    this.setEnergy(state.energy, state.maxEnergy);
    this.setWave(state.wave, state.isBossWave);
    this.setCombo(state.combo);
    this.setMissileAmmo(state.missileCount, state.maxMissiles);
    this.setActiveWeapon(state.activeWeapon);
    this.setCooldowns(state.shieldCooldownRatio, state.bombCooldownRatio);
    this.setFPS(state.fps);
  }
}
