/** Reliable keyboard + multi-touch input for desktop and mobile browsers. */
export class InputController {
  constructor({
    windowTarget = globalThis.window,
    buttons = globalThis.document?.querySelectorAll?.('[data-control]') || [],
    onAction = () => {}
  } = {}) {
    this.windowTarget = windowTarget;
    this.keys = new Set();
    this.touch = this.emptyTouchState();
    this.pointerControls = new Map();
    this.jumpPressed = false;
    this.upPressed = false;
    this.interactPressed = false;
    this.onAction = onAction;

    windowTarget?.addEventListener('keydown', event => {
      const key = String(event.key || '').toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault?.();
      }
      const wasDown = this.keys.has(key);
      if (!wasDown && key === ' ') this.jumpPressed = true;
      if (!wasDown && ['arrowup', 'w'].includes(key)) this.upPressed = true;
      if (!wasDown && key === 'e') this.interactPressed = true;
      this.keys.add(key);
    }, { passive: false });

    windowTarget?.addEventListener('keyup', event => this.keys.delete(String(event.key || '').toLowerCase()));
    windowTarget?.addEventListener('blur', () => this.clearHeld());

    const releasePointer = event => this.releasePointer(event.pointerId);
    windowTarget?.addEventListener('pointerup', releasePointer);
    windowTarget?.addEventListener('pointercancel', releasePointer);
    windowTarget?.addEventListener('lostpointercapture', releasePointer);

    for (const button of buttons) {
      const control = button?.dataset?.control;
      if (!Object.hasOwn(this.touch, control)) continue;
      button.addEventListener('pointerdown', event => {
        event.preventDefault?.();
        if (this.pointerControls.has(event.pointerId)) return;
        this.pointerControls.set(event.pointerId, control);
        this.refreshTouchState();
        if (control === 'jump') this.jumpPressed = true;
        if (control === 'up') this.upPressed = true;
        if (control === 'interact') this.interactPressed = true;
        try { button.setPointerCapture?.(event.pointerId); } catch (_) { /* window release remains as fallback */ }
        this.onAction();
      }, { passive: false });
      button.addEventListener('pointerup', releasePointer);
      button.addEventListener('pointercancel', releasePointer);
      button.addEventListener('lostpointercapture', releasePointer);
      button.addEventListener('contextmenu', event => event.preventDefault?.());
      button.addEventListener('dragstart', event => event.preventDefault?.());
    }
  }

  emptyTouchState() {
    return { left: false, right: false, up: false, down: false, jump: false, interact: false };
  }

  refreshTouchState() {
    this.touch = this.emptyTouchState();
    for (const control of this.pointerControls.values()) this.touch[control] = true;
  }

  releasePointer(pointerId) {
    if (!this.pointerControls.has(pointerId)) return;
    this.pointerControls.delete(pointerId);
    this.refreshTouchState();
  }

  clearHeld() {
    this.keys.clear();
    this.pointerControls.clear();
    this.touch = this.emptyTouchState();
  }

  read() {
    const left = this.keys.has('arrowleft') || this.keys.has('a') || this.touch.left;
    const right = this.keys.has('arrowright') || this.keys.has('d') || this.touch.right;
    const up = this.keys.has('arrowup') || this.keys.has('w') || this.touch.up;
    const down = this.keys.has('arrowdown') || this.keys.has('s') || this.touch.down;
    const jump = this.keys.has(' ') || this.touch.jump;
    const interact = this.keys.has('e') || this.touch.interact;
    const result = {
      left, right, up, down, jump, interact,
      jumpPressed: this.jumpPressed,
      upPressed: this.upPressed,
      interactPressed: this.interactPressed
    };
    this.jumpPressed = false;
    this.upPressed = false;
    this.interactPressed = false;
    return result;
  }
}
