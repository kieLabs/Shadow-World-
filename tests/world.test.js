import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld } from '../js/world.js';

test('the forest gate opens when the timber crate is placed on the pressure plate', () => {
  const world = createWorld();
  const player = { x: 80 };
  assert.equal(world.gate.open, false);
  world.crate.x = world.plate.x + 16;
  updateWorld(world, 1 / 60, player);
  assert.equal(world.plate.active, true);
  assert.equal(world.gate.open, true);
  assert.equal(world.platforms.some(platform => platform.kind === 'gate'), false);
});

test('the forest begins with a checkpoint, a spider, spikes, and a water crossing', () => {
  const world = createWorld();
  assert.equal(world.checkpoints.length, 1);
  assert.ok(world.spider.maxX > world.spider.minX);
  assert.equal(world.spikes.length, 1);
  assert.ok(world.water.w > 0);
});
