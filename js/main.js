import { aabbOverlap, clamp } from './core.js';
import { AudioFX } from './audio.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { createWorld, updateWorld } from './world.js';
import { clearSave, loadSave, writeSave } from './save.js';

const canvas = document.querySelector('#gameCanvas');
const renderer = new Renderer(canvas);
const audio = new AudioFX();
const saved = loadSave();

const ui = {
  menu: document.querySelector('#menuScreen'),
  pause: document.querySelector('#pauseScreen'),
  death: document.querySelector('#deathScreen'),
  complete: document.querySelector('#completeScreen'),
  continueBtn: document.querySelector('#continueBtn'),
  startBtn: document.querySelector('#startBtn'),
  restartBtn: document.querySelector('#restartBtn'),
  resumeBtn: document.querySelector('#resumeBtn'),
  retryBtn: document.querySelector('#retryBtn'),
  soundBtn: document.querySelector('#soundBtn'),
  soundMenuBtn: document.querySelector('#soundMenuBtn'),
  pauseBtn: document.querySelector('#pauseBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  objective: document.querySelector('#objectiveText'),
  progress: document.querySelector('#progressFill'),
  progressLabel: document.querySelector('#progressLabel'),
  touchControls: document.querySelector('#touchControls'),
  hint: document.querySelector('#controlHint')
};

const game = {
  state: 'menu',
  world: createWorld(),
  player: null,
  dt: 0,
  toast: '',
  toastTimer: 0,
  checkpoint: saved.checkpoint,
  bestProgress: saved.bestProgress,
  soundOn: saved.soundOn,
  completed: saved.completed,
  drownTimer: 0,
  deathTimer: 0,
  lastSaveAt: 0,
  startedAt: 0
};

audio.setEnabled(game.soundOn);
ui.continueBtn.disabled = !saved.bestProgress && saved.checkpoint <= 80 && !saved.completed;
ui.soundMenuBtn.textContent = game.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
ui.soundBtn.textContent = game.soundOn ? '♪' : '×';

class InputController {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, jump: false, interact: false };
    this.jumpPressed = false;
    this.interactPressed = false;
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', ' ', 'arrowdown'].includes(key)) e.preventDefault();
      if (!this.keys.has(key) && (key === ' ' || key === 'arrowup' || key === 'w')) this.jumpPressed = true;
      if (!this.keys.has(key) && key === 'e') this.interactPressed = true;
      this.keys.add(key);
      if ((key === 'escape' || key === 'p') && game.state === 'playing') pauseGame();
      else if ((key === 'escape' || key === 'p') && game.state === 'paused') resumeGame();
    }, { passive: false });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.touch = { left: false, right: false, jump: false, interact: false }; });

    document.querySelectorAll('[data-control]').forEach(button => {
      const control = button.dataset.control;
      const down = e => {
        e.preventDefault();
        button.setPointerCapture?.(e.pointerId);
        this.touch[control] = true;
        if (control === 'jump') this.jumpPressed = true;
        if (control === 'interact') this.interactPressed = true;
        audio.unlock();
      };
      const up = e => { e.preventDefault(); this.touch[control] = false; };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
      button.addEventListener('contextmenu', e => e.preventDefault());
    });
  }

  read() {
    const left = this.keys.has('arrowleft') || this.keys.has('a') || this.touch.left;
    const right = this.keys.has('arrowright') || this.keys.has('d') || this.touch.right;
    const jump = this.keys.has(' ') || this.keys.has('arrowup') || this.keys.has('w') || this.touch.jump;
    const interact = this.keys.has('e') || this.touch.interact;
    const result = { left, right, jump, jumpPressed: this.jumpPressed, interact, interactPressed: this.interactPressed };
    this.jumpPressed = false;
    this.interactPressed = false;
    return result;
  }
}
const input = new InputController();

function persist() {
  const progress = clamp((game.player?.x || 80) / game.world.width * 100, 0, 100);
  const data = writeSave({
    checkpoint: game.checkpoint,
    bestProgress: Math.max(game.bestProgress, progress),
    soundOn: game.soundOn,
    completed: game.completed
  });
  game.bestProgress = data.bestProgress;
}

function newRun(checkpoint = 80) {
  game.world = createWorld();
  game.checkpoint = checkpoint;
  game.player = new Player(checkpoint, game.world.floorY);
  game.drownTimer = 0;
  game.deathTimer = 0;
  game.toast = checkpoint > 80 ? 'YOU REMEMBER THIS PLACE' : 'THE FOREST IS LISTENING';
  game.toastTimer = 3.2;
  game.startedAt = performance.now();
}

function showOnly(screen) {
  [ui.menu, ui.pause, ui.death, ui.complete].forEach(el => el.classList.remove('visible'));
  if (screen) screen.classList.add('visible');
  ui.touchControls.classList.toggle('active', game.state === 'playing');
}

async function enterImmersiveMode() {
  // Fullscreen/orientation lock must be requested from a user gesture.
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (_) { /* Fullscreen may be blocked inside some browsers/iframes. */ }
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('landscape');
  } catch (_) { /* The rotate prompt remains available when locking is unsupported. */ }
}

function startNew() {
  enterImmersiveMode();
  audio.unlock();
  newRun(80);
  game.state = 'playing';
  showOnly(null);
  ui.hint.classList.add('show');
  persist();
}

