(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  SW.Input = {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    action: false,
    keys: {},
    touchButtons: { left: false, right: false, jump: false, action: false },
    gestureTouch: { active: false, id: null, startX: 0, startY: 0, moveLeft: false, moveRight: false },

    init: function() {
      if (typeof document === 'undefined') return;
      const self = this;

      global.addEventListener('keydown', function(e) {
        self.keys[e.code] = true;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          if (!self.jump) self.jumpJustPressed = true;
        }
        self.syncState();
      });

      global.addEventListener('keyup', function(e) {
        self.keys[e.code] = false;
        self.syncState();
      });

      const bindPad = function(id, prop) {
        const el = document.getElementById(id);
        if (!el) return;
        const setPad = function(val, ev) {
          if (ev && ev.cancelable) ev.preventDefault();
          SW.Audio.resume();
          if (prop === 'jump' && val && !self.touchButtons.jump) {
            self.jumpJustPressed = true;
          }
          self.touchButtons[prop] = val;
          el.classList.toggle('pressed', val);
          self.syncState();
        };
        el.addEventListener('pointerdown', function(ev) { setPad(true, ev); });
        el.addEventListener('pointerup', function(ev) { setPad(false, ev); });
        el.addEventListener('pointerleave', function(ev) { setPad(false, ev); });
        el.addEventListener('pointercancel', function(ev) { setPad(false, ev); });
      };

      bindPad('pad-left', 'left');
      bindPad('pad-right', 'right');
      bindPad('pad-jump', 'jump');
      bindPad('pad-action', 'action');

      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.addEventListener('pointerdown', function(ev) {
          SW.Audio.resume();
          if (!SW.Save.state.gestureEnabled) return;
          self.gestureTouch.active = true;
          self.gestureTouch.id = ev.pointerId;
          self.gestureTouch.startX = ev.clientX;
          self.gestureTouch.startY = ev.clientY;
        });
        canvas.addEventListener('pointermove', function(ev) {
          if (!self.gestureTouch.active || ev.pointerId !== self.gestureTouch.id) return;
          const dx = ev.clientX - self.gestureTouch.startX;
          const dy = ev.clientY - self.gestureTouch.startY;
          self.gestureTouch.moveLeft = dx < -24;
          self.gestureTouch.moveRight = dx > 24;
          if (dy < -42 && !self.jump) {
            self.jumpJustPressed = true;
            self.gestureTouch.startY = ev.clientY;
          }
          self.syncState();
        });
        const endGesture = function(ev) {
          if (ev.pointerId === self.gestureTouch.id) {
            self.gestureTouch.active = false;
            self.gestureTouch.moveLeft = false;
            self.gestureTouch.moveRight = false;
            self.syncState();
          }
        };
        canvas.addEventListener('pointerup', endGesture);
        canvas.addEventListener('pointercancel', endGesture);
      }
    },

    syncState: function() {
      this.left = !!(this.keys.ArrowLeft || this.keys.KeyA || this.touchButtons.left || this.gestureTouch.moveLeft);
      this.right = !!(this.keys.ArrowRight || this.keys.KeyD || this.touchButtons.right || this.gestureTouch.moveRight);
      this.jump = !!(this.keys.Space || this.keys.ArrowUp || this.keys.KeyW || this.touchButtons.jump);
      this.action = !!(this.keys.KeyE || this.keys.KeyX || this.keys.ShiftLeft || this.keys.ShiftRight || this.keys.ControlLeft || this.touchButtons.action);
    },

    consumeJump: function() {
      const jp = this.jumpJustPressed;
      this.jumpJustPressed = false;
      return jp;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
