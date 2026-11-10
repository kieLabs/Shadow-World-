import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../js/player.js';
import { createWorld } from '../js/world.js';

const audio = { jump() {}, land() {} };
const idle = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false };

test('holding UP on a ladder climbs and detaches onto the upper ledge', () => {
  const world = createWorld(1);
  const ladder = world.ladders[0];
  const player = new Player(ladder.x - 13, world.floorY);
  player.update(0.4, { ...idle, up: true }, world, audio);
  assert.ok(player.climbing);
  assert.ok(player.y < world.floorY - player.h);
  player.update(2, { ...idle, up: true }, world, audio);
  assert.equal(player.climbing, null);
  assert.equal(player.grounded, true);
  assert.equal(player.y + player.h, ladder.topY);
});

test('holding DOWN on a ladder descends toward the floor', () => {
  const world = createWorld(1);
  const ladder = world.ladders[0];
  const player = new Player(ladder.x - 13, world.floorY);
  player.climbing = ladder;
  player.y = ladder.topY - player.h;
  player.grounded = false;
  player.update(0.35, { ...idle, down: true }, world, audio);
  assert.ok(player.y > ladder.topY - player.h);
  assert.ok(player.climbing);
});

test('DOWN crouches on flat ground and restores standing height after release', () => {
  const world = createWorld(1);
  const player = new Player(100, world.floorY);
  player.update(1 / 60, { ...idle, down: true }, world, audio);
  assert.ok(player.h < player.standingHeight);
  player.update(1 / 60, idle, world, audio);
  assert.equal(player.h, player.standingHeight);
});


test('RIGHT and JUMP can be held together without losing either action', () => {
  const world = createWorld(1);
  const player = new Player(100, world.floorY);
  player.update(1 / 60, { ...idle, right: true, jump: true, jumpPressed: true }, world, audio);
  assert.ok(player.vx > 0);
  assert.ok(player.vy < 0);
});

test('UP jumps when the player is not standing beside a ladder', () => {
  const world = createWorld(1);
  const player = new Player(100, world.floorY);
  player.update(1 / 60, { ...idle, up: true, upPressed: true }, world, audio);
  assert.ok(player.vy < 0, 'UP should initiate an upward jump away from ladders');
});