function continueRun() {
  enterImmersiveMode();
  audio.unlock();
  newRun(game.checkpoint);
  game.state = 'playing';
  showOnly(null);
  ui.hint.classList.add('show');
}

function pauseGame() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  showOnly(ui.pause);
  persist();
}

function resumeGame() {
  if (game.state !== 'paused') return;
  audio.unlock();
  game.state = 'playing';
  showOnly(null);
}

function die() {
  if (game.state !== 'playing') return;
  game.state = 'dying';
  game.player.dead = true;
  game.deathTimer = 0.62;
  audio.death();
}

function showDeath() {
  game.state = 'dead';
  showOnly(ui.death);
  persist();
}

function win() {
  if (game.state !== 'playing') return;
  game.state = 'complete';
  game.completed = true;
  audio.complete();
  showOnly(ui.complete);
  persist();
}

function setToast(text, seconds = 2.4) {
  game.toast = text;
  game.toastTimer = seconds;
}

function update(dt) {
  game.dt = dt;
  if (game.toastTimer > 0) game.toastTimer = Math.max(0, game.toastTimer - dt);
  if (game.state === 'dying') {
    game.deathTimer -= dt;
    if (game.deathTimer <= 0) showDeath();
    return;
  }
  if (game.state !== 'playing') return;

  const controls = input.read();
  updateWorld(game.world, dt, game.player);
  game.player.update(dt, controls, game.world, audio);
  const playerBounds = game.player.bounds;
  const spiderBounds = { x: game.world.spider.x + 4, y: game.world.spider.y + 5, w: game.world.spider.w - 8, h: game.world.spider.h - 4 };
  const spike = game.world.spikes[0];

  if (aabbOverlap(playerBounds, { x: spike.x + 3, y: spike.y + 5, w: spike.w - 6, h: spike.h })) die();
  if (aabbOverlap(playerBounds, spiderBounds)) die();
  const branch = game.world.branch;
  if (!branch.landed && branch.y > branch.baseY + 60 && aabbOverlap(playerBounds, { x: branch.x + 5, y: branch.y, w: 80, h: 18 })) die();
  if (game.player.y > 620) die();

  if (game.player.inWater && game.player.y > game.world.water.y + 10) game.drownTimer += dt;
  else game.drownTimer = Math.max(0, game.drownTimer - dt * 1.6);
  if (game.drownTimer > 3.1) die();

  for (const cp of game.world.checkpoints) {
    if (game.player.x + game.player.w / 2 > cp && game.checkpoint < cp) {
      game.checkpoint = cp;
      audio.checkpoint();
      setToast('MEMORY ANCHORED');
      persist();
    }
    if (controls.interactPressed && Math.abs(game.player.x + game.player.w / 2 - cp) < 90) {
      game.checkpoint = cp;
      audio.interact();
      setToast('THIS PLACE WILL REMEMBER YOU');
      persist();
    }
  }

  if (controls.interactPressed && Math.abs(game.player.x - game.world.crate.x) < 110) {
    audio.interact();
    setToast(game.world.plate.active ? 'THE WEIGHT HAS OPENED THE WAY' : 'SOMEWHERE A STONE PLATE WAITS FOR WEIGHT');
  }
  if (game.world.plate.active && !game.world.gate.open) {
    game.world.gate.open = true;
    setToast('THE IRON GATE HAS AWAKENED');
  }

  if (game.world.gate.open && aabbOverlap(playerBounds, game.world.exit)) win();
  const progress = clamp(game.player.x / game.world.width * 100, 0, 100);
  ui.progress.style.width = `${progress}%`;
  ui.progressLabel.textContent = `${Math.floor(progress)}%`;
  ui.objective.textContent = game.world.gate.open ? 'Cross the drowned passage.' : 'Move the timber crate onto the stone plate.';
  if (performance.now() - game.lastSaveAt > 8000) {
    game.lastSaveAt = performance.now();
    persist();
  }
}

ui.startBtn.addEventListener('click', startNew);
ui.restartBtn.addEventListener('click', startNew);
ui.retryBtn.addEventListener('click', () => { newRun(game.checkpoint); game.state = 'playing'; showOnly(null); });
ui.continueBtn.addEventListener('click', continueRun);
ui.resumeBtn.addEventListener('click', resumeGame);
ui.pauseBtn.addEventListener('click', pauseGame);
ui.resetBtn.addEventListener('click', () => {
  clearSave(); game.checkpoint = 80; game.bestProgress = 0; game.completed = false; newRun(80); game.state = 'playing'; showOnly(null); persist();
});

function toggleSound() {
  game.soundOn = !game.soundOn;
  audio.setEnabled(game.soundOn);
  if (game.soundOn) { audio.unlock(); audio.interact(); }
  ui.soundBtn.textContent = game.soundOn ? '♪' : '×';
  ui.soundMenuBtn.textContent = game.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
  persist();
}
ui.soundBtn.addEventListener('click', toggleSound);
ui.soundMenuBtn.addEventListener('click', toggleSound);

let lastTime = 0;
function frame(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.035) : 0;
  lastTime = time;
  update(dt);
  if (!game.player) game.player = new Player(80, game.world.floorY);
  renderer.render(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Pause when the page loses visibility so a hidden mobile tab cannot kill the player.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') pauseGame();
});

// Allow a first tap anywhere on the canvas to unlock mobile audio without taking game action.
canvas.addEventListener('pointerdown', () => audio.unlock(), { once: true });
