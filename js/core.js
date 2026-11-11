(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  SW.Config = {
    GRAVITY: 980,
    PLAYER_SPEED: 215,
    PLAYER_JUMP: 430,
    MAX_DT: 0.033,
    TOTAL_CHAPTERS: 40,
    CHAPTER_LENGTH: 2800
  };

  SW.Math = {
    clamp: function(v, min, max) { return Math.max(min, Math.min(max, v)); },
    lerp: function(a, b, t) { return a + (b - a) * t; },
    dist: function(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
    aabb: function(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    },
    circleRect: function(cx, cy, r, rx, ry, rw, rh) {
      const nx = Math.max(rx, Math.min(cx, rx + rw));
      const ny = Math.max(ry, Math.min(cy, ry + rh));
      return ((cx - nx) * (cx - nx) + (cy - ny) * (cy - ny)) <= r * r;
    },
    seededRandom: function(seed) {
      let s = seed >>> 0;
      return function() {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    solveTwoJointIK: function(rx, ry, tx, ty, L1, L2, flipKnee) {
      const dx = tx - rx;
      const dy = ty - ry;
      const d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, Math.hypot(dx, dy)));
      const baseAngle = Math.atan2(dy, dx);
      const cosAngle1 = SW.Math.clamp((d * d + L1 * L1 - L2 * L2) / (2 * d * L1), -1, 1);
      const angle1 = Math.acos(cosAngle1);
      const jointAngle = baseAngle + (flipKnee ? -angle1 : angle1);
      return {
        jx: rx + Math.cos(jointAngle) * L1,
        jy: ry + Math.sin(jointAngle) * L1,
        ex: rx + (dx / (Math.hypot(dx, dy) || 1)) * d,
        ey: ry + (dy / (Math.hypot(dx, dy) || 1)) * d
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SW;
  }
})(typeof window !== 'undefined' ? window : globalThis);
