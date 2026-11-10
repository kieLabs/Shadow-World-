import { approach, clamp } from './core.js';

export class Player {
  constructor(x, floorY) {
    this.w = 27;
    this.h = 58;
    this.standingHeight = 58;
    this.crouchHeight = 38;
    this.x = Number.isFinite(x) ? x : 80;
    this.y = floorY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = true;
    this.wasGrounded = true;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.anim = 0;
    this.dead = false;
    this.invulnerable = 0;
    this.inWater = false;
    this.climbing = null;
    this.crouching = false;
  }

  get bounds() { return { x: this.x + 5, y: this.y + 4, w: this.w - 10, h: this.h - 5 }; }

  update(dt, input, world, audio) {
    this.wasGrounded = this.grounded;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.jumpBuffer = input.jumpPressed ? 0.14 : Math.max(0, this.jumpBuffer - dt);

    const centerX = this.x + this.w / 2;
    this.inWater = world.water && centerX > world.water.x && centerX < world.water.x + world.water.w && this.y + this.h > world.water.y;

    // Vertical traversal: UP climbs a ladder, DOWN descends it. On ordinary
    // ground DOWN crouches so low beams and tunnels can be crossed safely.
    if (!this.climbing && (input.up || input.down)) {
      const ladder = world.ladders.find(item =>
        Math.abs(centerX - item.x) < item.w / 2 + 12 &&
        this.y + this.h >= item.topY - 8 && this.y <= item.bottomY
      );
      if (ladder) {
        this.climbing = ladder;
        this.x = ladder.x - this.w / 2;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
      }
    }

    if (this.climbing) {
      this.h = this.standingHeight;
      this.crouching = false;
      this.x = this.climbing.x - this.w / 2;
      this.vx = 0;
      this.vy = 0;
      const climbDirection = (input.up ? -1 : 0) + (input.down ? 1 : 0);
      this.y += climbDirection * 190 * dt;
      const top = this.climbing.topY - this.h;
      const bottom = this.climbing.bottomY - this.h;
      if (this.y <= top) {
        this.y = top;
        this.climbing = null;
        this.grounded = true;
      } else if (this.y >= bottom) {
        this.y = bottom;
        this.climbing = null;
        this.grounded = true;
      } else if (input.left || input.right) {
        this.climbing = null;
        this.grounded = false;
      }
      this.anim += dt * 5;
      return;
    }

    const bottomBeforeHeightChange = this.y + this.h;
    this.crouching = !!(input.down && this.grounded && !this.inWater);
    this.h = this.crouching ? this.crouchHeight : this.standingHeight;
    this.y = bottomBeforeHeightChange - this.h;

    const horizontal = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const maxSpeed = this.inWater ? 145 : (this.crouching ? 105 : 235);
    const acceleration = this.grounded ? 1150 : 700;
    this.vx = approach(this.vx, horizontal * maxSpeed, acceleration * dt);
    if (horizontal !== 0) this.facing = horizontal;
    if (!horizontal && this.grounded) this.vx = approach(this.vx, 0, 1500 * dt);

    if (this.grounded) this.coyote = 0.12;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0 || this.inWater)) {
      this.vy = this.inWater ? -300 : -470;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.crouching = false;
      this.h = this.standingHeight;
      audio.jump();
    }

    if (this.inWater) {
      this.vy += 420 * dt;
      this.vy = Math.min(this.vy, 190);
      if (input.jump) this.vy = Math.max(this.vy - 720 * dt, -245);
      if (input.up) this.vy = Math.max(this.vy - 420 * dt, -220);
      if (input.down) this.vy = Math.min(this.vy + 520 * dt, 220);
    } else {
      this.vy += 1320 * dt;
      this.vy = Math.min(this.vy, 850);
    }

    const previousX = this.x;
    this.x += this.vx * dt;
    this.x = clamp(this.x, 0, world.width - this.w);
    const crate = world.crate;
    const verticalOverlap = this.y + this.h > crate.y + 5 && this.y < crate.y + crate.h - 4;
    const horizontalOverlap = this.x + this.w > crate.x && this.x < crate.x + crate.w;
    if (verticalOverlap && horizontalOverlap && this.vx > 0 && previousX + this.w <= crate.x + 8) {
      crate.x = clamp(crate.x + this.vx * dt * 0.92, 220, world.plate.x + 15);
      crate.vx = this.vx * 0.45;
      this.x = crate.x - this.w;
    } else if (verticalOverlap && horizontalOverlap && this.vx < 0 && previousX >= crate.x + crate.w - 8) {
      crate.x = clamp(crate.x + this.vx * dt * 0.92, 220, world.plate.x + 15);
      crate.vx = this.vx * 0.45;
      this.x = crate.x + crate.w;
    }
    const cratePlatform = world.platforms.find(p => p.kind === 'crate');
    if (cratePlatform) { cratePlatform.x = crate.x; cratePlatform.y = crate.y; }
    this.resolvePlatforms(world, true, dt);

    this.y += this.vy * dt;
    this.grounded = false;
    this.resolvePlatforms(world, false, dt);

    if (this.wasGrounded && !this.grounded && this.vy > 0) this.coyote = Math.max(this.coyote, 0.08);
    if (!this.wasGrounded && this.grounded) audio.land();
    this.anim += dt * (Math.abs(this.vx) > 12 ? 8 : 2.2);
  }

  resolvePlatforms(world, horizontal, dt) {
    for (const p of world.platforms) {
      if (this.x + this.w > p.x && this.x < p.x + p.w && this.y + this.h > p.y && this.y < p.y + p.h) {
        if (horizontal) {
          if (this.vx > 0) this.x = p.x - this.w;
          else if (this.vx < 0) this.x = p.x + p.w;
          this.vx = 0;
        } else {
          if (this.vy > 0 && this.y + this.h - this.vy * dt <= p.y + 8) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.grounded = true;
          } else if (this.vy < 0 && this.y - this.vy * dt >= p.y + p.h - 8) {
            this.y = p.y + p.h;
            this.vy = 0;
          }
        }
      }
    }
  }
}
