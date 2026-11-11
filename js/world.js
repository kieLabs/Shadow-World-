(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  const CHAPTER_TITLES = [
    '1. AWAKENING (WRONG WAY)', '2. THE DARKFERRY & CART', '3. DUAL BEAR TRAPS & CARCASS',
    '4. CANOPY CLIMB (ALTITUDE)', '5. GIANT SPIDER AMBUSH', '6. WEBBED COCOON CHASE',
    '7. HANGING TRAP ROPES', '8. CRISSCROSS TRIPWIRES', '9. DEADWOOD MILL SAWS',
    '10. FOREST EDGE GAUNTLET', '11. DROWNED BODIES MARSH', '12. BLOWGUN HUNTERS',
    '13. INVERTED CRUSHERS', '14. TRIBAL SPIKE CORRIDOR', '15. BRAINWORM PARASITE',
    '16. FLOODED DRAINAGE PIPES', '17. BUOYANT SPHERE LOCK', '18. DISPLACEMENT RESERVOIR',
    '19. SUBMERGED PIPE (STUCK)', '20. CEILING MUNCHER ESCAPE', '21. RAIN-SWEPT ROOFTOPS',
    '22. DUAL CRANE STACKING', '23. LENGTHENING SAW ROPES', '24. ELECTRIFIED HOTEL SIGN',
    '25. ALONE IN THE DARK', '26. THE SILENT ELEVATOR (DING)', '27. CLIMBING THE GIANT COG',
    '28. MINECART OVER BUZZSAWS', '29. HIGH-VOLTAGE BREAKER', '30. BACKTRACKING CRUSHERS',
    '31. INDUSTRIAL CONDUIT', '32. GUIDED BY SPARKS', '33. TURRET LINE OF SIGHT',
    '34. UNDER GROUND PISTONS', '35. ELECTROMAGNETIC POLARITY', '36. INVERTED SAW CEILING',
    '37. TURRET & GRAVITY CROSSFIRE', '38. GOING UP (GRAVITY SHIFT)', '39. FINAL OMEGA GAUNTLET',
    '40. WHERE CREDIT IS DUE'
  ];

  const ACHIEVEMENT_CHAPTERS = {
    1: 'ACHIEVEMENT: WRONG WAY',
    4: 'ACHIEVEMENT: ALTITUDE IS ATTITUDE',
    19: 'ACHIEVEMENT: IT\'S STUCK',
    24: 'ACHIEVEMENT: URBAN EXPLORATION',
    25: 'ACHIEVEMENT: ALONE IN THE DARK',
    26: 'ACHIEVEMENT: DING',
    27: 'ACHIEVEMENT: CLIMBING THE COG',
    30: 'ACHIEVEMENT: BACKTRACKING',
    32: 'ACHIEVEMENT: GUIDED BY SPARKS',
    34: 'ACHIEVEMENT: UNDER GROUND',
    38: 'ACHIEVEMENT: GOING UP',
    40: 'ACHIEVEMENT: WHERE CREDIT IS DUE'
  };

  SW.World = {
    chapterTitles: CHAPTER_TITLES,
    platforms: [],
    crates: [],
    bearTraps: [],
    saws: [],
    crushers: [],
    ropes: [],
    spiders: [],
    hunters: [],
    maggots: [],
    lightBeams: [],
    munchers: [],
    waterZones: [],
    electricSigns: [],
    turrets: [],
    gravitySwitches: [],
    eggs: [],
    trees: [],
    particles: [],
    time: 0,
    toastCallback: null,

    buildWorld: function() {
      this.platforms = [];
      this.crates = [];
      this.bearTraps = [];
      this.saws = [];
      this.crushers = [];
      this.ropes = [];
      this.spiders = [];
      this.hunters = [];
      this.maggots = [];
      this.lightBeams = [];
      this.munchers = [];
      this.waterZones = [];
      this.electricSigns = [];
      this.turrets = [];
      this.gravitySwitches = [];
      this.eggs = [];
      this.trees = [];

      const CL = SW.Config.CHAPTER_LENGTH;
      const rand = SW.Math.seededRandom(19842010);

      // Left-side Chapter 1 Secret Area ("Wrong Way" Egg)
      this.platforms.push({ x: -420, y: 420, w: 540, h: 240 });
      this.eggs.push({ id: 1, ch: 1, x: -290, y: 404, r: 9, collected: false, label: ACHIEVEMENT_CHAPTERS[1] });

      for (let c = 0; c < SW.Config.TOTAL_CHAPTERS; c++) {
        const chNum = c + 1;
        const bx = c * CL;
        const groundY = 420;

        // Parallax background structures per chapter
        for (let t = 0; t < 11; t++) {
          this.trees.push({
            x: bx + t * 260 + rand() * 90,
            w: 28 + rand() * 55,
            layer: (t % 3),
            act: Math.ceil(chNum / 10)
          });
        }

        // Chapter 40 Finale: Serene Awakening & Glass Barrier Shatter
        if (chNum === 40) {
          this.platforms.push({ x: bx, y: groundY, w: CL, h: 240 });
          this.eggs.push({ id: 40, ch: 40, x: bx + 950, y: groundY - 16, r: 10, collected: false, label: ACHIEVEMENT_CHAPTERS[40] });
          continue;
        }

        // Entry Safe Checkpoint Ledge
        this.platforms.push({ x: bx, y: groundY, w: 460, h: 240 });

        // Segment 1 (bx + 460 to bx + 1150): Gap, Rope, Buoyancy, or Bear Traps
        if (chNum % 3 === 1) {
          // Spike/Saw Chasm with Pullable Cart/Crate & Swinging Rope
          this.platforms.push({ x: bx + 780, y: groundY, w: 460, h: 240 });
          this.crates.push({
            x: bx + 310, y: groundY - 46, w: 46, h: 46,
            minX: bx + 120, maxX: bx + 440, pullable: true, label: 'CART'
          });
          this.ropes.push({
            x: bx + 620, y: 80, length: 235, maxLength: 295,
            angle: 0.25, angVel: 0, lengthens: (chNum > 20)
          });
          this.saws.push({
            x: bx + 620, y: groundY + 35, r: 42,
            baseX: bx + 620, rangeX: 110, speed: 2.2, angle: 0
          });
        } else if (chNum % 3 === 2) {
          // Rising Buoyancy Water Basin with Floating Boat/Crate
          this.platforms.push({ x: bx + 920, y: groundY, w: 340, h: 240 });
          this.waterZones.push({ x: bx + 460, y: groundY - 10, w: 460, h: 220 });
          this.crates.push({
            x: bx + 500, y: groundY - 36, w: 95, h: 32,
            minX: bx + 465, maxX: bx + 810, pullable: true, floats: true, vx: 38, dir: 1
          });
        } else {
          // Continuous Corridor with Paired Draggable Bear Traps
          this.platforms.push({ x: bx + 460, y: groundY, w: 780, h: 240 });
          this.bearTraps.push({
            x: bx + 660, y: groundY - 16, w: 36, h: 16,
            snapped: false, pullable: true, minX: bx + 490, maxX: bx + 1100
          });
          this.bearTraps.push({
            x: bx + 706, y: groundY - 16, w: 36, h: 16,
            snapped: false, pullable: true, minX: bx + 490, maxX: bx + 1100
          });
        }

        // Segment 2 (bx + 1240 to bx + 2050): Act-Specific Signature LIMBO Setpieces
        this.platforms.push({ x: bx + 1240, y: groundY, w: 820, h: 240 });

        if (chNum <= 10) {
          // ACT I: Giant Spider Boss & Tripwire Bear Traps
          this.bearTraps.push({
            x: bx + 1420, y: groundY - 16, w: 36, h: 16,
            snapped: false, pullable: true, minX: bx + 1260, maxX: bx + 1950
          });
          if (chNum >= 5) {
            this.spiders.push({
              x: bx + 1680, y: groundY - 135,
              baseX: bx + 1680, hp: 3, strikeTimer: 0, state: 'stalk',
              legTargetX: bx + 1580, legTargetY: groundY
            });
          } else {
            this.saws.push({
              x: bx + 1640, y: groundY - 18, r: 36,
              baseX: bx + 1640, rangeX: 160, speed: 2.5, angle: 0
            });
          }
        } else if (chNum <= 20) {
          // ACT II: Brainworm Maggots, Light Beams, Munchers & Blowgun Hunters + Crushers
          this.maggots.push({ x: bx + 1320, y: groundY - 140, active: true });
          this.platforms.push({ x: bx + 1290, y: groundY - 155, w: 520, h: 18 });
          this.lightBeams.push({ x: bx + 1780, y: 0, w: 58, h: groundY, flipDir: -1 });
          this.lightBeams.push({ x: bx + 1260, y: 0, w: 58, h: groundY, flipDir: 1 });
          this.munchers.push({ x: bx + 1890, y: groundY - 115, w: 42, h: 55 });
          this.crushers.push({
            x: bx + 1540, y: groundY - 210, baseY: groundY - 210, targetY: groundY - 42,
            w: 74, h: 42, timer: 0, cycle: 2.1
          });
          this.hunters.push({
            x: bx + 1720, y: groundY - 44, w: 22, h: 44,
            minX: bx + 1380, maxX: bx + 1960, vx: -95, alive: true
          });
        } else if (chNum <= 30) {
          // ACT III: Electrified HOTEL Sign (3.0s cycle) & Giant Cogs/Saws
          const letters = ['H', 'O', 'T', 'E', 'L'];
          for (let l = 0; l < letters.length; l++) {
            const lx = bx + 1340 + l * 105;
            const ly = groundY - 95 - (l % 2) * 32;
            this.platforms.push({ x: lx, y: ly, w: 72, h: 20 });
            this.electricSigns.push({
              x: lx, y: ly - 6, w: 72, h: 28,
              letter: letters[l], timer: l * 0.45, cycle: 3.0, electrified: false
            });
          }
          this.saws.push({
            x: bx + 1580, y: groundY - 10, r: 44,
            baseX: bx + 1580, rangeX: 220, speed: 3.1, angle: 0
          });
        } else {
          // ACT IV: Gravity Inversion Corridor + Ceiling Track + Machine Gun Turrets
          this.platforms.push({ x: bx + 1240, y: 85, w: 820, h: 28 });
          this.gravitySwitches.push({ x: bx + 1310, y: groundY - 52, w: 28, h: 52, targetDir: -1 });
          this.gravitySwitches.push({ x: bx + 1940, y: 113, w: 28, h: 52, targetDir: 1 });
          this.saws.push({
            x: bx + 1620, y: groundY - 12, r: 46,
            baseX: bx + 1620, rangeX: 190, speed: 3.6, angle: 0
          });
          this.saws.push({
            x: bx + 1620, y: 115, r: 34,
            baseX: bx + 1620, rangeX: 140, speed: -2.8, angle: 0
          });
          this.turrets.push({
            x: bx + 1880, y: groundY - 38, dir: -1, range: 420, lockTimer: 0
          });
        }

        // Segment 3 (bx + 2060 to bx + 2800): Final Chapter Gauntlet & Checkpoint Bridge
        this.platforms.push({ x: bx + 2060, y: groundY, w: 740, h: 240 });
        this.crushers.push({
          x: bx + 2260, y: groundY - 220, baseY: groundY - 220, targetY: groundY - 40,
          w: 82, h: 40, timer: (chNum % 2) * 1.1, cycle: 1.85
        });
        this.saws.push({
          x: bx + 2520, y: groundY - 14, r: 38,
          baseX: bx + 2520, rangeX: 135, speed: 2.9 + (chNum * 0.04), angle: 0
        });

        // Place Official Achievement Secret Eggs
        if (ACHIEVEMENT_CHAPTERS[chNum] && chNum !== 1 && chNum !== 40) {
          this.platforms.push({ x: bx + 980, y: groundY - 135, w: 110, h: 16 });
          this.eggs.push({
            id: chNum, ch: chNum, x: bx + 1035, y: groundY - 151,
            r: 9, collected: !!SW.Save.state.eggsFound[chNum],
            label: ACHIEVEMENT_CHAPTERS[chNum]
          });
        }
      }
    },

    getSolidsInRange: function(minX, maxX) {
      const list = [];
      for (let i = 0; i < this.platforms.length; i++) {
        const p = this.platforms[i];
        if (p.x + p.w >= minX && p.x <= maxX) list.push(p);
      }
      for (let i = 0; i < this.crates.length; i++) {
        const c = this.crates[i];
        if (c.x + c.w >= minX && c.x <= maxX) list.push(c);
      }
      return list;
    },

    getPullablesNear: function(x, y, w, h) {
      const box = { x: x, y: y, w: w, h: h };
      const res = [];
      for (let i = 0; i < this.crates.length; i++) {
        if (this.crates[i].pullable && SW.Math.aabb(box, this.crates[i])) res.push(this.crates[i]);
      }
      for (let i = 0; i < this.bearTraps.length; i++) {
        if (this.bearTraps[i].pullable && SW.Math.aabb(box, this.bearTraps[i])) res.push(this.bearTraps[i]);
      }
      return res;
    },

    update: function(dt, player) {
      this.time += dt;
      const px = player.x;
      const activeRange = 1600;

      // Update Floating Boats / Crates
      for (let i = 0; i < this.crates.length; i++) {
        const c = this.crates[i];
        if (c.floats && Math.abs(c.x - px) < activeRange) {
          c.x += c.vx * c.dir * dt;
          if (c.x >= c.maxX) { c.x = c.maxX; c.dir = -1; }
          else if (c.x <= c.minX) { c.x = c.minX; c.dir = 1; }
        }
      }

      // Update Pendulum Ropes
      for (let i = 0; i < this.ropes.length; i++) {
        const r = this.ropes[i];
        if (Math.abs(r.x - px) > activeRange) continue;
        const gravAccel = -(SW.Config.GRAVITY / r.length) * Math.sin(r.angle);
        r.angVel += gravAccel * dt;
        r.angVel *= 0.992;
        r.angle += r.angVel * dt;

        const tipX = r.x + Math.sin(r.angle) * r.length;
        const tipY = r.y + Math.cos(r.angle) * r.length;
        if (!player.dead && !player.attachedRope && player.vy !== 0) {
          if (SW.Math.dist(player.x + player.w * 0.5, player.y + player.h * 0.5, tipX, tipY) < 34) {
            player.attachedRope = r;
          }
        }
      }

      // Update Bear Traps
      for (let i = 0; i < this.bearTraps.length; i++) {
        const bt = this.bearTraps[i];
        if (bt.snapped || Math.abs(bt.x - px) > activeRange) continue;
        const triggerBox = { x: bt.x + 8, y: bt.y - 6, w: bt.w - 16, h: bt.h + 6 };
        if (!player.dead && SW.Math.aabb(player, triggerBox)) {
          bt.snapped = true;
          SW.Audio.playTrapSnap();
          player.kill('SEVERED BY BEAR TRAP');
        }
      }

      // Update Spinning Buzzsaws
      for (let i = 0; i < this.saws.length; i++) {
        const s = this.saws[i];
        if (Math.abs(s.baseX - px) > activeRange) continue;
        s.angle += dt * 11;
        s.x = s.baseX + Math.sin(this.time * s.speed) * s.rangeX;
        if (!player.dead && SW.Math.circleRect(s.x, s.y, s.r - 4, player.x, player.y, player.w, player.h)) {
          player.kill('SHREDDED BY INDUSTRIAL SAW');
        }
      }

      // Update Hydraulic Crushers
      for (let i = 0; i < this.crushers.length; i++) {
        const cr = this.crushers[i];
        if (Math.abs(cr.x - px) > activeRange) continue;
        cr.timer = (cr.timer + dt) % cr.cycle;
        const phase = cr.timer / cr.cycle;
        if (phase < 0.25) {
          cr.y = SW.Math.lerp(cr.baseY, cr.targetY, phase / 0.25);
        } else if (phase < 0.45) {
          cr.y = cr.targetY;
        } else {
          cr.y = SW.Math.lerp(cr.targetY, cr.baseY, (phase - 0.45) / 0.55);
        }
        if (!player.dead && SW.Math.aabb(player, cr)) {
          player.kill('PULVERIZED BY HYDRAULIC CRUSHER');
        }
        for (let h = 0; h < this.hunters.length; h++) {
          const hu = this.hunters[h];
          if (hu.alive && SW.Math.aabb(hu, cr)) {
            hu.alive = false;
            SW.Audio.playTrapSnap();
          }
        }
      }

      // Update Procedural IK Giant Spiders
      for (let i = 0; i < this.spiders.length; i++) {
        const sp = this.spiders[i];
        if (sp.hp <= 0 || Math.abs(sp.x - px) > activeRange) continue;
        const distToPlayer = px - sp.x;
        if (Math.abs(distToPlayer) < 290) {
          sp.strikeTimer += dt;
          const cycle = sp.strikeTimer % 2.2;
          if (cycle < 1.1) {
            // Telegraph raised foreleg
            sp.legTargetX = px + player.w * 0.5;
            sp.legTargetY = sp.y - 35;
          } else if (cycle < 1.35) {
            // Lethal downward impale strike
            sp.legTargetY = 420;
            // Check if striking a Bear Trap first!
            for (let b = 0; b < this.bearTraps.length; b++) {
              const bt = this.bearTraps[b];
              if (!bt.snapped && Math.abs(bt.x + bt.w * 0.5 - sp.legTargetX) < 32) {
                bt.snapped = true;
                sp.hp -= 1;
                sp.strikeTimer = 0;
                SW.Audio.playTrapSnap();
                if (this.toastCallback) {
                  this.toastCallback(sp.hp > 0 ? 'SPIDER LIMB AMPUTATED (' + sp.hp + ' LEFT)' : 'GIANT SPIDER DEFEATED');
                }
              }
            }
            if (!player.dead && sp.hp > 0 && Math.abs(player.x + player.w * 0.5 - sp.legTargetX) < 24 && player.y + player.h > 375) {
              player.kill('IMPALED BY THE GIANT SPIDER');
            }
          } else {
            sp.legTargetY = 415;
          }
        }
      }

      // Update Tribal Blowgun Hunters
      for (let i = 0; i < this.hunters.length; i++) {
        const hu = this.hunters[i];
        if (!hu.alive || Math.abs(hu.x - px) > activeRange) continue;
        hu.x += hu.vx * dt;
        if (hu.x < hu.minX) { hu.x = hu.minX; hu.vx = Math.abs(hu.vx); }
        if (hu.x > hu.maxX) { hu.x = hu.maxX; hu.vx = -Math.abs(hu.vx); }
        if (!player.dead && SW.Math.aabb(player, hu)) {
          player.kill('FELLED BY TRIBAL HUNTER');
        }
      }

      // Update Brainworm Maggots, Light Beams & Munchers
      for (let i = 0; i < this.maggots.length; i++) {
        const mg = this.maggots[i];
        if (!mg.active || Math.abs(mg.x - px) > activeRange) continue;
        if (!player.maggotAttached && Math.abs(player.x - mg.x) < 28 && player.y <= mg.y + 150) {
          mg.active = false;
          player.maggotAttached = true;
          player.maggotDir = 1;
          if (this.toastCallback) this.toastCallback('BRAINWORM ATTACHED: ENTER LIGHT TO REVERSE');
        }
      }
      if (player.maggotAttached) {
        for (let i = 0; i < this.lightBeams.length; i++) {
          const lb = this.lightBeams[i];
          if (SW.Math.aabb(player, lb) && player.maggotDir !== lb.flipDir) {
            player.maggotDir = lb.flipDir;
            SW.Audio.playElectricArc();
          }
        }
        for (let i = 0; i < this.munchers.length; i++) {
          const mu = this.munchers[i];
          if (SW.Math.aabb(player, mu)) {
            player.maggotAttached = false;
            SW.Audio.playTrapSnap();
            if (this.toastCallback) this.toastCallback('BRAINWORM DEVOURED BY CEILING MUNCHER');
          }
        }
      }

      // Update Water Zones (Drowning Check)
      for (let i = 0; i < this.waterZones.length; i++) {
        const wz = this.waterZones[i];
        if (Math.abs(wz.x - px) > activeRange) continue;
        if (!player.dead && player.y + player.h > wz.y + 26 && player.x + player.w > wz.x && player.x < wz.x + wz.w) {
          player.kill('DROWNED IN DARK WATERS');
        }
      }

      // Update Electrified HOTEL Signs (Strict 3.0s Duty Cycle)
      for (let i = 0; i < this.electricSigns.length; i++) {
        const es = this.electricSigns[i];
        if (Math.abs(es.x - px) > activeRange) continue;
        es.timer = (es.timer + dt) % (es.cycle * 2);
        es.electrified = es.timer < es.cycle;
        if (!player.dead && es.electrified && SW.Math.aabb(player, es)) {
          SW.Audio.playElectricArc();
          player.kill('ELECTROCUTED ON HOTEL SIGN');
        }
      }

      // Update Machine Gun Turrets
      for (let i = 0; i < this.turrets.length; i++) {
        const tu = this.turrets[i];
        if (Math.abs(tu.x - px) > activeRange) continue;
        const inSight = (px < tu.x && px > tu.x - tu.range && Math.abs(player.y - tu.y) < 38);
        if (inSight && !player.dead) {
          tu.lockTimer += dt;
          if (tu.lockTimer > 0.52) {
            SW.Audio.playTrapSnap();
            player.kill('SHOT BY AUTOMATED TURRET');
          }
        } else {
          tu.lockTimer = Math.max(0, tu.lockTimer - dt * 2);
        }
      }

      // Update Gravity Inversion Switches
      for (let i = 0; i < this.gravitySwitches.length; i++) {
        const gs = this.gravitySwitches[i];
        if (Math.abs(gs.x - px) > activeRange) continue;
        if (!player.dead && SW.Math.aabb(player, gs) && player.gravityDir !== gs.targetDir) {
          player.gravityDir = gs.targetDir;
          player.vy = 0;
          SW.Audio.playGravityFlip();
          if (this.toastCallback) {
            this.toastCallback(gs.targetDir === -1 ? 'GRAVITY INVERTED (UPWARD)' : 'GRAVITY RESTORED');
          }
        }
      }

      // Update Secret Eggs & Achievements
      for (let i = 0; i < this.eggs.length; i++) {
        const eg = this.eggs[i];
        if (eg.collected || Math.abs(eg.x - px) > activeRange) continue;
        if (!player.dead && SW.Math.circleRect(eg.x, eg.y, eg.r + 6, player.x, player.y, player.w, player.h)) {
          eg.collected = true;
          SW.Audio.playEggFound();
          SW.Save.recordEgg(eg.id);
          if (this.toastCallback) this.toastCallback(eg.label);
        }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
