export function createWorld() {
  const floorY = 460;
  const crate = { x: 1005, y: floorY - 48, w: 48, h: 48, vx: 0, vy: 0 };
  const world = {
    width: 1960,
    height: 560,
    floorY,
    platforms: [
      { x: 0, y: floorY, w: 1605, h: 120, kind: 'ground' },
      { x: 1765, y: floorY, w: 195, h: 120, kind: 'ground' },
      { x: 1425, y: 375, w: 85, h: 18, kind: 'stone' },
      { x: 1800, y: 395, w: 90, h: 16, kind: 'stone' }
    ],
    crate,
    spikes: [{ x: 620, y: floorY - 20, w: 118, h: 20 }],
    spider: { x: 390, y: floorY - 34, w: 58, h: 34, minX: 360, maxX: 530, vx: 56, phase: 0, alert: 0 },
    plate: { x: 1220, y: floorY - 7, w: 78, h: 7, active: false },
    gate: { x: 1400, y: floorY - 126, w: 34, h: 126, open: false },
    water: { x: 1605, y: 410, w: 160, h: 90 },
    checkpoints: [850],
    exit: { x: 1888, y: floorY - 92, w: 32, h: 92 },
    time: 0,
    branch: { x: 1080, y: 212, baseY: 212, triggered: false, landed: false, timer: 0, angle: -0.08 },
    particles: Array.from({ length: 60 }, (_, i) => ({
      x: (i * 173) % 1960,
      y: 80 + ((i * 97) % 350),
      speed: 7 + (i % 5) * 3,
      size: 0.5 + (i % 4) * 0.35,
      phase: i * 0.71
    }))
  };
  world.platforms.push({ x: crate.x, y: crate.y, w: crate.w, h: crate.h, kind: 'crate' });
  return world;
}

export function updateWorld(world, dt, player) {
  world.time += dt;
  const spider = world.spider;
  spider.phase += dt * 8;
  spider.x += spider.vx * dt;
  if (spider.x < spider.minX || spider.x + spider.w > spider.maxX) spider.vx *= -1;
  spider.x = Math.max(spider.minX, Math.min(spider.x, spider.maxX - spider.w));
  spider.alert = Math.abs((player.x + player.w / 2) - (spider.x + spider.w / 2)) < 150 ? 1 : 0;

  // The branch is dangerous only while falling. Once it lands, it stays
  // harmless on the ground briefly, then resets for the next attempt.
  const branch = world.branch;
  const branchLandingY = world.floorY - 22;
  if (!branch.triggered && player.x > 1000 && player.x < 1150) {
    branch.triggered = true;
    branch.landed = false;
    branch.timer = 0;
  }
  if (branch.triggered && !branch.landed) {
    branch.y = Math.min(branchLandingY, branch.y + 520 * dt);
    if (branch.y >= branchLandingY) branch.landed = true;
  } else if (branch.triggered && branch.landed) {
    branch.timer += dt;
    if (branch.timer >= 2.2) {
      branch.y = branch.baseY;
      branch.timer = 0;
      branch.triggered = false;
      branch.landed = false;
    }
  }

  for (const p of world.particles) {
    p.x -= p.speed * dt;
    p.y += Math.sin(world.time * 0.7 + p.phase) * 2 * dt;
    if (p.x < 0) p.x = world.width;
  }

  // Keep the crate on the forest floor and let it settle naturally.
  const crate = world.crate;
  crate.vx *= Math.pow(0.04, dt);
  crate.x += crate.vx * dt;
  crate.x = Math.max(760, Math.min(crate.x, 1360 - crate.w));
  crate.y = world.floorY - crate.h;
  const platform = world.platforms.find(p => p.kind === 'crate');
  if (platform) {
    platform.x = crate.x;
    platform.y = crate.y;
  }

  world.plate.active = crate.x + crate.w > world.plate.x + 8 && crate.x < world.plate.x + world.plate.w - 8;
  world.gate.open = world.plate.active;
  if (world.gate.open) {
    const gatePlatform = world.platforms.find(p => p.kind === 'gate');
    if (gatePlatform) world.platforms.splice(world.platforms.indexOf(gatePlatform), 1);
  } else if (!world.platforms.some(p => p.kind === 'gate')) {
    world.platforms.push({ x: world.gate.x, y: world.gate.y, w: world.gate.w, h: world.gate.h, kind: 'gate' });
  }
}
