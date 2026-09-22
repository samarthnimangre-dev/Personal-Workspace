// Core domain types for the Arrow Escape puzzle game engine
// Pure TypeScript - zero UI or framework dependencies

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

export interface ArrowData {
  readonly id: string;
  readonly direction: Direction;
  readonly head?: Position;
  readonly occupiedCells?: readonly Position[];
  readonly color?: string;
  // Shorthand 1-cell coordinates:
  readonly row?: number;
  readonly col?: number;
}

export interface RaycastResult {
  readonly canEscape: boolean;
  readonly blockerId?: string;
  readonly blockerCell?: Position;
  readonly path: readonly Position[];
}

export interface MoveResult {
  readonly success: boolean;
  readonly arrowId: string;
  readonly blockerId?: string;
  readonly path: readonly Position[];
}

export interface LevelData {
  readonly id: number;
  readonly name: string;
  readonly rows: number;
  readonly cols: number;
  readonly parMoves: number;
  readonly arrows: readonly ArrowData[];
}

export interface UserProgress {
  readonly currentLevel: number;
  readonly completedLevels: readonly number[];
  readonly bestMoves: Readonly<Record<number, number>>;
}
