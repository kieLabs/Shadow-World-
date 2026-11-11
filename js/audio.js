(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  SW.Audio = {
    ctx: null,
    enabled: true,
    droneGain: null,
    initialized: false,

    init: function() {
      if (this.initialized || !this.enabled) return;
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.ctx = new AudioCtx();
        this.initialized = true;
        this.startAmbientDrone();
      } catch (e) {
        this.initialized = false;
      }
    },

    resume: function() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function() {});
      }
    },

    toggle: function() {
      this.enabled = !this.enabled;
      if (!this.enabled && this.droneGain && this.ctx) {
        this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      } else if (this.enabled) {
        this.resume();
        if (this.droneGain && this.ctx) {
          this.droneGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.2);
        }
      }
      return this.enabled;
    },

    startAmbientDrone: function() {
      if (!this.ctx) return;
      const sr = this.ctx.sampleRate;
      const len = sr * 3;
      const buf = this.ctx.createBuffer(1, len, sr);
      const out = buf.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = out[i];
        out[i] *= 0.35;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 135;

      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.value = 46;

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.value = 85;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.value = this.enabled ? 0.12 : 0.0;

      noise.connect(filter);
      filter.connect(this.droneGain);
      subOsc.connect(subFilter);
      subFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      noise.start(0);
      subOsc.start(0);
    },

    playTone: function(freq, endFreq, duration, type, vol) {
      if (!this.enabled) return;
      this.resume();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(18, endFreq), now + duration);
      gain.gain.setValueAtTime(vol || 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    },

    playStep: function() {
      this.playTone(95 + Math.random() * 25, 32, 0.055, 'triangle', 0.06);
    },
    playJump: function() {
      this.playTone(130, 290, 0.14, 'sine', 0.11);
    },
    playTrapSnap: function() {
      this.playTone(620, 48, 0.19, 'sawtooth', 0.28);
    },
    playSawHum: function() {
      this.playTone(180, 165, 0.09, 'sawtooth', 0.04);
    },
    playElectricArc: function() {
      this.playTone(880, 210, 0.11, 'square', 0.09);
    },
    playGravityFlip: function() {
      this.playTone(220, 440, 0.28, 'sine', 0.16);
    },
    playEggFound: function() {
      this.playTone(520, 880, 0.45, 'sine', 0.18);
    },
    playDeath: function() {
      this.playTone(310, 28, 0.55, 'sawtooth', 0.32);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
