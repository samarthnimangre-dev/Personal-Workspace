import * as fs from 'fs';
import * as path from 'path';

// Pure Node.js 16-bit 44.1kHz Stereo WAV Synthesizer
function createWavBuffer(sampleRate: number, numChannels: number, samples: Float32Array): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, offset);
    offset += 2;
  }

  return buffer;
}

const SAMPLE_RATE = 44100;

// 1. Tactile Click
function synthTap(): Buffer {
  const duration = 0.04;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 420 * Math.exp(-t * 30);
    const env = Math.exp(-t * 80);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 2. Escape Whoosh & Chime
function synthWhoosh(): Buffer {
  const duration = 0.28;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Rising sweep
    const sweepFreq = 300 + 700 * (t / duration);
    const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * Math.sin((Math.PI * t) / duration);
    // Harmonic bell chime at 523Hz (C5)
    const bell = Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 8);
    samples[i] = (sweep * 0.4 + bell * 0.6) * 0.7;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 3. Blocked Thud
function synthBlocked(): Buffer {
  const duration = 0.14;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 140 * Math.exp(-t * 8);
    const env = Math.exp(-t * 25);
    // Sawtooth-like thud
    const phase = (freq * t) % 1;
    const wave = 2 * phase - 1;
    samples[i] = wave * env * 0.6;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 4. Hammer Disintegrate
function synthHammer(): Buffer {
  const duration = 0.35;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const sub = Math.sin(2 * Math.PI * (160 * Math.exp(-t * 6)) * t) * Math.exp(-t * 7);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);
    samples[i] = (sub * 0.7 + noise * 0.3) * 0.8;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 5. Coin Ding
function synthCoin(): Buffer {
  const duration = 0.22;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const ding1 = Math.sin(2 * Math.PI * 987.77 * t) * Math.exp(-t * 12);
    const ding2 = Math.sin(2 * Math.PI * 1318.51 * t) * Math.exp(-t * 10);
    samples[i] = (ding1 * 0.5 + ding2 * 0.5) * 0.6;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 6. Super Magnet
function synthMagnet(): Buffer {
  const duration = 0.4;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 180 + 600 * Math.pow(t / duration, 2);
    const env = Math.sin((Math.PI * t) / duration);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// 7. Victory Fanfare
function synthVictory(): Buffer {
  const duration = 0.9;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C E G C E G C
  const noteDuration = 0.1;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    notes.forEach((freq, idx) => {
      const noteStart = idx * noteDuration;
      if (t >= noteStart && t < noteStart + 0.3) {
        const localT = t - noteStart;
        sample += Math.sin(2 * Math.PI * freq * localT) * Math.exp(-localT * 6) * 0.35;
      }
    });

    samples[i] = Math.max(-1, Math.min(1, sample));
  }
  return createWavBuffer(SAMPLE_RATE, 1, samples);
}

// Output Directories
const publicAudioDir = path.resolve(__dirname, '../public/audio');
const unityAudioDir = path.resolve(__dirname, '../unity/Assets/Audio');

[publicAudioDir, unityAudioDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const audioClips: Record<string, Buffer> = {
  'tap.wav': synthTap(),
  'whoosh.wav': synthWhoosh(),
  'blocked.wav': synthBlocked(),
  'hammer.wav': synthHammer(),
  'coin.wav': synthCoin(),
  'magnet.wav': synthMagnet(),
  'victory.wav': synthVictory(),
};

console.log('🎵 Synthesizing 16-Bit 44.1kHz Game Audio WAV Assets...');

Object.entries(audioClips).forEach(([filename, buffer]) => {
  const p1 = path.join(publicAudioDir, filename);
  const p2 = path.join(unityAudioDir, filename);
  fs.writeFileSync(p1, buffer);
  fs.writeFileSync(p2, buffer);
  console.log(`  ✓ Generated ${filename} (${buffer.length} bytes)`);
});

console.log('✅ All Game Sound Effects generated in public/audio and unity/Assets/Audio!');
