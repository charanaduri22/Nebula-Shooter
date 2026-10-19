/**
 * InputManager — Unified input system for PC and Mobile.
 * 
 * PC:     WASD / Arrow keys for movement, mouse click to shoot,
 *         keys 1-2 for weapon swap, Q/E for abilities.
 * Mobile: Left-screen virtual joystick for movement,
 *         right-screen tap areas for fire/abilities.
 * 
 * Outputs normalized direction vector (inputX, inputY) in [-1, 1]
 * and boolean action flags.
 */
export class InputManager {
  /**
   * @param {HTMLElement} gameContainer — the game container element
   */
  constructor(gameContainer) {
    this._container = gameContainer;

    // Output state — read by player entity each frame
    this.moveX = 0;
    this.moveY = 0;
    this.isShooting = false;
    this.weaponSwitch = -1; // -1 = none, 0 = plasma, 1 = missile
    this.abilityShield = false;
    this.abilityBomb = false;

    // Internal keyboard tracking
    this._keys = {};

    // Mouse state
    this._mouseDown = false;

    // Touch / joystick state
    this._isMobile = false;
    this._joystickActive = false;
    this._joystickOrigin = { x: 0, y: 0 };
    this._joystickCurrent = { x: 0, y: 0 };
    this._joystickTouchId = null;
    this._joystickMaxRadius = 60;

    // Virtual joystick DOM elements
    this._joystickBase = null;
    this._joystickKnob = null;

    // Detect mobile
    this._detectMobile();

    // Set up listeners
    this._bindKeyboard();
    this._bindMouse();

    if (this._isMobile) {
      this._createVirtualJoystick();
      this._bindTouch();
    }

    // Wire up HUD ability buttons (both mobile and PC click)
    this._bindAbilityButtons();
    this._bindWeaponSlots();
  }

  _detectMobile() {
    this._isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }

  // ═══════════════════════════════════════════
  // KEYBOARD (PC)
  // ═══════════════════════════════════════════
  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this._keys[e.code] = true;

      // Weapon switch
      if (e.code === 'Digit1') this.weaponSwitch = 0;
      if (e.code === 'Digit2') this.weaponSwitch = 1;

