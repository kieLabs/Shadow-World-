import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, WORLD_NAMES, CHAPTER_TITLES } from '../js/world.js';

test('campaign has 40 long chapter configurations across eight regions', () => {
  assert.equal(WORLD_NAMES.length, 8);
  for (let chapter = 1; chapter <= 40; chapter++) {
    const world = createWorld(chapter);
    assert.equal(world.chapter, chapter);
    assert.ok(world.width >= 9800);
    assert.ok(world.spikes.length + world.spiders.length + world.branches.length + world.saws.length >= 16);
    assert.ok(world.stalkers.length >= 3);
    assert.equal(world.switches.length, world.ladders.length);
    assert.ok(world.exit.x > 9000);
  }
});

test('the chapter gate opens when the timber crate and relay puzzle are solved', () => {
  const world = createWorld(1);
  world.crate.x = world.plate.x + 16;
  updateWorld(world, 1 / 60, { x: 80, w: 27 });
  assert.equal(world.plate.active, true);
  for (const item of world.switches) item.activated = true;
  updateWorld(world, 1 / 60, { x: 80, w: 27 });
  assert.equal(world.gate.open, true);
  assert.equal(world.platforms.some(platform => platform.kind === 'gate'), false);
});

test('the final gate stays locked until both the weight plate and every relay are active', () => {
  const world = createWorld(3);
  world.crate.x = world.plate.x + 16;
  updateWorld(world, 1 / 60, { x: 80, w: 27 });
  assert.equal(world.plate.active, true);
  assert.equal(world.gate.open, false);
  for (const relay of world.switches) relay.activated = true;
  updateWorld(world, 1 / 60, { x: 80, w: 27 });
  assert.equal(world.gate.open, true);
});

test('branches have a warning window and become harmless after landing', () => {
  const world = createWorld(1);
  const branch = world.branches[0];
  const player = { x: branch.x, w: 27 };
  updateWorld(world, 1 / 60, player);
  assert.equal(branch.triggered, true);
  assert.ok(branch.warning > 0);
  for (let i = 0; i < 360; i++) updateWorld(world, 1 / 60, { x: 80, w: 27 });
  assert.equal(branch.landed, false); // it has reset after its rest period
});

test('campaign contains exactly 40 long chapters across eight distinct regions', () => {
  const first = createWorld(1);
  const last = createWorld(40);
  assert.equal(WORLD_NAMES.length, 8);
  assert.equal(CHAPTER_TITLES.length, 40);
  assert.ok(first.width >= 9000);
  assert.ok(last.width >= first.width);
  assert.equal(last.level, 40);
  assert.ok(first.ladders.length >= 3);
  assert.ok(first.switches.length >= 2);
  assert.ok(first.saws.length >= 1);
  assert.ok(first.tunnels.length >= 1);
});

test('chapter indices are clamped to 1..40 and assigned to five-chapter regions', () => {
  assert.equal(createWorld(0).level, 1);
  assert.equal(createWorld(40).worldIndex, 7);
  assert.equal(createWorld(41).level, 40);
  assert.equal(createWorld(6).worldIndex, 1);
});


test('the first safe checkpoint is before the crate puzzle', () => {
  const world = createWorld(1);
  assert.equal(world.checkpoints[0], 150);
  assert.ok(world.checkpoints[0] < world.crate.x);
});

test('a shadow-stalker becomes alert and hunts when the player gets close', () => {
  const world = createWorld(10);
  const stalker = world.stalkers[0];
  stalker.x = 400;
  const before = stalker.x;
  updateWorld(world, .1, { x: 520, w: 27 });
  assert.equal(stalker.alert, 1);
  assert.ok(stalker.x > before);
});
