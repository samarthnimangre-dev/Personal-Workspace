// Deterministic seeded pseudo-random number generator (Mulberry32)
// Pure TypeScript - reproducible across any OS/runtime

export class SeededRng {
  private state: number;

  constructor(seed: number | string = 1337) {
    this.state = typeof seed === 'string' ? SeededRng.hashString(seed) : seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  // FNV-1a 32-bit hash function to convert arbitrary strings into numeric seeds
  private static hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Returns a pseudorandom float in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudorandom integer in [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (lo > hi) return lo;
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /**
   * Returns a random element from an array
   */
  choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot select choice from an empty array');
    }
    const index = Math.floor(this.next() * items.length);
    return items[index];
  }

  /**
   * Performs an in-place Fisher-Yates shuffle deterministically
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  /**
   * Creates a combined numeric seed from a level number and seed value
   */
  static combineSeed(levelNumber: number, seed: number | string = 0): number {
    const base = typeof seed === 'string' ? SeededRng.hashString(seed) : seed >>> 0;
    return (base ^ Math.imul(levelNumber, 2654435761)) >>> 0;
  }
}
