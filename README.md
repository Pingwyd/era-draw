# Era Draw

Endless survivor game for phone browsers. You play a mage who hops through time and **draws** weapons from the current era. Each weapon fights on its own until it breaks, and then you draw it again.

**Play:** https://pingwyd.github.io/era-draw/

## Controls
- **Move:** drag on the left half of the screen (or use WASD / arrow keys)
- **Draw:** drag on the right half (with a mouse, click and drag anywhere). Time slows down while you draw, for up to 2s.
  - Short straight line: 🪵 Club (orbits you and smashes nearby enemies with knockback)
  - Long straight line: 🗡️ Spear (first throw goes the way you drew, then it auto-throws piercing spears)
  - Circle: 🪨 Rock (lobs rocks that hit an area)
  - V shape: 🪃 Sling (unlock in the shop, 150 coins)
  - Zigzag: 🦴 Bone Dagger (unlock in the shop, 250 coins)
- A shape that isn't recognized, or a weapon that's not in your loadout, spawns nothing. You can have at most 5 weapons out at once.

## Tuning
All tuning lives at the top of `game.js`:
- `ERAS`: per-era `durability` multiplier (Stone 1.0, Bronze 1.6, Iron 2.2) plus enemy HP and damage scaling
- `OLD_ERA_DMG = 0.65`: damage multiplier for weapons from an earlier era
- `CREATIONS`, `POWERUPS`, `SHOP`

Progress is saved in `localStorage` under the key `eradraw.save.v1`.

## Run locally
No build step. Run `python3 -m http.server` in this folder, then open http://localhost:8000.

## Branches
- `main`: stable, served by GitHub Pages
- `mvp`: the MVP release candidate
- `dev`: beta and integration
- `feature/<name>`: one per major feature (e.g. `feature/drawing`, `feature/run-loop`, `feature/powerups`, `feature/shop-meta`). Merge into `dev`.
- `bugfix/<short-desc>`: branch off `dev` (or off `main` for a hotfix), e.g. `bugfix/circle-misdetect`. Merge back into `dev`. A hotfix also goes into `main`.
- Promotion order: `feature/*` → `dev` → `mvp` → `main`