      // Abilities
      if (e.code === 'KeyQ') this.abilityShield = true;
      if (e.code === 'KeyE') this.abilityBomb = true;
    });

    window.addEventListener('keyup', (e) => {
      this._keys[e.code] = false;
    });
  }

  // ═══════════════════════════════════════════
  // MOUSE (PC)
  // ═══════════════════════════════════════════
  _bindMouse() {
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._mouseDown = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this._mouseDown = false;
    });
    // Prevent context menu on right-click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ═══════════════════════════════════════════
  // VIRTUAL JOYSTICK (Mobile)
  // ═══════════════════════════════════════════
  _createVirtualJoystick() {
    // Base circle
    const base = document.createElement('div');
    base.id = 'virtual-joystick-base';
    Object.assign(base.style, {
      position: 'fixed',
      bottom: '80px',
      left: '40px',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '2px solid rgba(0, 229, 255, 0.3)',
      background: 'rgba(0, 229, 255, 0.05)',
      zIndex: '20',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
      touchAction: 'none',
    });

    // Knob
    const knob = document.createElement('div');
    knob.id = 'virtual-joystick-knob';
    Object.assign(knob.style, {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(0, 229, 255, 0.5) 0%, rgba(0, 229, 255, 0.15) 100%)',
      border: '2px solid rgba(0, 229, 255, 0.6)',
      boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)',
      transition: 'transform 0.05s ease-out',
      touchAction: 'none',
    });

    base.appendChild(knob);
    document.body.appendChild(base);

    this._joystickBase = base;
    this._joystickKnob = knob;
  }

  _bindTouch() {
    const container = this._container;

    container.addEventListener('touchstart', (e) => {
      for (const touch of e.changedTouches) {
        const x = touch.clientX;
        const halfW = window.innerWidth / 2;

        if (x < halfW && this._joystickTouchId === null) {
          // Left side: joystick
          this._joystickTouchId = touch.identifier;
          this._joystickActive = true;

          const baseRect = this._joystickBase.getBoundingClientRect();
          this._joystickOrigin.x = baseRect.left + baseRect.width / 2;
          this._joystickOrigin.y = baseRect.top + baseRect.height / 2;
          this._joystickCurrent.x = touch.clientX;
          this._joystickCurrent.y = touch.clientY;
        } else if (x >= halfW) {
          // Right side: shoot
          this._mouseDown = true;
        }
      }
      e.preventDefault();
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickCurrent.x = touch.clientX;
          this._joystickCurrent.y = touch.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });

    const endTouch = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickTouchId = null;
          this._joystickActive = false;
          this._joystickCurrent.x = this._joystickOrigin.x;
          this._joystickCurrent.y = this._joystickOrigin.y;
          if (this._joystickKnob) {
            this._joystickKnob.style.transform = 'translate(0, 0)';
          }
        }
        // Check if this was a right-side touch ending
        if (touch.clientX >= window.innerWidth / 2) {
          this._mouseDown = false;
        }
      }
    };

    container.addEventListener('touchend', endTouch, { passive: false });
    container.addEventListener('touchcancel', endTouch, { passive: false });
  }

  // ═══════════════════════════════════════════
  // HUD BUTTON BINDINGS
  // ═══════════════════════════════════════════
  _bindAbilityButtons() {
    const shieldBtn = document.getElementById('ability-shield');
    const bombBtn = document.getElementById('ability-bomb');

    if (shieldBtn) {
      shieldBtn.addEventListener('pointerdown', () => {
        this.abilityShield = true;
      });
    }
    if (bombBtn) {
      bombBtn.addEventListener('pointerdown', () => {
        this.abilityBomb = true;
      });
    }
  }

  _bindWeaponSlots() {
    const slot1 = document.getElementById('weapon-slot-1');
    const slot2 = document.getElementById('weapon-slot-2');

    if (slot1) {
      slot1.addEventListener('pointerdown', () => {
        this.weaponSwitch = 0;
      });
    }
    if (slot2) {
      slot2.addEventListener('pointerdown', () => {
        this.weaponSwitch = 1;
      });
    }
  }

  // ═══════════════════════════════════════════
  // POLL — call once per frame to compute state
  // ═══════════════════════════════════════════
  poll() {
    // Reset single-fire flags
    // (consumed after reading — weapon switch & abilities are one-shot)
    // These get reset AFTER the game reads them.

    // ── Keyboard movement ──
    let kx = 0, ky = 0;
    if (this._keys['KeyA'] || this._keys['ArrowLeft'])  kx -= 1;
    if (this._keys['KeyD'] || this._keys['ArrowRight']) kx += 1;
    if (this._keys['KeyW'] || this._keys['ArrowUp'])    ky -= 1;
    if (this._keys['KeyS'] || this._keys['ArrowDown'])  ky += 1;

    // Normalize diagonal
    if (kx !== 0 && ky !== 0) {
      const inv = 1 / Math.SQRT2;
      kx *= inv;
      ky *= inv;
    }

    // ── Joystick movement ──
    let jx = 0, jy = 0;
    if (this._joystickActive) {
      const dx = this._joystickCurrent.x - this._joystickOrigin.x;
      const dy = this._joystickCurrent.y - this._joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = this._joystickMaxRadius;

      if (dist > 2) {
        const clampedDist = Math.min(dist, maxR);
        jx = (dx / dist) * (clampedDist / maxR);
        jy = (dy / dist) * (clampedDist / maxR);

        // Update knob position visually
        if (this._joystickKnob) {
          const visualX = (dx / dist) * clampedDist;
          const visualY = (dy / dist) * clampedDist;
          this._joystickKnob.style.transform = `translate(${visualX}px, ${visualY}px)`;
        }
      }
    }

    // Combine (keyboard takes priority if both are active)
    this.moveX = kx !== 0 ? kx : jx;
    this.moveY = ky !== 0 ? ky : jy;

    // Shooting
    this.isShooting = this._mouseDown ||
      this._keys['Space'] ||
      false;
  }

  /**
   * Consume one-shot actions (call after processing them in the game loop)
   */
  consumeActions() {
    this.weaponSwitch = -1;
    this.abilityShield = false;
    this.abilityBomb = false;
  }

  get isMobile() {
    return this._isMobile;
  }
}
