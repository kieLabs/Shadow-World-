import test from 'node:test';
import assert from 'node:assert/strict';
import { aabbOverlap, approach, clamp, makeSaveData } from '../js/core.js';

test('clamp keeps values inside inclusive bounds', () => {
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(12, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});

test('approach moves toward target without overshooting', () => {
  assert.equal(approach(0, 10, 4), 4);
  assert.equal(approach(9, 10, 4), 10);
  assert.equal(approach(10, 0, 3), 7);
});

test('AABB collision requires positive area of intersection', () => {
  assert.equal(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 5, h: 5 }), true);
  assert.equal(aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 }), false);
});

test('save data is normalized and cannot contain invalid checkpoint values', () => {
  assert.deepEqual(makeSaveData({ checkpoint: 5000, unlockedLevel: 5000, bestProgress: -2 }), {
    version: 3, checkpoint: 40, unlockedLevel: 40, bestProgress: 0, soundOn: true, completed: false
  });
  assert.equal(makeSaveData({ checkpoint: Number.NaN }).checkpoint, 1);
});
