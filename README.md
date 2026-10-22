# AwaisGames — Premium Browser Gaming Platform

**Live Website**: [https://awaisgames.netlify.app/](https://awaisgames.netlify.app/)

AwaisGames is a fast, responsive browser gaming platform inspired by the game-discovery and usability strengths of Poki, CrazyGames, and Coolmath Games, built with React, Vite, Tailwind CSS, and Phaser 3.

It features a **Zero-Database, GitOps-Driven Game Discovery Engine**. Adding a new game requires **zero modifications** to the React code, routes, or manual registries. You simply commit a new folder inside `games/`, push to GitHub, and your hosting provider (Netlify) automatically compiles, bundles, and publishes the new game to the live portal.

---

## 1. How Automatic Discovery Works

Instead of relying on a database, manual JSON list, or runtime server calls:
- Vite's build-time discovery engine (`import.meta.glob`) scans the `games/` directory at compile time.
- All valid manifests (`games/*/game.json`) are automatically detected.
- Game thumbnails, scoped stylesheets (`game.css`), code-split JavaScript entries (`game.js`), and private assets (`games/*/assets/*`) are bundled and mapped to their respective games.
- Game routes (`#game/:id` or `/game/:id`), homepage cards, category filters, and search indices are generated automatically from discovered metadata.
- When you click "Play", the game's JavaScript module is dynamically imported on-demand.

---

## 2. Game Directory Specification

Every game in the arcade lives in its own self-contained directory under `games/`:

```
games/
  endless-runner/
    game.json            # Manifest: metadata, controls, entry point
    game.js              # Game code exporting createGame(container, options)
    game.css             # Scoped styles for the game viewport
    thumbnail.webp       # 4:3 cover thumbnail displayed on homepage
    assets/              # Private, isolated assets
      player.png
      background.webp
      obstacle.png
      coin.png
  cyber-invaders/
    game.json
    game.js
    game.css
    thumbnail.webp
    assets/
      player.png
      invader.png
      background.webp
  my-next-game/
    game.json
    game.js
    game.css
    thumbnail.webp
    assets/
```

> **Asset Isolation Rule**: Games cannot accidentally access another game's private assets. The runtime maps relative asset paths strictly against the individual game's folder.

---

## 3. Game Manifest (`game.json`)

Each game directory must contain a valid `game.json`:

```json
{
  "id": "endless-runner",
  "title": "Neon Runner",
  "description": "Sprint through a cyberpunk cityscape, leap over electrified barriers, collect energy tokens, and set high scores.",
  "category": "Arcade",
  "thumbnail": "./thumbnail.webp",
  "entry": "game.js",
  "style": "game.css",
  "engine": "phaser",
  "version": "1.0.0",
  "featured": true,
  "author": "Neon Labs",
  "releaseDate": "2026-10-15",
  "tags": ["Phaser 3", "Endless Runner", "Cyberpunk", "Action"],
  "controls": {
    "desktop": "Space or Up Arrow to Jump · P to Pause",
    "mobile": "Tap anywhere on the game screen to Jump"
  }
}
```

### Manifest Fields
- `id` *(string, required)*: Unique slug for the game route (e.g. `endless-runner`).
- `title` *(string, required)*: Display title on cards, header, and search.
- `description` *(string, required)*: Brief description shown on cards and player view.
- `category` *(string, required)*: Game category used for category filter tabs (e.g. `Arcade`, `Shooter`, `Puzzle`).
- `thumbnail` *(string, required)*: Relative path to cover art (`./thumbnail.webp`, `./thumbnail.png`, etc.).
- `entry` *(string, required)*: Entry JavaScript file relative to the folder (e.g. `game.js`).
- `style` *(string, optional)*: Scoped CSS file (e.g. `game.css`).
- `engine` *(string, optional)*: Engine identifier (`phaser`, `canvas`, etc.).
- `featured` *(boolean, optional)*: Whether to feature this game in the top hero showcase.
- `controls` *(object, optional)*: Clear controls instructions for desktop and mobile players.

---

## 4. Game Implementation Contract

Each game's entry script (`game.js`) must export a `createGame` factory function:

```javascript
import Phaser from 'phaser';

/**
 * Game Factory Contract
 * @param {HTMLElement} container - DOM element to mount the game canvas
 * @param {Object} options - Runtime context and hooks
 * @returns {Object} Game controller object with cleanup and control methods
 */
export function createGame(container, options = {}) {
  // 1. Clear previous elements if necessary
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // 2. Configure Phaser or custom engine
  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: 800,
    height: 480,
    backgroundColor: '#070b14',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MyScene],
  };

  const game = new Phaser.Game(config);

  // 3. Return clean controller instance
  return {
    gameInstance: game,
    pause: () => {
      // Optional: pause scene
    },
    resume: () => {
      // Optional: resume scene
    },
    restart: () => {
      // Optional: restart scene
    },
    setMuted: (isMuted) => {
      // Optional: toggle audio mute
    },
    destroy: (removeCanvas = true) => {
      // CRITICAL: Clean up Phaser and listeners when navigating away
      try {
        game.destroy(removeCanvas);
      } catch (e) {
        console.warn('Game cleanup:', e);
      }
    },
  };
}
```

### Options Object Passed to `createGame`:
- `options.container`: The HTML DOM element reserved for the game.
- `options.manifest`: Full parsed `game.json` data.
- `options.assets`: A dictionary mapping relative asset paths (e.g. `'assets/player.png'`) to their resolved, bundled Vite URLs.
- `options.getAssetUrl(relativePath)`: Helper function to retrieve bundled asset URLs.
- `options.isMuted`: Initial audio mute state.
- `options.onScoreUpdate(score)`: Callback to notify the portal of live score updates for HUD display.
- `options.onGameOver(finalScore)`: Callback when game finishes (triggers high-score checks and celebratory confetti).
- `options.onStateChange(state)`: Callback for state transitions (`'PLAYING'`, `'PAUSED'`, `'GAMEOVER'`).

---

## 5. Adding a New Game via GitHub (Acceptance Test Walkthrough)

To add a new game to the live portal:

### Step 1: Create a folder in `games/`
```bash
mkdir -p games/my-new-game/assets
```

### Step 2: Add your files
1. `games/my-new-game/game.json` (Manifest with id, title, category, etc.)
2. `games/my-new-game/game.js` (Exporting `createGame`)
3. `games/my-new-game/game.css` (Scoped container styling)
4. `games/my-new-game/thumbnail.webp` (4:3 image)
5. `games/my-new-game/assets/` (Any sprites, sound effects, or backgrounds)

### Step 3: Commit and push to GitHub
```bash
git add games/my-new-game/
git commit -m "feat(arcade): add my-new-game"
git push origin main
```

### Step 4: Automatic Deployment
Your hosting provider (e.g. Netlify) listens for the push, runs `npm run build`, and deploys. 
Vite discovers `games/my-new-game/game.json` during the build and automatically adds it to the homepage, search, categories, and routing table. **No central registry or React code edits needed!**

---

## 6. Hosting & Deployment Configuration (Netlify)

This repository includes preconfigured deployment settings for Netlify:

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `public/_redirects`
```
/*    /index.html   200
```

These configuration files guarantee single-page application (SPA) client-side routing on Netlify with zero configuration.

---

## 7. Included Games

1. **Neon Runner** (`games/endless-runner/`):
   - Full-featured Phaser 3 endless runner.
   - Start screen, physics jumping, double jumps.
   - Procedural obstacles, collision detection, and energy tokens.
   - Web Audio API retro arcade synthesized audio (jump whoosh, coin chime, crash, start melody).
   - High score persistence with `localStorage`.
   - Pause (`P`), restart, and mobile touch support.

2. **Cyber Invaders** (`games/cyber-invaders/`):
   - Retro-futuristic arcade space defender in Phaser 3.
   - Swarm movement, descending alien fleet, plasma lasers, shields, and waves.
   - Desktop and mobile touch controls.
