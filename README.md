# Project Nebula Shooter — Complete File Reference & Deployment Guide

## Repository File Tree

```
nebula-shooter/
├── index.html                        ← Entry HTML (HUD overlay + canvas mount)
├── style.css                         ← All HUD + game UI styles (no framework)
├── package.json                      ← pixi.js + vite only (2 deps total)
├── vite.config.js                    ← Build config (base:'./', esbuild, vendor chunk)
├── vercel.json                       ← Zero-config Vercel static deployment
├── _headers                          ← Cache + CORS headers (Netlify/GH Pages)
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml                ← GitHub Actions → auto-deploy to Pages
└── src/
    ├── main.js                       ★ ENTRY POINT — wires all systems
    ├── core/
    │   ├── GameLoop.js               ← Delta-time ticker (60/120/144Hz safe)
    │   ├── InputManager.js           ← KB+Mouse (PC) / Virtual joystick (mobile)
    │   └── ObjectPool.js             ← Generic pool (projectiles/enemies/particles)
    ├── environment/
    │   └── Background.js             ← 4-layer parallax stars + nebula blobs
    ├── entities/
    │   ├── Player.js                 ← Detailed spacecraft + thrust animation
    │   ├── Enemy.js                  ← Fighter + Cruiser factories (poolable)
    │   ├── EnemySpawner.js           ← Wave system, formations, score/combo
    │   └── Projectile.js             ← Plasma bolt + Heavy missile factories
    ├── vfx/
    │   ├── ParticleSystem.js         ← Fire / sparks / debris / smoke pools
    │   └── ScreenShake.js            ← Trauma-based camera shake
    └── hud/
        ├── HudManager.js             ← DOM HUD driven by in-memory game state
        └── Radar.js                  ← 2D canvas circular minimap
```

## Audit Results — Zero External Dependencies

| Check | Result |
|---|---|
| Server-side code | ✅ None — 100% client-side |
| `fetch()` / `XMLHttpRequest` / `WebSocket` | ✅ None found |
| `localStorage` / `sessionStorage` / IndexedDB | ✅ None — all state in JS memory |
| External paid assets (fonts, images, audio) | ✅ None — all graphics are procedural PixiJS `Graphics` |
| Google Fonts | ✅ Async-loaded CDN, non-blocking, game works offline with system fallbacks |
| Environment variables / secrets | ✅ Only `import.meta.env.DEV` in ObjectPool (stripped to `false` by Vite prod build) |
| Backend API / database | ✅ None |
| Node.js server | ✅ Not needed — pure static files |

## All Game State is Client-Side Memory

```
Player:    hp, shield, energy, missileCount, cooldowns    → player object in RAM
Waves:     wave number, spawn timer, score, combo         → EnemySpawner instance
Enemies:   position, HP, behavior timers                  → ObjectPool active arrays
Particles: life, velocity, alpha                          → ObjectPool active arrays
HUD:       all values read from above, written to DOM     → HudManager.update()
```

Nothing is saved to disk, sent to a server, or read from a database.

---

## How to Run Locally

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Start dev server (hot-reload)
npm run dev
# → opens http://localhost:3000

# 3. Build for production
npm run build
# → outputs dist/  (HTML + CSS + JS + no external assets)

# 4. Preview the production build locally
npm run preview
# → serves dist/ at http://localhost:4173
```

---

## Deployment Options

### Option A — GitHub Pages (Recommended, Free, Auto-Deploy)

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages → Source → GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` runs automatically on every push to `main`
4. Your game will be live at `https://<username>.github.io/<repo-name>/`

> No configuration needed. The `base: './'` in `vite.config.js` handles subdirectory paths automatically.

### Option B — Vercel (Drag & Drop or Git Connect)

**Git Connect (auto-deploy):**
1. Import the repo on [vercel.com/new](https://vercel.com/new)
2. Set **Output Directory** to `dist`
3. Set **Build Command** to `npm run build`
4. Deploy — every push to `main` auto-deploys

**Drag & Drop:**
1. Run `npm run build` locally
2. Drag the `dist/` folder to [vercel.com/new](https://vercel.com/new)
3. Done — no account needed for the first deploy

### Option C — Netlify Drop

1. Run `npm run build` locally  
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. Live in ~10 seconds

### Option D — Raw GitHub Pages (no Actions)

1. Run `npm run build`
2. Push the contents of `dist/` to a `gh-pages` branch
3. Enable Pages from that branch in repo Settings

---

## Controls Reference

| Action | PC | Mobile |
|---|---|---|
| Move | WASD / Arrow keys | Left-screen virtual joystick |
| Shoot | Left mouse click / Space | Right-screen tap |
| Plasma Blaster | Key `1` or click slot | Tap weapon slot 1 |
| Heavy Missile | Key `2` or click slot | Tap weapon slot 2 |
| Shield Overload | `Q` or click button | Tap SHIELD button |
| Gravity Bomb | `E` or click button | Tap BOMB button |
