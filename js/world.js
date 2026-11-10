export const WORLD_NAMES = [
  'THE FORGOTTEN FOREST','THE SILENT VILLAGE','THE DEAD SWAMP','THE UNDERGROUND',
  'THE IRON FACTORY','THE DARK LABORATORY','THE LOST CITY','THE FINAL MYSTERY'
];

export function levelWorld(level = 1) {
  const n = Math.max(1, Math.min(100, Math.floor(level)));
  const worldIndex = Math.min(7, Math.floor((n - 1) / 12));
  const difficulty = 1 + (n - 1) / 99;
  const floorY = 460;
  const width = 4300 + n * 34;
  const rng = (seed) => { let x = seed | 0; return () => { x = (x * 1664525 + 1013904223) | 0; return (x >>> 0) / 4294967296; }; };
  const random = rng(n * 7919 + 31);
  const platforms = [];
  const pits = [];
  const pitCount = 1 + Math.floor(difficulty * 2);
  for (let i = 0; i < pitCount; i++) {
    const px = 1250 + i * ((width - 2100) / pitCount) + random() * 80;
    pits.push({ x: px, y: floorY, w: 78 + difficulty * 24, h: 140 });
  }
  let groundCursor = 0;
  for (const pit of pits) {
    platforms.push({ x: groundCursor, y: floorY, w: Math.max(0, pit.x - groundCursor), h: 140, kind: 'ground' });
    groundCursor = pit.x + pit.w;
  }
  platforms.push({ x: groundCursor, y: floorY, w: width - groundCursor, h: 140, kind: 'ground' });
  const spikes = [];
  const spiders = [];
  const branches = [];
  const checkpoints = [];
  const hazardCount = 7 + Math.floor(difficulty * 9);
  for (let i = 0; i < hazardCount; i++) {
    const x = 430 + i * ((width - 950) / hazardCount) + random() * 120;
    const type = (i + n + Math.floor(random() * 3)) % 4;
    if (type === 0 || type === 1) {
      spikes.push({ x, y: floorY - 20, w: 70 + random() * (75 + difficulty * 25), h: 20 });
    } else if (type === 2) {
      const span = 120 + random() * 65;
      spiders.push({ x, y: floorY - 35, w: 58, h: 35, minX: x - span / 2, maxX: x + span / 2 + 58, vx: (random() > .5 ? 1 : -1) * (55 + difficulty * 42), phase: random() * 6, alert: 0 });
    } else {
      const branchY = 160 + random() * 75;
      branches.push({ x, y: branchY, baseY: branchY, triggered: false, landed: false, timer: 0, warning: 0, angle: -.08 });
    }
    if (i > 0 && i % 4 === 3) checkpoints.push(Math.floor(x + 160));
  }
  // Raised stepping stones and narrow safe shelves force deliberate jumps.
  for (let i = 0; i < 5 + Math.floor(difficulty * 3); i++) {
    const x = 650 + i * ((width - 1200) / (5 + Math.floor(difficulty * 3)));
    if ((i + n) % 2 === 0) platforms.push({ x, y: 365 - (i % 3) * 32, w: 95 - Math.min(22, difficulty * 8), h: 16, kind: 'stone' });
  }
  const crate = { x: 300, y: floorY - 48, w: 48, h: 48, vx: 0, vy: 0 };
  const plate = { x: 650, y: floorY - 7, w: 78, h: 7, active: false };
  const gate = { x: 790, y: floorY - 126, w: 34, h: 126, open: false };
  const world = {
    level: n, worldIndex, worldName: WORLD_NAMES[worldIndex], difficulty, width, height: 560, floorY,
    platforms, crate, spikes, spiders, branches, pits,
    spider: spiders[0] || { x: width + 500, y: floorY - 35, w: 58, h: 35, minX: width + 500, maxX: width + 600, vx: 0, phase: 0, alert: 0 },
    plate, gate, water: { x: width * .53, y: 435, w: 180 + difficulty * 35, h: 90 },
    checkpoints: [350, ...checkpoints, width - 900], exit: { x: width - 100, y: floorY - 92, w: 32, h: 92 },
    time: 0, particles: Array.from({ length: 100 }, (_, i) => ({ x: (i * 173) % width, y: 50 + ((i * 97) % 390), speed: 7 + (i % 5) * 3, size: .5 + (i % 4) * .35, phase: i * .71 }))
  };
  world.platforms.push({ x: crate.x, y: crate.y, w: crate.w, h: crate.h, kind: 'crate' });
  world.platforms.push({ x: gate.x, y: gate.y, w: gate.w, h: gate.h, kind: 'gate' });
  return world;
}

export function createWorld(level = 1) { return levelWorld(level); }

export function updateWorld(world, dt, player) {
  world.time += dt;
  for (const spider of world.spiders) {
    spider.phase += dt * 8; spider.x += spider.vx * dt;
    if (spider.x < spider.minX || spider.x + spider.w > spider.maxX) spider.vx *= -1;
    spider.x = Math.max(spider.minX, Math.min(spider.x, spider.maxX - spider.w));
    spider.alert = Math.abs((player.x + player.w / 2) - (spider.x + spider.w / 2)) < 150 ? 1 : 0;
  }
  for (const branch of world.branches) {
    if (!branch.triggered && Math.abs(player.x - branch.x) < 90) { branch.triggered = true; branch.warning = .75; }
    else if (branch.triggered && !branch.landed && branch.warning > 0) branch.warning = Math.max(0, branch.warning - dt);
    else if (branch.triggered && !branch.landed) {
      branch.y = Math.min(world.floorY - 22, branch.y + (520 + world.difficulty * 100) * dt);
      if (branch.y >= world.floorY - 22) branch.landed = true;
    } else if (branch.landed) {
      branch.timer += dt;
      if (branch.timer >= 2.5) { branch.y = branch.baseY; branch.timer = 0; branch.triggered = false; branch.landed = false; }
    }
  }
  const branch = world.branch = world.branches[0] || { x: -500, y: 200, baseY: 200, triggered: false, landed: false, timer: 0, angle: 0 };
  for (const p of world.particles) { p.x -= p.speed * dt; if (p.x < 0) p.x = world.width; }
  const crate = world.crate; crate.vx *= Math.pow(.04, dt); crate.x += crate.vx * dt; crate.x = Math.max(220, Math.min(crate.x, world.plate.x + 12)); crate.y = world.floorY - crate.h;
  const cp = world.platforms.find(p => p.kind === 'crate'); if (cp) { cp.x = crate.x; cp.y = crate.y; }
  world.plate.active = crate.x + crate.w > world.plate.x + 8 && crate.x < world.plate.x + world.plate.w - 8;
  world.gate.open = world.plate.active;
  const gatePlatform = world.platforms.find(p => p.kind === 'gate');
  if (world.gate.open && gatePlatform) world.platforms.splice(world.platforms.indexOf(gatePlatform), 1);
  else if (!world.gate.open && !gatePlatform) world.platforms.push({ x: world.gate.x, y: world.gate.y, w: world.gate.w, h: world.gate.h, kind: 'gate' });
}
