const W = 960;
const H = 540;

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawTree(ctx, x, base, height, width, shade, branches = true) {
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.18, base);
  ctx.lineTo(x + width * 0.15, base);
  ctx.lineTo(x + width * 0.08, base - height * 0.72);
  ctx.lineTo(x + width * 0.42, base - height * 0.93);
  ctx.lineTo(x + width * 0.27, base - height * 0.99);
  ctx.lineTo(x - width * 0.08, base - height * 0.77);
  ctx.lineTo(x - width * 0.25, base - height);
  ctx.lineTo(x - width * 0.35, base - height * 0.78);
  ctx.lineTo(x - width * 0.12, base - height * 0.55);
  ctx.closePath();
  ctx.fill();
  if (branches) {
    ctx.strokeStyle = shade;
    ctx.lineWidth = Math.max(3, width * 0.055);
    ctx.beginPath();
    ctx.moveTo(x, base - height * 0.48);
    ctx.lineTo(x - width * 0.48, base - height * 0.68);
    ctx.moveTo(x + width * 0.02, base - height * 0.62);
    ctx.lineTo(x + width * 0.52, base - height * 0.81);
    ctx.stroke();
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cameraX = 0;
    this.lastWidth = 0;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * Math.min(window.devicePixelRatio || 1, 1.5)));
    const height = Math.max(1, Math.round(rect.height * Math.min(window.devicePixelRatio || 1, 1.5)));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render(game) {
    this.resize();
    const ctx = this.ctx;
    const sx = this.canvas.width / W;
    const sy = this.canvas.height / H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    const world = game.world;
    const player = game.player;
    const targetCamera = Math.max(0, Math.min(world.width - W, player.x + player.w / 2 - W * 0.43));
    this.cameraX += (targetCamera - this.cameraX) * Math.min(1, game.dt * 4.2);

    this.drawSky(ctx, world.time, this.cameraX, world.worldIndex);
    this.drawForest(ctx, world.time, this.cameraX, world.worldIndex);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.drawGround(ctx, world);
    this.drawWater(ctx, world);
    this.drawObjects(ctx, world);
    for (const spider of world.spiders) this.drawSpider(ctx, spider);
    if (!game.player.dead) this.drawPlayer(ctx, player);
    this.drawAtmosphereParticles(ctx, world);
    ctx.restore();
    this.drawVignette(ctx);
    if (game.toastTimer > 0 && game.toast) this.drawToast(ctx, game.toast, game.toastTimer);
  }

  drawSky(ctx, time, cameraX, biome = 0) {
    const skies = [['#080b10','#20262d','#111619'],['#09090d','#282027','#100e13'],['#071014','#173033','#071013'],['#030609','#14191d','#05080b'],['#100a08','#302019','#0d0908'],['#100308','#321018','#080509'],['#08090e','#24202a','#080a10'],['#120207','#3a0a12','#080408']];
    const palette = skies[biome] || skies[0];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, palette[0]);
    g.addColorStop(0.54, palette[1]);
    g.addColorStop(1, palette[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const moonX = 720 - cameraX * 0.045;
    const moonGlow = ctx.createRadialGradient(moonX, 125, 5, moonX, 125, 210);
    moonGlow.addColorStop(0, 'rgba(213,222,224,.20)');
    moonGlow.addColorStop(1, 'rgba(180,195,205,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 220, -90, 440, 430);
    ctx.fillStyle = 'rgba(207,218,220,.48)';
    ctx.beginPath(); ctx.arc(moonX, 125, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(8,11,16,.34)';
    ctx.beginPath(); ctx.arc(moonX + 10, 119, 28, 0, Math.PI * 2); ctx.fill();
    // A pale shaft of moonlight breaks through the canopy.
    ctx.save();
    ctx.translate(500, 120);
    ctx.rotate(0.22 + Math.sin(time * 0.1) * 0.025);
    const beam = ctx.createLinearGradient(0, 0, 0, 430);
    beam.addColorStop(0, 'rgba(202,215,218,.07)');
    beam.addColorStop(1, 'rgba(202,215,218,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(-70, 0, 150, 450);
    ctx.restore();
  }

  drawForest(ctx, time, cameraX, biome = 0) {
    // Distant ridge and layered silhouettes create parallax depth.
    ctx.fillStyle = '#171e23';
    ctx.beginPath(); ctx.moveTo(0, 365);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, 300 + Math.sin((x + cameraX * .08) * .008) * 23 + Math.sin(x * .021) * 9);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    for (let i = -2; i < 15; i++) {
      const x = i * 105 - (cameraX * 0.13 % 105);
      drawTree(ctx, x, 448, 210 + (i % 3) * 38, 88, '#131a1e', false);
    }
    for (let i = -2; i < 13; i++) {
      const x = i * 142 - (cameraX * 0.23 % 142) + 40;
      drawTree(ctx, x, 478, 260 + (i % 4) * 40, 110, '#0e1418', true);
    }
    // World-specific silhouettes make every chapter feel distinct.
    if (biome === 1 || biome === 6) {
      ctx.fillStyle = biome === 1 ? '#0c0a0e' : '#101018';
      for (let i = 0; i < 9; i++) { const x = (i * 137 - cameraX * .18 % 137); ctx.fillRect(x, 285 + (i % 3) * 20, 48, 190); ctx.fillRect(x + 8, 265 + (i % 3) * 20, 30, 24); }
    } else if (biome === 2) {
      ctx.strokeStyle = 'rgba(94,145,132,.18)'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const x = i * 145 - cameraX * .2 % 145; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 30, 90, x - 12, 190); ctx.stroke(); }
    } else if (biome === 3 || biome === 4 || biome === 5) {
      ctx.fillStyle = biome === 5 ? '#260b13' : '#0a1014'; for (let i = 0; i < 8; i++) { const x = i * 150 - cameraX * .15 % 150; ctx.fillRect(x, 185 + (i % 3) * 24, 18, 280); ctx.fillRect(x - 14, 185 + (i % 3) * 24, 46, 12); }
    } else if (biome === 7) {
      const pulse = .08 + (Math.sin(time * 1.4) + 1) * .035; const red = ctx.createRadialGradient(740, 130, 8, 740, 130, 260); red.addColorStop(0, `rgba(180,10,25,${pulse})`); red.addColorStop(1, 'rgba(180,10,25,0)'); ctx.fillStyle = red; ctx.fillRect(450, -120, 540, 500);
    }
    // Foreground branches frame the playable space.
    ctx.fillStyle = '#090e12';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(135, 0); ctx.lineTo(90, 24); ctx.lineTo(60, 73); ctx.lineTo(30, 39); ctx.lineTo(0, 52); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(820, 0); ctx.lineTo(865, 28); ctx.lineTo(915, 65); ctx.lineTo(W, 43); ctx.closePath(); ctx.fill();
    const fog = ctx.createLinearGradient(0, 320 + Math.sin(time * .2) * 8, 0, 488);
    fog.addColorStop(0, 'rgba(183,198,202,0)');
    fog.addColorStop(.48, 'rgba(176,190,194,.07)');
    fog.addColorStop(1, 'rgba(176,190,194,0)');
    ctx.fillStyle = fog; ctx.fillRect(0, 300, W, 210);
  }

  drawGround(ctx, world) {
    for (const p of world.platforms) {
      if (p.kind === 'gate') continue;
      if (p.kind === 'crate') continue;
      const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      grad.addColorStop(0, '#343b3c'); grad.addColorStop(.12, '#202729'); grad.addColorStop(1, '#0b1114');
      ctx.fillStyle = grad; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(192,201,197,.22)'; ctx.fillRect(p.x, p.y, p.w, 2);
      for (let x = p.x + 14; x < p.x + p.w; x += 64) {
        const n = Math.sin(x * 7.31) * 5;
        ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, p.y + 10); ctx.lineTo(x + n, p.y + 22 + Math.abs(n)); ctx.stroke();
      }
    }
    for (const pit of world.pits) {
      const pitGlow = ctx.createLinearGradient(0, pit.y, 0, pit.y + pit.h); pitGlow.addColorStop(0, '#020406'); pitGlow.addColorStop(1, 'rgba(90,0,10,.42)'); ctx.fillStyle = pitGlow; ctx.fillRect(pit.x, pit.y, pit.w, pit.h);
      ctx.strokeStyle = 'rgba(145,20,28,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pit.x, pit.y); ctx.lineTo(pit.x + pit.w, pit.y); ctx.stroke();
    }
    // Roots and scattered stones.
    ctx.strokeStyle = 'rgba(5,9,11,.78)'; ctx.lineWidth = 5;
    for (let x = 65; x < world.width; x += 170) {
      ctx.beginPath(); ctx.moveTo(x, world.floorY + 2); ctx.quadraticCurveTo(x + 28, world.floorY - 10, x + 52, world.floorY + 17); ctx.stroke();
    }
    for (let x = 25; x < world.width; x += 97) {
      ctx.fillStyle = 'rgba(120,132,132,.19)';
      ctx.beginPath(); ctx.ellipse(x + (x % 17), world.floorY - 5, 3 + (x % 4), 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const spike of world.spikes) {
      for (let x = spike.x; x < spike.x + spike.w; x += 19) {
        polygon(ctx, [[x, spike.y + 20], [x + 9, spike.y], [x + 19, spike.y + 20]], '#151a1d');
        ctx.strokeStyle = 'rgba(190,198,197,.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 9, spike.y + 2); ctx.lineTo(x + 11, spike.y + 13); ctx.stroke();
      }
    }
  }

  drawWater(ctx, world) {
    const w = world.water;
    const grad = ctx.createLinearGradient(0, w.y, 0, w.y + w.h);
    grad.addColorStop(0, 'rgba(183,202,207,.31)');
    grad.addColorStop(.15, 'rgba(71,94,102,.55)');
    grad.addColorStop(1, 'rgba(8,19,25,.96)');
    ctx.fillStyle = grad; ctx.fillRect(w.x, w.y, w.w, w.h + 34);
    ctx.strokeStyle = 'rgba(218,228,227,.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w.x, w.y);
    for (let x = 0; x <= w.w; x += 8) ctx.lineTo(w.x + x, w.y + Math.sin((x + world.time * 42) * .07) * 2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const x = w.x + ((i * 37 + world.time * 21) % w.w);
      ctx.strokeStyle = 'rgba(210,222,222,.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, w.y + 20 + i * 10, 8 + i * 2, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  drawObjects(ctx, world) {
    const crate = world.crate;
    ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(crate.x + crate.w / 2, crate.y + 50, 31, 5, 0, 0, Math.PI * 2); ctx.fill();
    const wood = ctx.createLinearGradient(crate.x, crate.y, crate.x + crate.w, crate.y + crate.h);
    wood.addColorStop(0, '#4b4d49'); wood.addColorStop(.5, '#252d2d'); wood.addColorStop(1, '#11191b');
    ctx.fillStyle = wood; ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.strokeStyle = 'rgba(193,196,185,.36)'; ctx.lineWidth = 2; ctx.strokeRect(crate.x + 2, crate.y + 2, crate.w - 4, crate.h - 4);
    ctx.beginPath(); ctx.moveTo(crate.x + 7, crate.y + 7); ctx.lineTo(crate.x + crate.w - 7, crate.y + crate.h - 7); ctx.moveTo(crate.x + crate.w - 7, crate.y + 7); ctx.lineTo(crate.x + 7, crate.y + crate.h - 7); ctx.stroke();

    // Pressure plate and gate.
    const plate = world.plate;
    ctx.fillStyle = plate.active ? '#b7c4bd' : '#555e5e'; ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
    ctx.fillStyle = plate.active ? 'rgba(219,231,221,.55)' : 'rgba(0,0,0,.3)'; ctx.fillRect(plate.x + 4, plate.y + 2, plate.w - 8, 2);
    const gate = world.gate;
    if (!gate.open) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(gate.x - 4, gate.y, gate.w + 8, gate.h);
      for (let x = gate.x + 3; x < gate.x + gate.w; x += 10) {
        ctx.fillStyle = '#42494a'; ctx.fillRect(x, gate.y, 4, gate.h);
        ctx.fillStyle = 'rgba(221,227,220,.18)'; ctx.fillRect(x, gate.y, 1, gate.h);
      }
      ctx.fillStyle = '#111719'; ctx.fillRect(gate.x - 3, gate.y - 5, gate.w + 6, 7);
    } else {
      ctx.fillStyle = 'rgba(214,225,220,.13)'; ctx.fillRect(gate.x, gate.y, gate.w, 3);
    }

    // Checkpoint marker.
    for (const cp of world.checkpoints) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cp + 10, world.floorY + 1, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(183,197,197,.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cp, world.floorY); ctx.lineTo(cp, world.floorY - 52); ctx.stroke();
      const glow = ctx.createRadialGradient(cp, world.floorY - 50, 2, cp, world.floorY - 50, 28);
      glow.addColorStop(0, 'rgba(226,236,227,.42)'); glow.addColorStop(1, 'rgba(226,236,227,0)');
      ctx.fillStyle = glow; ctx.fillRect(cp - 30, world.floorY - 80, 60, 60);
      ctx.fillStyle = '#c3d0c7'; ctx.beginPath(); ctx.arc(cp, world.floorY - 51, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Exit arch.
    const ex = world.exit;
    ctx.fillStyle = '#080d10';
    ctx.beginPath(); ctx.moveTo(ex.x, world.floorY); ctx.lineTo(ex.x, ex.y + 20); ctx.quadraticCurveTo(ex.x + ex.w / 2, ex.y - 14, ex.x + ex.w, ex.y + 20); ctx.lineTo(ex.x + ex.w, world.floorY); ctx.closePath(); ctx.fill();
    const exitGlow = ctx.createRadialGradient(ex.x + ex.w / 2, ex.y + 24, 2, ex.x + ex.w / 2, ex.y + 35, 70);
    exitGlow.addColorStop(0, 'rgba(202,218,215,.37)'); exitGlow.addColorStop(1, 'rgba(202,218,215,0)');
    ctx.fillStyle = exitGlow; ctx.fillRect(ex.x - 38, ex.y - 25, ex.w + 76, ex.h + 55);

    // Falling dead branches: a short warning pulse precedes each lethal drop.
    for (const branch of world.branches) {
      if (branch.triggered && branch.warning > 0) { ctx.fillStyle = `rgba(170,25,25,${.12 + Math.sin(world.time * 28) * .09})`; ctx.beginPath(); ctx.ellipse(branch.x + 45, world.floorY - 5, 64, 12, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.translate(branch.x + 45, branch.y + 8); ctx.rotate(branch.angle + (branch.y - branch.baseY) * .001);
      ctx.fillStyle = '#121a1d'; ctx.beginPath(); ctx.roundRect(-52, -8, 105, 18, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(190,197,188,.27)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-38, -4); ctx.lineTo(42, -4); ctx.stroke(); ctx.restore();
    }
  }

  drawSpider(ctx, spider) {
    const cx = spider.x + spider.w / 2;
    const cy = spider.y + 18 + Math.sin(spider.phase) * 2;
    ctx.save();
    ctx.strokeStyle = '#080b0d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1;
      const n = i % 2;
      const sway = Math.sin(spider.phase + i * 1.4) * 5;
      const kneeX = cx + side * (17 + n * 4);
      const footX = cx + side * (30 + n * 6 + sway);
      const footY = spider.y + 34 + (n ? 1 : 5);
      ctx.beginPath(); ctx.moveTo(cx + side * 8, cy); ctx.lineTo(kneeX, cy + 8 + n * 4); ctx.lineTo(footX, footY); ctx.stroke();
    }
    ctx.fillStyle = '#090d0f'; ctx.beginPath(); ctx.ellipse(cx, cy, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 18, cy - 3, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = spider.alert ? '#d6d9d1' : '#98a3a1';
    ctx.beginPath(); ctx.arc(cx - 21, cy - 5, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 14, cy - 5, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawPlayer(ctx, p) {
    const cx = p.x + p.w / 2;
    const run = Math.abs(p.vx) > 15 && p.grounded;
    const stride = run ? Math.sin(p.anim) * 10 : 0;
    const bob = run ? Math.abs(Math.sin(p.anim * 2)) * 2 : 0;
    ctx.save();
    ctx.translate(cx, p.y + p.h);
    ctx.scale(p.facing, 1);
    ctx.globalAlpha = p.invulnerable > 0 && Math.floor(p.invulnerable * 12) % 2 ? .35 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 2, 21, 5, 0, 0, Math.PI * 2); ctx.fill();
    // A very subtle cold rim separates the silhouette from the forest.
    ctx.shadowColor = 'rgba(203,215,213,.22)'; ctx.shadowBlur = 7;
    ctx.fillStyle = '#070a0c';
    // Legs
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080b0d'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-3, -21 - bob); ctx.lineTo(-5 + stride, -5); ctx.lineTo(-8 + stride, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -21 - bob); ctx.lineTo(6 - stride, -6); ctx.lineTo(9 - stride, 0); ctx.stroke();
    // Body and head
    ctx.beginPath(); ctx.moveTo(-8, -48 - bob); ctx.quadraticCurveTo(-13, -37, -8, -23); ctx.lineTo(9, -22); ctx.quadraticCurveTo(12, -38, 7, -49); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -55 - bob, 9.4, 0, Math.PI * 2); ctx.fill();
    // Neck scarf / collar detail, still within the monochrome silhouette.
    ctx.fillStyle = '#202729'; ctx.beginPath(); ctx.moveTo(-8, -47 - bob); ctx.lineTo(8, -47 - bob); ctx.lineTo(4, -42 - bob); ctx.lineTo(-6, -43 - bob); ctx.fill();
    // Arms swing naturally.
    ctx.strokeStyle = '#080b0d'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-7, -43 - bob); ctx.lineTo(-12 - stride * .45, -29); ctx.lineTo(-9 - stride * .8, -21); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -43 - bob); ctx.lineTo(12 + stride * .45, -31); ctx.lineTo(14 + stride * .8, -25); ctx.stroke();
    ctx.restore();
  }

  drawAtmosphereParticles(ctx, world) {
    for (const p of world.particles) {
      ctx.fillStyle = `rgba(204,216,211,${0.08 + (Math.sin(world.time * 1.4 + p.phase) + 1) * .055})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    // Slow drifting mist ribbons.
    for (let i = 0; i < 3; i++) {
      const y = 365 + i * 31 + Math.sin(world.time * .22 + i) * 7;
      const g = ctx.createLinearGradient(0, y, 0, y + 34);
      g.addColorStop(0, 'rgba(194,207,207,0)'); g.addColorStop(.5, 'rgba(194,207,207,.045)'); g.addColorStop(1, 'rgba(194,207,207,0)');
      ctx.fillStyle = g; ctx.fillRect(0, y, world.width, 34);
    }
  }

  drawVignette(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 170, W / 2, H / 2, 590);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(0, 0, W, 24); ctx.fillRect(0, H - 24, W, 24);
  }

  drawToast(ctx, text, timer) {
    const alpha = Math.min(1, timer * 1.5);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(5,8,10,.72)'; ctx.fillRect(250, 35, 460, 40);
    ctx.strokeStyle = 'rgba(210,222,217,.22)'; ctx.strokeRect(250, 35, 460, 40);
    ctx.fillStyle = '#d3dcd7'; ctx.font = '600 12px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.letterSpacing = '2px';
    ctx.fillText(text.toUpperCase(), 480, 60);
    ctx.restore();
  }
}
