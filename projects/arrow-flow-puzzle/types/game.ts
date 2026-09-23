export type ArrowDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

export interface ArrowTile {
  id: string;
  row: number;
  col: number;
  direction: ArrowDirection;
  color?: string;
  isRemoving?: boolean;
  removalDirection?: ArrowDirection;
  isBlockedShake?: boolean;
  isHinted?: boolean;
  isPivot?: boolean; // Rotates 90 degrees clockwise on collision
  isFrozen?: boolean; // Encased in ice, requires a hit to break free
  hitsLeft?: number; // Remaining hits to break ice
  isBomb?: boolean; // Detonates on tap, clearing 3x3 radius
  rotationDeg?: number; // Visual angle override for animated pivots
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle?: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';
  rows: number;
  cols: number;
  arrows: ArrowTile[];
  parMoves: number;
  rewardCoins: number;
  rewardGems: number;
}

export interface UserEconomy {
  coins: number;
  gems: number;
  hints: number;
  hammers: number;
  undos: number;
  magnets: number;
  vipUnlocked: boolean;
  activeTheme: string;
  unlockedThemes: string[];
  soundEnabled: boolean;
  completedLevels: number[];
  highScores: Record<number, number>; // levelId -> stars/score
  streakDays: number;
  lastDailyClaim: string | null;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  tagline: string;
  priceCoins: number;
  priceGems: number;
  gradientBg: string;
  boardBg: string;
  gridBorder: string;
  arrowBg: string;
  arrowBorder: string;
  arrowColor: string;
  arrowGlow: string;
  accentColor: string;
}

export interface HistoryMove {
  arrow: ArrowTile;
  index: number;
}
