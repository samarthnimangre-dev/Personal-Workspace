// High-performance procedural sound synthesizer using Web Audio API
// Zero external audio files, zero network latency, 100% offline capable

const STORAGE_KEY_MUTED = 'arrow_escape_sound_muted';

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY_MUTED);
      this.isMuted = saved === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (this.isMuted || typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Crisp UI tap / select sound
   */
  public playTap(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Smooth upward melodic escape whoosh
   */
  public playEscape(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;

    // Upward pitch glide from 380Hz to 780Hz
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Resonant low-frequency blocked thud / recoil
   */
  public playBlocked(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.value = 280;

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Minor descending warning buzz when losing a life
   */
  public playLifeLost(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Triumphant 4-note ascending chord arpeggio (C5 -> E5 -> G5 -> C6)
   */
  public playWin(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  /**
   * Descending tone when lives run out
   */
  public playGameOver(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.24);
    });
  }

  /**
   * Crisp crystalline snap when hitting/cracking ice
   */
  public playIceCrack(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Sparkling glassy shatter when ice block breaks completely
   */
  public playIceShatter(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const now = ctx.currentTime;
    [2400, 3100, 4200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + i * 0.03 + 0.15);

      gain.gain.setValueAtTime(0.25, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.2);
    });
  }

  /**
   * Fluid 90-degree rotational whoosh when pivot arrow turns
   */
  public playPivotRotate(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Low-frequency bass shockwave + detonation when bomb triggers
   */
  public playBombExplode(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const now = ctx.currentTime;

    // Sub-bass thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.28);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.masterGain ?? ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Ascending pentatonic shimmer for booster activation
   */
  public playBoosterActivate(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 987.77, 1318.5]; // C5, E5, G5, B5, E6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.16);
    });
  }

  /**
   * Gentle two-tone bell chime for hint suggestion
   */
  public playHint(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const notes = [659.25, 987.77]; // E5, B5
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  /**
   * Bright resonant two-tone metallic chime for coin earn/spend
   */
  public playCoin(): void {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;

    const notes = [987.77, 1318.5]; // B5, E6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.24);
    });
  }
}

export const soundEffects = new SoundEffectsManager();
