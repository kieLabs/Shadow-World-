import { aabbOverlap, clamp } from './core.js';
import { AudioFX } from './audio.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { createWorld, updateWorld } from './world.js';
import { clearSave, loadSave, writeSave } from './save.js';
import { InputController } from './input.js';

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
  nextLevelBtn: document.querySelector('#nextLevelBtn'),
  resumeBtn: document.querySelector('#resumeBtn'),
  retryBtn: document.querySelector('#retryBtn'),
  soundBtn: document.querySelector('#soundBtn'),
  soundMenuBtn: document.querySelector('#soundMenuBtn'),
  pauseBtn: document.querySelector('#pauseBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  objective: document.querySelector('#objectiveText'),
  levelNumber: document.querySelector('#levelNumber'),
  worldName: document.querySelector('#worldName'),
  progress: document.querySelector('#progressFill'),
  progressLabel: document.querySelector('#progressLabel'),
  footerChapter: document.querySelector('#footerChapter'),
  touchControls: document.querySelector('#touchControls'),
  touchPauseBtn: document.querySelector('#touchPauseBtn'),
  hint: document.querySelector('#controlHint'),
  runtimeError: document.querySelector('#runtimeError'),
  reloadGameBtn: document.querySelector('#reloadGameBtn')
};

const game = {
  state: 'menu',
  world: createWorld(),
  player: null,
  dt: 0,
  toast: '',
  toastTimer: 0,
  checkpoint: 80,
  currentLevel: saved.unlockedLevel || saved.checkpoint || 1,
  unlockedLevel: saved.unlockedLevel || saved.checkpoint || 1,
  bestProgress: saved.bestProgress,
  soundOn: saved.soundOn,
  completed: saved.completed,
  drownTimer: 0,
  deathTimer: 0,
  lastSaveAt: 0,
  startedAt: 0
};

audio.setEnabled(game.soundOn);
ui.continueBtn.disabled = (saved.unlockedLevel || saved.checkpoint || 1) <= 1 && !saved.completed;
ui.soundMenuBtn.textContent = game.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
ui.soundBtn.textContent = game.soundOn ? '♪' : '×';

const input = new InputController({ onAction: () => audio.unlock() });

function persist() {
  const progress = clamp((game.player?.x || 80) / game.world.width * 100, 0, 100);
  const data = writeSave({
    checkpoint: game.currentLevel,
    unlockedLevel: game.unlockedLevel,
    bestProgress: Math.max(game.bestProgress, progress),
    soundOn: game.soundOn,
    completed: game.completed
  });
  game.bestProgress = data.bestProgress;
}

function newRun(level = 1, spawnX = 80) {
  game.currentLevel = Math.max(1, Math.min(40, level));
  game.world = createWorld(game.currentLevel);
  renderer.cameraX = 0;
  game.checkpoint = spawnX;
  game.player = new Player(spawnX, game.world.floorY);
  game.drownTimer = 0;
  game.deathTimer = 0;
  game.toast = `CHAPTER ${game.currentLevel} — ${game.world.chapterTitle}`;
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
  newRun(1);
  game.state = 'playing';
  showOnly(null);
  ui.hint.classList.add('show');
  persist();
}

function continueRun() {
  enterImmersiveMode();
  audio.unlock();
  newRun(game.unlockedLevel);
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
  const deathEyebrow = ui.death.querySelector('.eyebrow');
  if (deathEyebrow) deathEyebrow.lastChild.textContent = ` ${game.world.worldName} CLAIMS ANOTHER`;
  game.state = 'dead';
  showOnly(ui.death);
  persist();
}

