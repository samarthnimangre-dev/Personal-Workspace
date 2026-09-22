import { UserEconomy } from '@/types/game';

const STORAGE_KEY = 'arrowflow_player_save_v1';

export const DEFAULT_ECONOMY: UserEconomy = {
  coins: 200,
  gems: 30,
  hints: 5,
  hammers: 3,
  undos: 5,
  magnets: 2,
  vipUnlocked: false,
  activeTheme: 'cyber-neon',
  unlockedThemes: ['cyber-neon'],
  soundEnabled: true,
  completedLevels: [],
  highScores: {},
  streakDays: 1,
  lastDailyClaim: null,
};

export function loadEconomy(): UserEconomy {
  if (typeof window === 'undefined') return DEFAULT_ECONOMY;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ECONOMY;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ECONOMY,
      ...parsed,
    };
  } catch {
    return DEFAULT_ECONOMY;
  }
}

export function saveEconomy(data: UserEconomy): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save game data:', err);
  }
}
