// LocalStorage persistence for user campaign progress
import type { UserProgress } from '../engine/types';

const STORAGE_KEY = 'arrow_escape_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  currentLevel: 1,
  completedLevels: [],
  bestMoves: {},
};

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : 1,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      bestMoves: typeof parsed.bestMoves === 'object' && parsed.bestMoves !== null ? parsed.bestMoves : {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Quota exceeded or private browsing fallback
  }
}

export function recordLevelCompletion(
  current: UserProgress,
  levelId: number,
  moves: number
): UserProgress {
  const nextCompleted = Array.from(new Set([...current.completedLevels, levelId]));
  const currentBest = current.bestMoves[levelId];
  const nextBestMoves = {
    ...current.bestMoves,
    [levelId]: currentBest !== undefined ? Math.min(currentBest, moves) : moves,
  };

  const updated: UserProgress = {
    currentLevel: Math.max(current.currentLevel, levelId + 1),
    completedLevels: nextCompleted,
    bestMoves: nextBestMoves,
  };

  saveProgress(updated);
  return updated;
}
