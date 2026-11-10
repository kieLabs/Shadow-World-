import test from 'node:test';
import assert from 'node:assert/strict';
import { roundedRectPath } from '../js/canvas-utils.js';

test('roundedRectPath uses native roundRect when the browser supports it', () => {
  const calls = [];
  const ctx = {
    roundRect(...args) { calls.push(['roundRect', ...args]); }
  };

  roundedRectPath(ctx, 1, 2, 30, 20, 5);

  assert.deepEqual(calls, [['roundRect', 1, 2, 30, 20, 5]]);
});

test('roundedRectPath draws a rounded path when native roundRect is unavailable', () => {
  const calls = [];
  const ctx = {
    moveTo(...args) { calls.push(['moveTo', ...args]); },
    lineTo(...args) { calls.push(['lineTo', ...args]); },
    quadraticCurveTo(...args) { calls.push(['quadraticCurveTo', ...args]); },
    closePath() { calls.push(['closePath']); }
  };

  roundedRectPath(ctx, 10, 20, 100, 40, 8);

  assert.equal(calls[0][0], 'moveTo');
  assert.equal(calls.filter(call => call[0] === 'quadraticCurveTo').length, 4);
  assert.equal(calls.at(-1)[0], 'closePath');
});