function win() {
  if (game.state !== 'playing') return;
  const nextBtn = ui.nextLevelBtn;
  const completeTitle = ui.complete.querySelector('h2');
  const completeEyebrow = ui.complete.querySelector('.eyebrow');
  const completeCopy = ui.complete.querySelector('.dialog-panel > p');
  const completeBadge = ui.complete.querySelector('.chapter-complete');
  if (completeTitle) completeTitle.innerHTML = game.currentLevel >= 40 ? 'THE END<br><em>OF THE VEIL</em>' : 'CHAPTER<br><em>SURVIVED</em>';
  if (completeEyebrow) completeEyebrow.lastChild.textContent = ` CHAPTER ${String(game.currentLevel).padStart(2, '0')} COMPLETE`;
  if (completeCopy) completeCopy.textContent = game.currentLevel >= 40 ? 'The darkness has a name. You finally know it.' : 'The silence moves with you. The next passage is worse.';
  if (completeBadge) completeBadge.innerHTML = `${game.world.chapterTitle.toUpperCase()} <span>✓</span>`;
  if (nextBtn) nextBtn.textContent = game.currentLevel >= 40 ? 'THE END — RETURN TO MENU' : `ENTER CHAPTER ${game.currentLevel + 1}  ↗`;
  game.state = 'complete';
  game.completed = game.currentLevel >= 40;
  game.unlockedLevel = Math.min(40, Math.max(game.unlockedLevel, game.currentLevel + 1));
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
  const gateWasOpen = game.world.gate.open;
  updateWorld(game.world, dt, game.player);
  if (!gateWasOpen && game.world.gate.open) setToast('THE FINAL GATE HAS OPENED');
  game.player.update(dt, controls, game.world, audio);
  const playerBounds = game.player.bounds;
  for (const spider of game.world.spiders) {
    const spiderBounds = { x: spider.x + 4, y: spider.y + 5, w: spider.w - 8, h: spider.h - 4 };
    if (aabbOverlap(playerBounds, spiderBounds)) die();
  }
  for (const spike of game.world.spikes) {
    if (aabbOverlap(playerBounds, { x: spike.x + 3, y: spike.y + 5, w: spike.w - 6, h: spike.h })) die();
  }
  for (const branch of game.world.branches) {
    if (!branch.landed && branch.warning <= 0 && branch.y > branch.baseY + 45 && aabbOverlap(playerBounds, { x: branch.x + 5, y: branch.y, w: 80, h: 18 })) die();
  }
  for (const stalker of game.world.stalkers) {
    if (aabbOverlap(playerBounds, { x: stalker.x + 8, y: stalker.y + 7, w: stalker.w - 16, h: stalker.h - 8 })) die();
  }
  for (const saw of game.world.saws) {
    if (aabbOverlap(playerBounds, { x: saw.x + 5, y: saw.y + 4, w: saw.w - 10, h: saw.h - 7 })) die();
  }
  for (const tunnel of game.world.tunnels) {
    if (!game.player.crouching && aabbOverlap(playerBounds, tunnel)) die();
  }
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

  if (controls.interactPressed) {
    const nearSwitch = game.world.switches.find(item => !item.activated && Math.abs((game.player.x + game.player.w / 2) - (item.x + item.w / 2)) < 86 && Math.abs((game.player.y + game.player.h / 2) - (item.y + item.h / 2)) < 78);
    if (nearSwitch) {
      nearSwitch.activated = true;
      audio.interact();
      setToast(`SIGNAL RELAY ${nearSwitch.id + 1} RESTORED`);
    } else if (Math.abs(game.player.x - game.world.crate.x) < 110) {
      audio.interact();
      setToast(game.world.plate.active ? 'THE WEIGHT IS IN PLACE' : 'PUSH THE TIMBER CRATE ONTO THE PRESSURE PLATE');
    }
  }
  if (game.world.gate.open && aabbOverlap(playerBounds, game.world.exit)) win();
  const progress = clamp(game.player.x / game.world.width * 100, 0, 100);
  ui.progress.style.width = `${progress}%`;
  ui.progressLabel.textContent = `${Math.floor(progress)}%`;
  if (ui.levelNumber) ui.levelNumber.textContent = String(game.currentLevel).padStart(2, '0');
  if (ui.worldName) ui.worldName.textContent = game.world.worldName;
  if (ui.footerChapter) ui.footerChapter.innerHTML = `CHAPTER ${String(game.currentLevel).padStart(2, '0')} <b> / 40</b>`;
  const remainingRelays = game.world.switches.filter(item => !item.activated).length;
  ui.objective.textContent = !game.world.plate.active
    ? 'Push the timber crate onto the pressure plate.'
    : remainingRelays > 0
      ? `Climb the ladders, stand by each red relay and press E (${remainingRelays} left).`
      : `All paths are open. Reach the exit — Chapter ${game.currentLevel}/40.`;
  if (performance.now() - game.lastSaveAt > 8000) {
    game.lastSaveAt = performance.now();
    persist();
  }
}

ui.startBtn.addEventListener('click', startNew);
ui.reloadGameBtn?.addEventListener('click', () => window.location.reload());
ui.nextLevelBtn?.addEventListener('click', () => { if (game.currentLevel >= 40) { game.state = 'menu'; showOnly(ui.menu); return; } newRun(game.currentLevel + 1); game.unlockedLevel = Math.max(game.unlockedLevel, game.currentLevel); game.state = 'playing'; showOnly(null); persist(); });
if (ui.restartBtn) ui.restartBtn.addEventListener('click', startNew);
ui.retryBtn.addEventListener('click', () => { newRun(game.currentLevel, game.checkpoint); game.state = 'playing'; showOnly(null); });
ui.continueBtn.addEventListener('click', continueRun);
ui.resumeBtn.addEventListener('click', resumeGame);
ui.pauseBtn.addEventListener('click', pauseGame);
ui.touchPauseBtn?.addEventListener('click', pauseGame);
ui.resetBtn.addEventListener('click', () => {
  clearSave(); game.checkpoint = 80; game.unlockedLevel = 1; game.bestProgress = 0; game.completed = false; newRun(1); game.state = 'playing'; showOnly(null); persist();
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
let animationStopped = false;
function frame(time) {
  if (animationStopped) return;
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.035) : 0;
  lastTime = time;
  try {
    update(dt);
    if (!game.player) game.player = new Player(80, game.world.floorY);
    renderer.render(game);
  } catch (error) {
    // Never leave the player with a silent black canvas if a browser graphics
    // feature is missing. Keep the failure visible and offer a clean reload.
    console.error('SHADOW WORLD stopped while rendering:', error);
    animationStopped = true;
    ui.runtimeError?.classList.add('visible');
    ui.touchControls?.classList.remove('active');
    const detail = ui.runtimeError?.querySelector('#runtimeErrorDetail');
    if (detail) detail.textContent = 'Your browser stopped drawing the game. Reload this page or open it in an updated Chrome browser.';
    return;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Pause when the page loses visibility so a hidden mobile tab cannot kill the player.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') pauseGame();
});

// Allow a first tap anywhere on the canvas to unlock mobile audio without taking game action.
canvas.addEventListener('pointerdown', () => audio.unlock(), { once: true });
