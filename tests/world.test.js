import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, WORLD_NAMES } from '../js/world.js';

test('campaign has 100 distinct level configurations across eight worlds', () => {
  assert.equal(WORLD_NAMES.length, 8);
  for (let level = 1; level <= 100; level++) {
    const world = createWorld(level);
    assert.equal(world.level, level);
    assert.ok(world.width > 4300);
    assert.ok(world.spikes.length + world.spiders.length + world.branches.length >= 7);
    assert.ok(world.exit.x > 4000);
  }
});

test('the forest gate opens when the timber crate is placed on the pressure plate', () => {
  const world = createWorld(1);
  world.crate.x = world.plate.x + 16;
  updateWorld(world, 1 / 60, { x: 80 });
  assert.equal(world.plate.active, true);
  assert.equal(world.gate.open, true);
  assert.equal(world.platforms.some(platform => platform.kind === 'gate'), false);
});

test('branches have a warning window and become harmless after landing', () => {
  const world = createWorld(1);
  const branch = world.branches[0];
  const player = { x: branch.x };
  updateWorld(world, 1 / 60, player);
  assert.equal(branch.triggered, true);
  assert.ok(branch.warning > 0);
  for (let i = 0; i < 260; i++) updateWorld(world, 1 / 60, { x: 80 });
  assert.equal(branch.landed, false); // it has reset after its rest period
});
