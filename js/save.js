(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};
  const STORAGE_KEY = 'SHADOW_WORLD_LIMBO_40_SAVE_V2';

  SW.Save = {
    state: {
      currentChapter: 1,
      maxUnlockedChapter: 40,
      deaths: 0,
      eggsFound: {},
      gestureEnabled: true
    },

    load: function() {
      try {
        const raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state.currentChapter = SW.Math.clamp(parsed.currentChapter || 1, 1, 40);
          this.state.maxUnlockedChapter = 40;
          this.state.deaths = parsed.deaths || 0;
          this.state.eggsFound = parsed.eggsFound || {};
          this.state.gestureEnabled = parsed.gestureEnabled !== false;
        }
      } catch (e) {}
      return this.state;
    },

    save: function() {
      try {
        if (global.localStorage) {
          global.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
      } catch (e) {}
    },

    recordDeath: function() {
      this.state.deaths += 1;
      this.save();
      return this.state.deaths;
    },

    recordEgg: function(eggId) {
      if (!this.state.eggsFound[eggId]) {
        this.state.eggsFound[eggId] = true;
        this.save();
        return true;
      }
      return false;
    },

    getEggCount: function() {
      return Object.keys(this.state.eggsFound).length;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
