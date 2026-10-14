# Era Draw

Endless survivor game for phone browsers. You play a mage who hops through time and **draws** weapons from the current era. Each weapon fights on its own until it breaks, and then you draw it again.

**Play:** https://pingwyd.github.io/era-draw/

## Controls
- **Laptop:** hold the right mouse button to walk toward the cursor, left-drag to draw. WASD works too. Settings has an optional **Auto-move (kite)** that steers away from enemies and toward XP.
- **Phone:** landscape only. Tapping Play goes fullscreen and locks the screen to landscape where the browser allows it. Holding the phone upright pauses the game and shows a "Rotate your phone" screen. The web app manifest also sets landscape + fullscreen.
- **Move (phone):** drag on the left half of the screen (or use WASD / arrow keys)
- **Draw:** drag on the right half (with a mouse, click and drag anywhere). Time slows down while you draw, for up to 2s.
  - Short straight line: 🪵 Club (orbits you and smashes nearby enemies with knockback)
  - Long straight line: 🗡️ Spear (first throw goes the way you drew, then it auto-throws piercing spears)
  - Circle: 🪨 Rock (lobs rocks that hit an area)
  - V shape: 🪃 Sling (unlock in the shop, 150 coins)
  - Zigzag: 🦴 Bone Dagger (unlock in the shop, 250 coins)
- A shape that isn't recognized, or a weapon that's not in your loadout, spawns nothing. You can have up to 3 melee weapons (Club, Bone Dagger) or 2 ranged weapons (Spear, Rock, Sling) out at once (`BASE_CAPS` in `game.js`; upgrades can raise each category through `player.caps`). Drawing one more replaces the oldest. Drawing a different weapon shatters all the ones that are out.

## Tuning
All tuning lives at the top of `game.js`:
- `ERAS`: per-era `durability` multiplier (Stone 1.0, Bronze 1.6, Iron 2.2) plus enemy HP and damage scaling
- `OLD_ERA_DMG = 0.65`: damage multiplier for weapons from an earlier era
- `CREATIONS`, `POWERUPS`, `SHOP`

Progress is saved in `localStorage` under the key `eradraw.save.v1`.

## Run locally
No build step. Run `python3 -m http.server` in this folder, then open http://localhost:8000.

## Testing
- Full test save: https://pingwyd.github.io/era-draw/#/dev/unlock-all (locally: http://localhost:8080/#/dev/unlock-all). It asks you to confirm first. You get max coins and gems, every era unlocked and cleared (including Mythic), and every weapon, mage, ink, upgrade, skill node, achievement and bestiary entry. Materials are stacked high and mastery is maxed. Your settings are kept.
- Wipe the save: https://pingwyd.github.io/era-draw/#/dev/reset-save (confirms, then reloads).
- Regression tests: `node tests/stale-run.test.js`, `node tests/ios-webkit.test.js` (need `python3 -m http.server 8080` and Playwright).

- LAN test (2-3 headless browsers over WebRTC): `node tests/lan-webrtc.test.js`; offline/service-worker test: `node tests/offline-sw.test.js`.

## Multiplayer
- **Same screen** (`#/coop`): P2 on keyboard (IJKL + O), P3/P4 on gamepads.
- **LAN, separate devices, no internet** (`#/lan`): the host taps *Invite a player* and the joiner scans the QR code (or pastes the code). The joiner then shows an answer code back to the host. Repeat for up to 3 joiners, then the host taps *Start run*. Everyone must be on the same Wi-Fi or hotspot. Open the game once while online so the service worker caches it.
- Online play and chat are planned only: see `docs/ONLINE.md`.

## Branches
- `main`: stable, served by GitHub Pages
- `mvp`: the MVP release candidate
- `dev`: beta and integration
- `feature/<name>`: one per major feature (e.g. `feature/drawing`, `feature/run-loop`, `feature/powerups`, `feature/shop-meta`). Merge into `dev`.
- `bugfix/<short-desc>`: branch off `dev` (or off `main` for a hotfix), e.g. `bugfix/circle-misdetect`. Merge back into `dev`. A hotfix also goes into `main`.
- Promotion order: `feature/*` → `dev` → `mvp` → `main`

## Look & feel (v0.3)
- **Pixel art:** the game draws into a low-res buffer and scales it up with smoothing off. Every sprite (mage, weapons, enemies, ground decor, pickups, icons) is a hand-authored pixel grid in `sprites.js` / `enemies.js`. No image files.
- **Enemies (Stone Age):** Giant Gnat swarms, Terror Bird flocks, Sabertooth (winds up, then lunges), Rival Caveman (keeps its distance and throws rocks), Cave Bear (slow, tanky), Woolly Rhino (charges; elite, may drop a chest), **Grael the Woolly Elder** (charging boss, from 3:00) and **Ur-Kesh, Bone Shaman** (fires orb rings and summons gnats, from 5:00). Bosses have a named HP bar and drop a chest. Enemies are capped at 320, with a spatial grid so big hordes stay smooth.
- **HUD:** thin XP bar along the top, timer in the centre, health top-left, kills and coins top-right, and bottom slots showing each loadout weapon with its active count and durability. A dithered light radius darkens the edges of the screen.
- **Menus:** editorial layout. Instrument Serif display type, Silkscreen / VT323 pixel fonts (self-hosted, OFL), thin rules, numbered items, dark wine palette.
- **Audio:** small WebAudio synth sound effects (`audio.js`). Turn them off in Settings → Sound.
- Screenshots are in `shots/`.
