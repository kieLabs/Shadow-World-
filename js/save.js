import { makeSaveData } from './core.js';

const STORAGE_KEY = 'gamerkie-shadow-world-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? makeSaveData(JSON.parse(raw)) : makeSaveData();
  } catch {
    return makeSaveData();
  }
}

export function writeSave(data) {
  const safe = makeSaveData(data);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // The game remains playable when browser storage is disabled or full.
  }
  return safe;
}

export function clearSave() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
