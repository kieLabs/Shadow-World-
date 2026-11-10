export const WORLD_NAMES = [
  'HOLLOWWOOD: THE FIRST SILENCE',
  'DROWNED HAMLET: BELOW THE BELLS',
  'MIRE OF TEETH: THE LIVING BOG',
  'THE UNDERDEEP: NO WAY BACK',
  'IRONWORKS: THE HUNGERING MACHINE',
  'BLACKGLASS LAB: SUBJECT ZERO',
  'THE SUNKEN CROWN: CITY OF ASH',
  'THE LAST VEIL: THE HEART BELOW'
];

export const CHAPTER_TITLES = [
  'The Last Footprint','Where the Branches Listen','A House Without Windows','The Hollow Bell','The Thing in the Roots',
  'The Drowned Road','The Village That Sank','A Light Underwater','The Bell Keeper','No Air Left',
  'The Mire Opens','Teeth Beneath the Water','The Lantern Swarm','A Nest of Shadows','The Bog Remembers',
  'Stairs into Nothing','The Bone Tunnels','A Door in the Deep','The Buried Choir','The Long Descent',
  'The Furnace Breathes','The Chain Room','The Great Press','A Machine That Dreams','The Last Shift',
  'Cold Room 09','The Glass Children','The Red Experiment','The Patient in the Wall','Containment Breach',
  'The City Below','A Crown of Rust','The Empty Parade','The Flooded Cathedral','The King Is Missing',
  'The Red Horizon','The Black Stair','The Heart Chamber','The Final Signal','What Followed You Home'
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function seededRandom(seed) {
  let value = seed | 0;
  return () => {
    value = (value * 1664525 + 1013904223) | 0;
    return (value >>> 0) / 4294967296;
  };
}

export function levelWorld(chapter = 1) {
  const n = clamp(Math.floor(Number(chapter) || 1), 1, 40);
  const worldIndex = Math.floor((n - 1) / 5);
  const chapterInRegion = (n - 1) % 5;
  const difficulty = 1 + (n - 1) / 39;
  const floorY = 460;
  const width = 9800 + n * 105;
  const random = seededRandom(n * 7919 + 31);
  const platforms = [];
  const pits = [];
  const groundSegments = [];
  const pitCount = 5 + Math.floor(difficulty * 2);
  const segment = (width - 2100) / pitCount;
  for (let i = 0; i < pitCount; i++) {
    const px = 1050 + i * segment + random() * 100;
    const pitWidth = 82 + random() * (36 + difficulty * 12);
    pits.push({ x: px, y: floorY, w: pitWidth, h: 160, type: i % 3 });
  }
  let groundCursor = 0;
  for (const pit of pits) {
    if (pit.x > groundCursor) {
      const ground = { x: groundCursor, y: floorY, w: pit.x - groundCursor, h: 180, kind: 'ground' };
      platforms.push(ground); groundSegments.push(ground);
    }
    groundCursor = pit.x + pit.w;
  }
  if (groundCursor < width) {
    const ground = { x: groundCursor, y: floorY, w: width - groundCursor, h: 180, kind: 'ground' };
    platforms.push(ground); groundSegments.push(ground);
  }

  const ladders = [];
  const switches = [];
  const ladderCount = 4 + Math.floor((chapterInRegion + 1) / 2);
  for (let i = 0; i < ladderCount; i++) {
    const x = 1450 + i * ((width - 3000) / ladderCount) + random() * 100;
    const topY = 275 + Math.floor(random() * 3) * 24;
    const platform = { x: x - 74, y: topY, w: 260 + random() * 45, h: 18, kind: 'ledge' };
    platforms.push(platform);
    ladders.push({ x, topY, bottomY: floorY, w: 34, id: i });
    switches.push({ x: x + 118, y: topY - 24, w: 24, h: 34, activated: false, id: i });
  }

  const spikes = [];
  const spiders = [];
  const branches = [];
  const saws = [];
  const tunnels = [];
  const stalkers = [];
  const hazardCount = 16 + Math.floor(difficulty * 15);
  for (let i = 0; i < hazardCount; i++) {
    let x = 930 + i * ((width - 1320) / hazardCount) + random() * 125;
    // Keep the ladder approaches clear so vertical routes remain reachable.
    for (let attempt = 0; attempt < 8 && ladders.some(ladder => Math.abs(x - ladder.x) < 145); attempt++) x += (attempt % 2 === 0 ? 1 : -1) * (90 + attempt * 18);
    x = clamp(x, 900, width - 260);
    const type = (i + n + Math.floor(random() * 5)) % 6;
    if (type <= 1) {
      spikes.push({ x, y: floorY - 20, w: 55 + random() * (45 + difficulty * 16), h: 20 });
    } else if (type === 2) {
      const span = 155 + random() * 100;
      spiders.push({ x, y: floorY - 35, w: 58, h: 35, minX: x - span / 2, maxX: x + span / 2 + 58, vx: (random() > .5 ? 1 : -1) * (58 + difficulty * 54), phase: random() * 6, alert: 0 });
    } else if (type === 3) {
      const branchY = 130 + random() * 105;
      branches.push({ x, y: branchY, baseY: branchY, triggered: false, landed: false, timer: 0, warning: 0, angle: -.08 });
    } else if (type === 4) {
      const span = 85 + random() * 100;
      saws.push({ x, y: floorY - 30, w: 54, h: 30, minX: x - span / 2, maxX: x + span / 2, speed: 70 + difficulty * 65, dir: random() > .5 ? 1 : -1, angle: random() * 6 });
    } else {
      tunnels.push({ x, y: floorY - 61, w: 95 + random() * 75, h: 22 });
    }
  }

  const stalkerCount = 2 + Math.floor(difficulty * 2);
  for (let i = 0; i < stalkerCount; i++) {
    let x = 2350 + i * ((width - 4200) / stalkerCount) + random() * 160;
    if (pits.some(pit => x > pit.x - 65 && x < pit.x + pit.w + 65)) x += 180;
    x = clamp(x, 1850, width - 900);
    stalkers.push({ x, y: floorY - 68, w: 88, h: 68, minX: x - 185, maxX: x + 205, speed: 78 + difficulty * 48, dir: random() > .5 ? 1 : -1, phase: random() * 6, alert: 0 });
  }

  const checkpoints = [150];
  for (let x = 1600; x < width - 800; x += 1750 + random() * 240) checkpoints.push(Math.floor(x));
  const crate = { x: 300, y: floorY - 48, w: 48, h: 48, vx: 0, vy: 0 };
  const plate = { x: 690, y: floorY - 7, w: 82, h: 7, active: false };
  const gate = { x: width - 178, y: floorY - 142, w: 38, h: 142, open: false };
  const water = { x: width * (0.38 + (chapterInRegion % 3) * .08), y: 435, w: 300 + difficulty * 95, h: 110 };
  const world = {
    level: n, chapter: n, chapterTitle: CHAPTER_TITLES[n - 1], worldIndex, chapterInRegion,
    worldName: WORLD_NAMES[worldIndex], difficulty, width, height: 560, floorY,
    platforms, groundSegments, ladders, switches, spikes, spiders, stalkers, branches, saws, tunnels, pits,
    plate, crate, gate, water,
    checkpoints: [...checkpoints, width - 850],
    exit: { x: width - 105, y: floorY - 102, w: 38, h: 102 },
    time: 0,
    particles: Array.from({ length: 150 }, (_, i) => ({ x: (i * 173) % width, y: 35 + ((i * 97) % 405), speed: 5 + (i % 7) * 3, size: .5 + (i % 5) * .35, phase: i * .71 }))
  };
  world.platforms.push({ x: crate.x, y: crate.y, w: crate.w, h: crate.h, kind: 'crate' });
  world.platforms.push({ x: gate.x, y: gate.y, w: gate.w, h: gate.h, kind: 'gate' });
  return world;
}

export function createWorld(chapter = 1) { return levelWorld(chapter); }

export function updateWorld(world, dt, player) {
  world.time += dt;
  for (const spider of world.spiders) {
    spider.phase += dt * 8;
    spider.x += spider.vx * dt;
    if (spider.x < spider.minX || spider.x + spider.w > spider.maxX) spider.vx *= -1;
    spider.x = clamp(spider.x, spider.minX, spider.maxX - spider.w);
    spider.alert = Math.abs((player.x + player.w / 2) - (spider.x + spider.w / 2)) < 180 ? 1 : 0;
  }
  for (const stalker of world.stalkers) {
    stalker.phase += dt * 6;
    const playerCenter = player.x + player.w / 2;
    const stalkerCenter = stalker.x + stalker.w / 2;
    const distance = playerCenter - stalkerCenter;
    stalker.alert = Math.abs(distance) < 470 ? 1 : 0;
    if (stalker.alert) {
      stalker.x += Math.sign(distance) * stalker.speed * 1.35 * dt;
      stalker.dir = Math.sign(distance) || stalker.dir;
    } else {
      stalker.x += stalker.speed * .48 * stalker.dir * dt;
      if (stalker.x < stalker.minX || stalker.x + stalker.w > stalker.maxX) stalker.dir *= -1;
      stalker.x = clamp(stalker.x, stalker.minX, stalker.maxX - stalker.w);
    }
  }
  for (const saw of world.saws) {
    saw.angle += dt * 9;
    saw.x += saw.speed * saw.dir * dt;
    if (saw.x < saw.minX || saw.x + saw.w > saw.maxX) saw.dir *= -1;
    saw.x = clamp(saw.x, saw.minX, saw.maxX - saw.w);
  }
  for (const branch of world.branches) {
    if (!branch.triggered && Math.abs(player.x + player.w / 2 - branch.x) < 95) {
      branch.triggered = true; branch.warning = 1.05;
    } else if (branch.triggered && !branch.landed && branch.warning > 0) {
      branch.warning = Math.max(0, branch.warning - dt);
    } else if (branch.triggered && !branch.landed) {
      branch.y = Math.min(world.floorY - 22, branch.y + (520 + world.difficulty * 115) * dt);
      if (branch.y >= world.floorY - 22) branch.landed = true;
    } else if (branch.landed) {
      branch.timer += dt;
      if (branch.timer >= 3.2) {
        branch.y = branch.baseY; branch.timer = 0; branch.triggered = false; branch.landed = false;
      }
    }
  }
  for (const p of world.particles) {
    p.x -= p.speed * dt;
    if (p.x < 0) p.x = world.width;
  }

  const crate = world.crate;
  crate.vx *= Math.pow(.04, dt);
  crate.x += crate.vx * dt;
  crate.x = clamp(crate.x, 220, world.plate.x + 15);
  crate.y = world.floorY - crate.h;
  const cratePlatform = world.platforms.find(p => p.kind === 'crate');
  if (cratePlatform) { cratePlatform.x = crate.x; cratePlatform.y = crate.y; }
  world.plate.active = crate.x + crate.w > world.plate.x + 8 && crate.x < world.plate.x + world.plate.w - 8;
  world.gate.open = world.plate.active && world.switches.every(item => item.activated);
  const gatePlatform = world.platforms.find(p => p.kind === 'gate');
  if (world.gate.open && gatePlatform) world.platforms.splice(world.platforms.indexOf(gatePlatform), 1);
  else if (!world.gate.open && !gatePlatform) world.platforms.push({ x: world.gate.x, y: world.gate.y, w: world.gate.w, h: world.gate.h, kind: 'gate' });
}
