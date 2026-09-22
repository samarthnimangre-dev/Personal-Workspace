// High-Fidelity ASMR Web Audio Synthesizer & Procedural Sound Engine
// Zero external files, zero audio latency, 100% offline-ready

import { triggerHaptic } from './haptics';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Hypnotic zen ambient drone pad (generates warm ASMR background chord)
  public startAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Master ambient gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 3);

      // Low pass filter to keep it warm, deep and unobtrusive
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      // Osc 1: Root note (F2 = 87.31Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(87.31, now);

      // Osc 2: Fifth note (C3 = 130.81Hz) with subtle detune for warm chorus
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(130.81, now);
      osc2.detune.setValueAtTime(7, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      this.ambientOsc1 = osc1;
      this.ambientOsc2 = osc2;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        try {
          this.ambientOsc1?.stop();
          this.ambientOsc2?.stop();
          this.ambientOsc1?.disconnect();
          this.ambientOsc2?.disconnect();
        } catch {}
        this.ambientOsc1 = null;
        this.ambientOsc2 = null;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
      }, 500);
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  // Crisp tactile click on UI buttons
  public playTap() {
    triggerHaptic('light');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // Multi-harmonic crystalline chime on unblock + combo scale
  public playWhoosh(combo: number = 1) {
    triggerHaptic(combo > 2 ? 'medium' : 'light');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pentatonic Scale: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6, D6
      const scale = [
        261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5,
        1174.66,
      ];
      const noteIdx = Math.min(Math.max(0, combo - 1), scale.length - 1);
      const fundamental = scale[noteIdx];

      // 1. FM Modulated Bell Chime (Crystalline ASMR resonance)
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const carrierGain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(fundamental, now);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(fundamental * 2.4, now); // Metallic ratio
      modGain.gain.setValueAtTime(fundamental * 0.8, now);
      modGain.gain.exponentialRampToValueAtTime(1, now + 0.3);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      carrierGain.gain.setValueAtTime(0.28, now);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      carrier.connect(carrierGain);
      carrierGain.connect(ctx.destination);

      modulator.start(now);
      carrier.start(now);
      modulator.stop(now + 0.5);
      carrier.stop(now + 0.5);

      // 2. Air whoosh burst
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(fundamental * 1.5, now);
      filter.frequency.exponentialRampToValueAtTime(fundamental * 3.5, now + 0.2);

      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'triangle';
      whooshOsc.frequency.setValueAtTime(180, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(fundamental * 1.2, now + 0.15);

      whooshGain.gain.setValueAtTime(0.14, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whooshOsc.connect(filter);
      filter.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      whooshOsc.start(now);
      whooshOsc.stop(now + 0.22);
    } catch {}
  }

  // Physical collision clank & rebound impact
  public playBlocked() {
    triggerHaptic('error');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Resonant body clack (Ceramic tile impact)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(90, now + 0.08);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(540, now);
      osc2.frequency.exponentialRampToValueAtTime(140, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.1);
      osc2.stop(now + 0.1);
    } catch {}
  }

  // Crushing hammer disintegration
  public playHammer() {
    triggerHaptic('heavy');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub punch
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(180, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.25);
      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.28);

      // Glass shatter noise
      const crack = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(950, now);
      crack.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      crackGain.gain.setValueAtTime(0.25, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      crack.connect(crackGain);
      crackGain.connect(ctx.destination);
      crack.start(now);
      crack.stop(now + 0.15);
    } catch {}
  }

  // Celestial shimmer on hint beacon
  public playHint() {
    triggerHaptic('selection');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.055;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {}
  }

  // Super magnet cascade sound
  public playMagnet() {
    triggerHaptic('medium');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  // Crisp dual-tone metallic coin clink
  public playCoin() {
    triggerHaptic('light');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.065;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {}
  }

  // Triumphant Level Victory Fanfare
  public playWin() {
    triggerHaptic('heavy');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Majestic chord: C major 9 (C4, E4, G4, B4, D5, G5)
      const chord = [261.63, 329.63, 392.0, 493.88, 587.33, 783.99];

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;
        const dur = idx === chord.length - 1 ? 1.2 : 0.4;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.24, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } catch {}
  }
}

export const sound = new SoundEngine();
