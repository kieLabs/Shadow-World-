import test from 'node:test';
import assert from 'node:assert/strict';
import { InputController } from '../js/input.js';

class FakeTarget {
  constructor() { this.handlers = new Map(); this.dataset = {}; }
  addEventListener(type, handler) {
    const list = this.handlers.get(type) || [];
    list.push(handler); this.handlers.set(type, list);
  }
  dispatch(type, props = {}) {
    const event = { type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props };
    for (const handler of this.handlers.get(type) || []) handler(event);
    return event;
  }
  setPointerCapture() {}
}

function setup() {
  const win = new FakeTarget();
  const buttons = ['left', 'right', 'up', 'down', 'jump', 'interact'].map(control => {
    const button = new FakeTarget(); button.dataset.control = control; return button;
  });
  const controller = new InputController({ windowTarget: win, buttons, onAction() {} });
  return { win, buttons, controller };
}

test('touch buttons press and release the matching control', () => {
  const { win, buttons, controller } = setup();
  const left = buttons.find(button => button.dataset.control === 'left');
  left.dispatch('pointerdown', { pointerId: 1 });
  assert.equal(controller.read().left, true);
  win.dispatch('pointerup', { pointerId: 1 });
  assert.equal(controller.read().left, false);
});

test('independent simultaneous touch pointers preserve both actions', () => {
  const { win, buttons, controller } = setup();
  const right = buttons.find(button => button.dataset.control === 'right');
  const jump = buttons.find(button => button.dataset.control === 'jump');
  right.dispatch('pointerdown', { pointerId: 2 });
  jump.dispatch('pointerdown', { pointerId: 3 });
  const held = controller.read();
  assert.equal(held.right, true);
  assert.equal(held.jump, true);
  assert.equal(held.jumpPressed, true);
  win.dispatch('pointerup', { pointerId: 3 });
  const afterJumpRelease = controller.read();
  assert.equal(afterJumpRelease.right, true);
  assert.equal(afterJumpRelease.jump, false);
});

test('UP produces one jump press when no ladder is being used', () => {
  const { win, buttons, controller } = setup();
  const up = buttons.find(button => button.dataset.control === 'up');
  up.dispatch('pointerdown', { pointerId: 4 });
  assert.equal(controller.read().upPressed, true);
  assert.equal(controller.read().upPressed, false);
});

test('blur clears all held touch controls', () => {
  const { win, buttons, controller } = setup();
  buttons[0].dispatch('pointerdown', { pointerId: 5 });
  win.dispatch('blur');
  assert.equal(controller.read().left, false);
});

test('DOWN and INTERACT buttons register hold and a one-shot interaction press', () => {
  const { win, buttons, controller } = setup();
  const down = buttons.find(button => button.dataset.control === 'down');
  const interact = buttons.find(button => button.dataset.control === 'interact');
  down.dispatch('pointerdown', { pointerId: 6 });
  interact.dispatch('pointerdown', { pointerId: 7 });
  const pressed = controller.read();
  assert.equal(pressed.down, true);
  assert.equal(pressed.interact, true);
  assert.equal(pressed.interactPressed, true);
  win.dispatch('pointerup', { pointerId: 6 });
  win.dispatch('pointerup', { pointerId: 7 });
  const released = controller.read();
  assert.equal(released.down, false);
  assert.equal(released.interact, false);
});
