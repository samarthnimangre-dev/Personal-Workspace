// Haptic feedback controller supporting modern touch vibration APIs
// Safe fallback on unsupported desktop/iOS browsers

const STORAGE_KEY_HAPTICS = 'arrow_escape_haptics_enabled';

class HapticsManager {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY_HAPTICS);
      this.enabled = saved !== 'false';
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_HAPTICS, String(enabled));
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration permission denials or unsupported devices
    }
  }

  /**
   * Crisp micro-haptic for button or tile tap
   */
  public tap(): void {
    this.vibrate(12);
  }

  /**
   * Snappy pulse for successful arrow escape
   */
  public escape(): void {
    this.vibrate(22);
  }

  /**
   * Staccato dual buzz for blocked collision
   */
  public blocked(): void {
    this.vibrate([28, 30, 28]);
  }

  /**
   * Warning vibration when losing a life
   */
  public lifeLost(): void {
    this.vibrate([45, 35, 65]);
  }

  /**
   * Joyful celebratory pattern on puzzle completion
   */
  public win(): void {
    this.vibrate([35, 40, 35, 40, 70]);
  }

  /**
   * Heavy pattern on game over
   */
  public gameOver(): void {
    this.vibrate([70, 40, 100]);
  }
}

export const haptics = new HapticsManager();
