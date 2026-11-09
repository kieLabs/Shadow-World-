export class AudioFX {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.context = new AudioContextClass();
    }
    if (this.context?.state === 'suspended') this.context.resume().catch(() => {});
  }

  setEnabled(value) { this.enabled = Boolean(value); }

  tone(frequency, duration = 0.12, type = 'sine', volume = 0.035, endFrequency = null) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }

  jump() { this.tone(190, 0.13, 'triangle', 0.024, 310); }
  land() { this.tone(95, 0.09, 'sine', 0.025, 55); }
  interact() { this.tone(260, 0.16, 'sine', 0.03, 520); }
  checkpoint() { this.tone(330, 0.28, 'sine', 0.035, 660); }
  death() { this.tone(180, 0.42, 'sawtooth', 0.025, 42); }
  complete() { this.tone(220, 0.55, 'triangle', 0.035, 440); }
}
