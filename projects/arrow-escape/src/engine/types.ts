// Core domain types for the Arrow Escape puzzle game engine
// Pure TypeScript - zero UI or framework dependencies

export type GameTheme = 'dark' | 'minimal-white' | 'eye-comfort' | 'light';

export type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';


export interface Position {
  readonly row: number;
  readonly col: number;
}

export interface DirectionDelta {
  readonly dRow: number;
  readonly dCol: number;
}

export type ArrowState = 'idle' | 'escaping' | 'escaped' | 'blocked';

export type MaskShape = 'square' | 'cross' | 'heart' | 'star' | 'diamond' | 'custom';

export interface DeflectorTile {
  readonly row: number;
  readonly col: number;
  readonly redirectDirection: Direction;
}

export interface ArrowData {
  readonly id: string;
  readonly direction: Direction;
  readonly head?: Position;
  readonly occupiedCells?: readonly Position[];
  readonly color?: string;
  // Shorthand 1-cell coordinates:
  readonly row?: number;
  readonly col?: number;
  // Upgraded obstacle & archetype flags:
  readonly isFrozen?: boolean;
  readonly frozenHits?: number;
  readonly isPivot?: boolean;
  readonly isBomb?: boolean;
  readonly isHinted?: boolean;
}

export interface RaycastResult {
  readonly canEscape: boolean;
  readonly blockerId?: string;
  readonly blockerCell?: Position;
  readonly path: readonly Position[];
  readonly deflectorHit?: DeflectorTile;
}

export type MoveActionType =
  | 'escape'
  | 'blocked'
  | 'iceCrack'
  | 'iceShatter'
  | 'pivotRotate'
  | 'bombDetonate'
  | 'boosterHammer'
  | 'undo';

export interface MoveResult {
  readonly success: boolean;
  readonly arrowId: string;
  readonly blockerId?: string;
  readonly path: readonly Position[];
  readonly actionType?: MoveActionType;
  readonly affectedArrowIds?: readonly string[];
}

export interface LevelData {
  readonly id: number;
  readonly name: string;
  readonly rows: number;
  readonly cols: number;
  readonly parMoves: number;
  readonly arrows: readonly ArrowData[];
  readonly subtitle?: string;
  readonly difficulty?: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';
  readonly maskShape?: MaskShape;
  readonly mask?: readonly string[];
  readonly deflectors?: readonly DeflectorTile[];
  readonly rewardCoins?: number;
}

export type BoosterType = 'hint' | 'hammer' | 'bomb' | 'undo';

export interface UserProgress {
  readonly currentLevel: number;
  readonly completedLevels: readonly number[];
  readonly bestMoves: Readonly<Record<number, number>>;
  readonly coins?: number;
  readonly inventory?: Readonly<Record<BoosterType, number>>;
  readonly stars?: Readonly<Record<number, number>>;
}

