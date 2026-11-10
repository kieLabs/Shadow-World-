import test from 'node:test';
import assert from 'node:assert/strict';
import { Renderer } from '../js/renderer.js';
import { Player } from '../js/player.js';
import { createWorld } from '../js/world.js';

function makeLegacyCanvas() {
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, {
    get(target, key) {
      if (key === 'roundRect') return undefined;
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key in target) return target[key];
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    }
  });

  return {
    width: 960,
    height: 540,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 960, height: 540 })
  };
}

test('the game renderer works across all 40 chapters without Canvas roundRect support', () => {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { devicePixelRatio: 1 } });
  const renderer = new Renderer(makeLegacyCanvas());

  try {
    for (let chapter = 1; chapter <= 40; chapter += 1) {
    const world = createWorld(chapter);
    const game = {
      world,
      player: new Player(80, world.floorY),
      dt: 1 / 60,
      toast: '',
      toastTimer: 0
    };

      assert.doesNotThrow(() => renderer.render(game), `chapter ${chapter} should render`);
    }
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});
