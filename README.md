# SHADOW WORLD — GamerKie Edition

**Tagline:** Enter the Darkness. Find the Truth.

A mobile-friendly, cinematic 2D puzzle-platformer prototype. The first playable chapter is **The Forgotten Forest**. It uses an original monochrome environment, a silhouette hero, a patrolling spider, a falling branch trap, a pushable timber crate, a weight plate, an iron gate, a checkpoint, and a short swimming passage.

> This is Chapter 01 / the first playable demo, not the finished eight-world, 80-level game. The project is structured so more chapters, puzzles, enemies, and story sequences can be added without replacing the core game.

## Play

Open `index.html` in a modern browser, or publish the folder as a static site.

### Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Move | A / D or ← / → | Left / right buttons |
| Jump / swim upward | Space / W / ↑ | Up button |
| Interact / remember checkpoint | E | E button |
| Pause / resume | Esc or P | Pause icon |

Push the timber crate onto the pressure plate to raise the iron gate. Jump over the spike bed and avoid the spider and falling branch. Use repeated jumps to swim through the flooded passage. Checkpoints are saved automatically in browser local storage.

## GitHub Pages deployment

1. Create a GitHub repository named `shadow-world` (or another name you prefer).
2. Upload the **contents of this folder**, not the outer ZIP file. Keep `index.html` in the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to publish. The game URL will look like `https://YOUR-USERNAME.github.io/shadow-world/`.

No backend, API key, database, build step, or npm install is required for GitHub Pages. `npm test` is only needed when you want to run the included local logic tests.

## Blogger embed

After GitHub Pages is live, add this iframe to a Blogger HTML post. Replace the example URL with your own published game URL.

```html
<div style="width:100%;max-width:1100px;margin:0 auto;aspect-ratio:16/9;background:#080c0f;overflow:hidden">
  <iframe
    src="https://YOUR-USERNAME.github.io/shadow-world/"
    title="SHADOW WORLD — GamerKie"
    loading="lazy"
    allow="autoplay; fullscreen"
    allowfullscreen
    style="width:100%;height:100%;border:0;display:block">
  </iframe>
</div>
```

## Project structure

```text
SHADOW-WORLD/
├── index.html
├── package.json
├── README.md
├── .nojekyll
├── assets/
│   ├── audio/README.txt
│   ├── backgrounds/README.txt
│   └── images/gamerkie-mark.svg
├── css/
│   ├── style.css
│   └── mobile.css
├── js/
│   ├── audio.js
│   ├── core.js
│   ├── main.js
│   ├── player.js
│   ├── renderer.js
│   ├── save.js
│   └── world.js
└── tests/
    └── core.test.js
```

## Technical notes

- Rendering: HTML5 Canvas 2D with layered procedural art, parallax silhouettes, fog, lighting, water, and vignette.
- Physics: lightweight custom 2D platform physics and AABB collisions. This keeps the demo self-contained and avoids loading a remote game engine at runtime.
- Audio: Web Audio API-generated sound effects; the browser may require the first user tap/click to unlock audio.
- Save data: local storage on the device/browser. Progress does not automatically sync between devices.
- Network: Google Fonts is an optional visual enhancement; system fonts are used as fallbacks. Gameplay itself has no external runtime dependency.

## Local checks

```bash
npm test
npm run check
```

The included tests cover collision overlap, value clamping, movement easing, and save-data normalization.

## Originality

SHADOW WORLD is an original GamerKie project inspired by the broad atmospheric puzzle-platformer genre. It does not use LIMBO's characters, levels, artwork, music, story, or other proprietary assets.


## 100-level campaign update

The campaign now generates 100 level layouts across eight horror biomes. Each level has a longer side-scrolling route, increasing hazard density, moving spiders, falling-branch traps with warning time, spike beds, pits, raised stepping stones, checkpoints, a pressure-plate gate puzzle, and an exit. Progress unlocks the next level and is saved locally in the browser. Mobile touch controls use independent pointer tracking so simultaneous movement and jump inputs work; landscape button sizes have been reduced.

The level layouts are deterministic per level number, so a given level has the same obstacle arrangement on each replay.
