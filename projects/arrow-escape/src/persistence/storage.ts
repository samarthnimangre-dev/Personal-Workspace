// LocalStorage persistence with memory fallback for user progress and game settings
import type { UserProgress, GameTheme } from '../engine/types';

const PROGRESS_STORAGE_KEY = 'arrow_escape_user_progress_v1';
const SETTINGS_STORAGE_KEY = 'arrow_escape_user_settings_v1';

export interface GameSettings {
  soundMuted: boolean;
  hapticsEnabled: boolean;
  theme: GameTheme;
  zenMode: boolean;
  showGridDots: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundMuted: false,
  hapticsEnabled: true,
  theme: 'dark',
  zenMode: false,
  showGridDots: true,
};


const DEFAULT_PROGRESS: UserProgress = {
  currentLevel: 1,
  completedLevels: [],
  bestMoves: {},
  coins: 100,
  inventory: {
    hint: 3,
    hammer: 2,
    bomb: 2,
    undo: 3,
  },
  stars: {},
};

// In-memory fallback map for Node test runners, SSR, or private browsing restrictions
const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fallback to memoryStorage
  }
  return memoryStorage.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Fallback to memoryStorage
  }
  memoryStorage.set(key, value);
}

export function loadSettings(): GameSettings {
  try {
    const raw = getStorageItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const validThemes: GameTheme[] = ['dark', 'minimal-white', 'eye-comfort', 'light'];
    const parsedTheme = parsed.theme;
    const theme: GameTheme = validThemes.includes(parsedTheme as GameTheme)
      ? (parsedTheme as GameTheme)
      : DEFAULT_SETTINGS.theme;

    return {
      soundMuted: typeof parsed.soundMuted === 'boolean' ? parsed.soundMuted : DEFAULT_SETTINGS.soundMuted,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled,
      theme,
      zenMode: typeof parsed.zenMode === 'boolean' ? parsed.zenMode : DEFAULT_SETTINGS.zenMode,
      showGridDots: typeof parsed.showGridDots === 'boolean' ? parsed.showGridDots : DEFAULT_SETTINGS.showGridDots,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}


export function saveSettings(settings: GameSettings): void {
  try {
    setStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage fallback
  }
}

export function loadProgress(): UserProgress {
  try {
    const raw = getStorageItem(PROGRESS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : 1,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      bestMoves: typeof parsed.bestMoves === 'object' && parsed.bestMoves !== null ? parsed.bestMoves : {},
      coins: typeof parsed.coins === 'number' ? parsed.coins : DEFAULT_PROGRESS.coins,
      inventory: {
        hint: parsed.inventory?.hint ?? DEFAULT_PROGRESS.inventory!.hint,
        hammer: parsed.inventory?.hammer ?? DEFAULT_PROGRESS.inventory!.hammer,
        bomb: parsed.inventory?.bomb ?? DEFAULT_PROGRESS.inventory!.bomb,
        undo: parsed.inventory?.undo ?? DEFAULT_PROGRESS.inventory!.undo,
      },
      stars: typeof parsed.stars === 'object' && parsed.stars !== null ? parsed.stars : {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    setStorageItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage fallback
  }
}

export function recordLevelCompletion(
  current: UserProgress,
  levelId: number,
  moves: number,
  starsEarned: number = 3,
  rewardCoins: number = 50
): UserProgress {
  const nextCompleted = Array.from(new Set([...current.completedLevels, levelId]));
  const currentBest = current.bestMoves[levelId];
  const nextBestMoves = {
    ...current.bestMoves,
    [levelId]: currentBest !== undefined ? Math.min(currentBest, moves) : moves,
  };

  const currentStars = current.stars?.[levelId] ?? 0;
  const nextStars = {
    ...(current.stars ?? {}),
    [levelId]: Math.max(currentStars, starsEarned),
  };

  const updated: UserProgress = {
    currentLevel: Math.max(current.currentLevel, levelId + 1),
    completedLevels: nextCompleted,
    bestMoves: nextBestMoves,
    coins: (current.coins ?? 100) + rewardCoins,
    inventory: current.inventory ?? DEFAULT_PROGRESS.inventory,
    stars: nextStars,
  };

  saveProgress(updated);
  return updated;
}

