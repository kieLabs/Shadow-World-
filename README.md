# SHADOW WORLD — GamerKie Edition

**Tagline:** Enter the Darkness. Find the Truth.

An original, cinematic 2D horror puzzle-platform adventure. This edition is built around **40 long chapters across eight distinct regions**. Each chapter is a wide side-scrolling journey with environmental puzzles, vertical routes, lethal hazards, checkpoints, and a gate that requires both weight and restored signal relays.

SHADOW WORLD draws on the broad atmospheric puzzle-platformer genre. It does not copy LIMBO's characters, level layouts, story, artwork, sound, or other proprietary material.

## The 40-chapter campaign

| Region | Chapters | Atmosphere |
|---|---:|---|
| Hollowwood: The First Silence | 01–05 | Dead forest, root tunnels, falling trunks, distant eyes |
| Drowned Hamlet: Below the Bells | 06–10 | Sunken village, flooded rooms, submerged passages |
| Mire of Teeth: The Living Bog | 11–15 | Black water, crawling nests, unstable ground |
| The Underdeep: No Way Back | 16–20 | Vertical shafts, bone tunnels, buried structures |
| Ironworks: The Hungering Machine | 21–25 | Crushers, moving saws, steel walkways, furnace light |
| Blackglass Lab: Subject Zero | 26–30 | Red warning lights, containment corridors, failed experiments |
| The Sunken Crown: City of Ash | 31–35 | Ruined towers, broken bridges, flooded cathedral |
| The Last Veil: The Heart Below | 36–40 | Deep red skies, final descent, the source of the signal |

Every chapter is generated from a fixed chapter seed so its obstacle layout stays consistent on replay. Routes are longer than the previous prototype and increase in hazard density and complexity as the campaign progresses. Chapters include spikes and pits, patrolling crawlers, hunting shadow-stalkers, falling branches, moving saws, low-clearance tunnels, climbable ladders, elevated ledges, signal relays, pressure plates, and checkpoints.

## Controls

| Action | Keyboard | Mobile landscape |
|---|---|---|
| Move left/right | A / D or ← / → | LEFT / RIGHT |
| Climb up | W or ↑ near a ladder | UP |
| Climb down | S or ↓ near a ladder | DOWN |
| Crouch under low beams | Hold S or ↓ on the ground | Hold DOWN |
| Jump | Space | JUMP |
| Swim upward | Hold Space or UP in water | Hold JUMP or UP |
| Interact / activate relay | E | E |
| Pause | Esc or P | Ⅱ |

To climb, stand close to a ladder and hold **UP**. Hold **DOWN** to descend. Away from a ladder, holding **DOWN** makes the character crouch so the low tunnels can be crossed. On a ladder, horizontal movement detaches the character from it. The JUMP button is separate from UP/DOWN.

## Chapter objectives

1. Push the timber crate onto the pressure plate.
2. Find the raised platforms and use each ladder to reach the signal relays.
3. Stand beside a relay and press E to restore it.
4. Avoid the hazards and reach the final gate. The exit opens only after the plate and all relays are active.
5. Cross checkpoints to set a safer retry point.

## GitHub Pages deployment

1. Extract the ZIP file.
2. Open the `shadow-world` folder.
3. Upload the **contents** of `shadow-world` to the root of your GitHub repository. `index.html` must be at the repository root.
4. Open **Settings → Pages**. Select **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
5. Open the published Pages URL after the deployment succeeds.

No backend, API key, framework, build step, or npm install is needed to play the static game.

## Blogger iframe

Use the code in `blogger-embed.html` after replacing the example GitHub Pages URL with the URL of your published game.

## Project structure

```text
shadow-world/
├── index.html
├── package.json
├── README.md
├── .nojekyll
├── blogger-embed.html
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
    ├── core.test.js
    ├── player.test.js
    └── world.test.js
```

## Technical notes

- Rendering: HTML5 Canvas 2D, layered parallax, biome palettes, fog, moonlight, surface textures, shadows, glowing relay devices, metallic ladders, and moving saws.
- Physics: custom 2D platform physics with jump buffering, coyote time, ladder climbing, crouching, swimming, and collision checks.
- Controls: touch pointers are tracked independently, so simultaneous left/right and jump inputs work. Six mobile actions are available: left, right, up, down, jump, and interact; a pause control is also provided.
- Progress: chapter unlocks and sound preference are stored in localStorage on the current browser/device. Progress does not sync automatically between devices.
- Audio: Web Audio API-generated effects. The browser requires a user gesture before sound can start.

## Local verification

```bash
npm test
npm run check
```

The tests cover campaign size, region assignment, gate requirements, branch warnings, ladder ascent/descent, crouching, core collision helpers, and save-data normalization.

## Visual style

The game uses original, procedurally rendered silhouettes and cinematic environmental effects. The visuals are stylized 2D art rather than scanned photorealistic assets or 3D models; the goal is a darker, more layered, atmospheric presentation while keeping the game fast and self-contained for GitHub Pages and Blogger.
