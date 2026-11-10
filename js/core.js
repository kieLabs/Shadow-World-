export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

export function makeSaveData(data = {}) {
  const checkpoint = Number.isFinite(data.checkpoint) ? clamp(data.checkpoint, 0, 1800) : 80;
  return {
    version: 1,
    checkpoint,
    bestProgress: clamp(Number(data.bestProgress) || 0, 0, 100),
    soundOn: data.soundOn !== false,
    completed: data.completed === true
  };
}
