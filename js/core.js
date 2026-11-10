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
  const checkpoint = Number.isFinite(data.checkpoint) ? clamp(data.checkpoint, 1, 100) : 1;
  return {
    version: 2,
    checkpoint,
    unlockedLevel: clamp(Number(data.unlockedLevel) || checkpoint, 1, 100),
    bestProgress: clamp(Number(data.bestProgress) || 0, 0, 100),
    soundOn: data.soundOn !== false,
    completed: data.completed === true
  };
}
