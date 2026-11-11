(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  SW.Renderer = {
    camX: 0,
    camY: 0,
    dust: [],

    init: function() {
      this.dust = [];
      for (let i = 0; i < 65; i++) {
        this.dust.push({
          x: Math.random() * 1400,
          y: Math.random() * 600,
          r: 0.8 + Math.random() * 2.2,
          vy: -6 - Math.random() * 14,
          vx: -8 + Math.random() * 16,
          alpha: 0.12 + Math.random() * 0.35
        });
      }
      if (typeof document !== 'undefined') {
        const grainEl = document.getElementById('grain-layer');
        if (grainEl) {
          const url = SW.CanvasUtils.generateFilmGrainDataURL(128);
          if (url) grainEl.style.backgroundImage = 'url(' + url + ')';
        }
      }
    },

    render: function(ctx, width, height, world, player) {
      if (!ctx) return;
      const targetCamX = player.x - width * 0.36;
      this.camX = SW.Math.lerp(this.camX, targetCamX, 0.12);
      const scaleY = height / 540;

      ctx.save();
      ctx.scale(scaleY, scaleY);
      const vw = width / scaleY;
      const vh = 540;

      // Layer 1: Atmospheric Monochrome Sky & Depth Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, vh);
      bgGrad.addColorStop(0, '#0c0d10');
      bgGrad.addColorStop(0.52, '#282b30');
      bgGrad.addColorStop(1, '#08090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, vw, vh);

      // Layer 2: Multi-Plane Parallax Forest / Industrial Silhouettes
      const treeLayers = [
        { factor: 0.25, color: '#1b1d21', blurWidth: 1.3 },
        { factor: 0.55, color: '#111215', blurWidth: 1.0 },
        { factor: 0.82, color: '#090a0c', blurWidth: 0.8 }
      ];
      for (let l = 0; l < treeLayers.length; l++) {
        const cfg = treeLayers[l];
        ctx.fillStyle = cfg.color;
        for (let i = 0; i < world.trees.length; i++) {
          const tr = world.trees[i];
          if (tr.layer !== l) continue;
          const sx = (tr.x - this.camX * cfg.factor);
          if (sx < -200 || sx > vw + 200) continue;
          ctx.fillRect(sx, 0, tr.w * cfg.blurWidth, vh);
          if (tr.act >= 3) {
            ctx.fillRect(sx - 40, 120 + (i % 3) * 80, tr.w + 80, 10);
          }
        }
      }

      ctx.save();
      ctx.translate(-this.camX, 0);

      // Volumetric Overhead Light Beams (Brainworm Reversal Shafts)
      for (let i = 0; i < world.lightBeams.length; i++) {
        const lb = world.lightBeams[i];
        if (lb.x + lb.w < this.camX - 100 || lb.x > this.camX + vw + 100) continue;
        const lg = ctx.createLinearGradient(lb.x, 0, lb.x + lb.w, 0);
        lg.addColorStop(0, 'rgba(255,255,255,0)');
        lg.addColorStop(0.5, 'rgba(255,255,255,0.28)');
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(lb.x, lb.y, lb.w, lb.h);
      }

      // Water Zones with Shimmering Surface Line
      for (let i = 0; i < world.waterZones.length; i++) {
        const wz = world.waterZones[i];
        if (wz.x + wz.w < this.camX - 100 || wz.x > this.camX + vw + 100) continue;
        ctx.fillStyle = 'rgba(4, 5, 7, 0.86)';
        ctx.fillRect(wz.x, wz.y, wz.w, wz.h);
        ctx.strokeStyle = 'rgba(220, 225, 230, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wz.x, wz.y);
        ctx.lineTo(wz.x + wz.w, wz.y);
        ctx.stroke();
      }

      // Foreground Platforms
      ctx.fillStyle = '#030304';
      for (let i = 0; i < world.platforms.length; i++) {
        const p = world.platforms[i];
        if (p.x + p.w < this.camX - 100 || p.x > this.camX + vw + 100) continue;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }

      // Pullable Crates & Boats (with Ring Affordance Handles)
      for (let i = 0; i < world.crates.length; i++) {
        const c = world.crates[i];
        if (c.x + c.w < this.camX - 100 || c.x > this.camX + vw + 100) continue;
        ctx.fillStyle = '#050506';
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        // Affordance pull-ring handle
        ctx.beginPath();
        ctx.arc(c.x - 5, c.y + c.h * 0.5, 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Swinging Ropes
      ctx.strokeStyle = '#050507';
      ctx.lineWidth = 3;
      for (let i = 0; i < world.ropes.length; i++) {
        const r = world.ropes[i];
        if (Math.abs(r.x - this.camX) > vw + 200) continue;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + Math.sin(r.angle) * r.length, r.y + Math.cos(r.angle) * r.length);
        ctx.stroke();
      }

      // Bear Traps (Steel Jaws + Pull Handle)
      for (let i = 0; i < world.bearTraps.length; i++) {
        const bt = world.bearTraps[i];
        if (Math.abs(bt.x - this.camX) > vw + 200) continue;
        ctx.fillStyle = '#040405';
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(bt.x, bt.y + 8, bt.w, 8);
        ctx.beginPath();
        if (bt.snapped) {
          ctx.moveTo(bt.x + 8, bt.y + 8);
          ctx.lineTo(bt.x + bt.w * 0.5, bt.y - 6);
          ctx.lineTo(bt.x + bt.w - 8, bt.y + 8);
        } else {
          for (let t = 0; t <= 4; t++) {
            const tx = bt.x + (t / 4) * bt.w;
            ctx.moveTo(tx, bt.y + 8);
            ctx.lineTo(tx, bt.y);
          }
        }
        ctx.stroke();
      }

      // Spinning Serrated Buzzsaws
      for (let i = 0; i < world.saws.length; i++) {
        const s = world.saws[i];
        if (Math.abs(s.x - this.camX) > vw + 200) continue;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.fillStyle = '#060608';
        ctx.strokeStyle = 'rgba(255,255,255,0.68)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const teeth = 16;
        for (let t = 0; t < teeth * 2; t++) {
          const rad = (t % 2 === 0) ? s.r : s.r * 0.78;
          const a = (t * Math.PI) / teeth;
          if (t === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Hydraulic Crushers
      for (let i = 0; i < world.crushers.length; i++) {
        const cr = world.crushers[i];
        if (Math.abs(cr.x - this.camX) > vw + 200) continue;
        ctx.fillStyle = '#040406';
        ctx.fillRect(cr.x + cr.w * 0.35, 0, cr.w * 0.3, cr.y);
        ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      }

      // Procedural 2D IK Giant Spiders
      for (let i = 0; i < world.spiders.length; i++) {
        const sp = world.spiders[i];
        if (sp.hp <= 0 || Math.abs(sp.x - this.camX) > vw + 300) continue;
        ctx.fillStyle = '#020203';
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, 44, 30, -0.15, 0, Math.PI * 2);
        ctx.fill();
        // Glowing arachnid eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sp.x - 32, sp.y + 6, 3, 0, Math.PI * 2);
        ctx.arc(sp.x - 24, sp.y + 10, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw IK Legs (1 Attacking Foreleg + Support Legs)
        ctx.strokeStyle = '#030304';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        const attackIK = SW.Math.solveTwoJointIK(sp.x - 20, sp.y + 10, sp.legTargetX, sp.legTargetY, 95, 110, true);
        ctx.beginPath();
        ctx.moveTo(sp.x - 20, sp.y + 10);
        ctx.lineTo(attackIK.jx, attackIK.jy);
        ctx.lineTo(attackIK.ex, attackIK.ey);
        ctx.stroke();

        for (let leg = 0; leg < sp.hp; leg++) {
          const footX = sp.x + 25 + leg * 36 + Math.sin(world.time * 4 + leg) * 12;
          const legIK = SW.Math.solveTwoJointIK(sp.x + 10, sp.y + 8, footX, 420, 88, 98, true);
          ctx.beginPath();
          ctx.moveTo(sp.x + 10, sp.y + 8);
          ctx.lineTo(legIK.jx, legIK.jy);
          ctx.lineTo(legIK.ex, legIK.ey);
          ctx.stroke();
        }
      }

      // Tribal Blowgun Hunters
      for (let i = 0; i < world.hunters.length; i++) {
        const hu = world.hunters[i];
        if (!hu.alive || Math.abs(hu.x - this.camX) > vw + 200) continue;
        ctx.fillStyle = '#030304';
        ctx.fillRect(hu.x, hu.y + 14, hu.w, hu.h - 14);
        ctx.beginPath();
        ctx.arc(hu.x + hu.w * 0.5, hu.y + 9, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hu.x + (hu.vx < 0 ? 3 : 14), hu.y + 7, 2.5, 2.5);
      }

      // Brainworm Maggots & Ceiling Munchers
      for (let i = 0; i < world.maggots.length; i++) {
        const mg = world.maggots[i];
        if (!mg.active || Math.abs(mg.x - this.camX) > vw + 200) continue;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(mg.x, mg.y + Math.sin(world.time * 5) * 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      for (let i = 0; i < world.munchers.length; i++) {
        const mu = world.munchers[i];
        if (Math.abs(mu.x - this.camX) > vw + 200) continue;
        ctx.fillStyle = '#040406';
        ctx.fillRect(mu.x, mu.y, mu.w, mu.h);
      }

      // Electrified HOTEL Letters
      for (let i = 0; i < world.electricSigns.length; i++) {
        const es = world.electricSigns[i];
        if (Math.abs(es.x - this.camX) > vw + 200) continue;
        ctx.save();
        ctx.font = 'bold 20px Courier New';
        ctx.fillStyle = es.electrified ? '#ffffff' : '#555960';
        if (es.electrified) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(es.x, es.y + 6, es.w, 20);
        }
        ctx.fillText(es.letter, es.x + 28, es.y + 2);
        ctx.restore();
      }

      // Automated Turrets & Gravity Switches
      for (let i = 0; i < world.turrets.length; i++) {
        const tu = world.turrets[i];
        if (Math.abs(tu.x - this.camX) > vw + 450) continue;
        ctx.fillStyle = '#050507';
        ctx.fillRect(tu.x - 12, tu.y, 24, 38);
        ctx.strokeStyle = tu.lockTimer > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = tu.lockTimer > 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(tu.x, tu.y + 10);
        ctx.lineTo(tu.x - tu.range, tu.y + 10);
        ctx.stroke();
      }
      for (let i = 0; i < world.gravitySwitches.length; i++) {
        const gs = world.gravitySwitches[i];
        if (Math.abs(gs.x - this.camX) > vw + 200) continue;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(gs.x, gs.y, gs.w, gs.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText(gs.targetDir === -1 ? '&#8593;' : '&#8595;', gs.x + 8, gs.y + 30);
      }

      // Glowing Achievement Eggs
      for (let i = 0; i < world.eggs.length; i++) {
        const eg = world.eggs[i];
        if (eg.collected || Math.abs(eg.x - this.camX) > vw + 200) continue;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(eg.x, eg.y, eg.r * 0.8, eg.r * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Foreground Protagonist Silhouette ("The Boy")
      if (player.dead) {
        ctx.fillStyle = '#030304';
        for (let i = 0; i < player.ragdollParts.length; i++) {
          const p = player.ragdollParts[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.save();
        const cx = player.x + player.w * 0.5;
        const cy = player.y + player.h * 0.5;
        ctx.translate(cx, cy);
        if (player.gravityDir === -1) ctx.scale(1, -1);

        // Legs
        const swing = Math.sin(player.animTimer) * (Math.abs(player.vx) > 20 ? 7 : 0);
        ctx.strokeStyle = '#020203';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, 6);
        ctx.lineTo(-4 + swing, 21);
        ctx.moveTo(3, 6);
        ctx.lineTo(4 - swing, 21);
        ctx.stroke();

        // Torso & Oversized LIMBO Silhouette Head
        ctx.fillStyle = '#020203';
        ctx.fillRect(-7, -6, 14, 15);
        ctx.beginPath();
        ctx.arc(0, -13, 10.5, 0, Math.PI * 2);
        ctx.fill();

        // Iconic Glowing White Eyes
        if ((player.blinkTimer % 4.2) < 4.05) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          const eyeX = player.facing * 4;
          ctx.beginPath();
          ctx.arc(eyeX - 2, -14, 1.9, 0, Math.PI * 2);
          ctx.arc(eyeX + 3, -14, 1.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Attached Glowing Brainworm Parasite
        if (player.maggotAttached) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.ellipse(0, -24, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      ctx.restore(); // End world-space camera translation

      // Layer 4: Floating Atmospheric Spores & Dust Motes
      ctx.fillStyle = 'rgba(235, 240, 245, 0.25)';
      for (let i = 0; i < this.dust.length; i++) {
        const d = this.dust[i];
        d.x = (d.x + d.vx * 0.016 + vw) % vw;
        d.y = (d.y + d.vy * 0.016 + vh) % vh;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
