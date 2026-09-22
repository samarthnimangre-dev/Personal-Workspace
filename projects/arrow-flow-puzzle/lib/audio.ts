// Web Audio API Procedural Sound Synthesizer
// Zero external mp3/wav files required - 100% reliable, zero latency, works completely offline

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Crisp mechanical tactile click
  public playTap() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Supersonic whoosh + rising harmonic chord based on combo streak
  public playWhoosh(combo: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Pentatonic scale frequencies: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const noteIndex = Math.min(combo - 1, pentatonic.length - 1);
    const baseFreq = pentatonic[Math.max(0, noteIndex)];

    // 1. Supersonic swoosh noise
    const oscNoise = ctx.createOscillator();
    const gainNoise = ctx.createGain();
    oscNoise.type = 'sine';
    oscNoise.frequency.setValueAtTime(baseFreq * 0.8, now);
    oscNoise.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.18);

    gainNoise.gain.setValueAtTime(0.2, now);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscNoise.connect(gainNoise);
    gainNoise.connect(ctx.destination);
    oscNoise.start(now);
    oscNoise.stop(now + 0.22);

    // 2. Harmonic bell chime
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(baseFreq, now);

    bellGain.gain.setValueAtTime(0.25, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now);
    bellOsc.stop(now + 0.38);
  }

  // Blocked thud / tactile rejection buzz
  public playBlocked() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Crushing hammer disintegration hit
  public playHammer() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Low punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.32);

    // High metal crack
    const crackOsc = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(800, now);
    crackOsc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    crackGain.gain.setValueAtTime(0.18, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    crackOsc.connect(crackGain);
    crackGain.connect(ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.1);
  }

  // Magical celestial hint shimmer
  public playHint() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  // Crisp double coin clink
  public playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  // Magnet clear vortex sweep
  public playMagnet() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // Triumphant victory arpeggio
  public playWin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C major 9 arpeggio: C4, E4, G4, B4, C5, E5, G5
    const fanfare = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 1046.50];

    fanfare.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;
      const duration = idx === fanfare.length - 1 ? 0.8 : 0.25;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    });
  }
}

export const sound = new SoundEngine();
