// BoardModel defining grid dimensions, bounds checking, and campaign level configurations
import type { LevelData, Position } from './types';
import { isWithinBounds } from './Direction';

export class BoardModel {
  readonly rows: number;
  readonly cols: number;

  constructor(rows: number, cols: number) {
    if (rows <= 0 || cols <= 0) {
      throw new Error(`Invalid board dimensions: ${rows}x${cols}`);
    }
    this.rows = rows;
    this.cols = cols;
  }

  isInside(position: Position): boolean {
    return isWithinBounds(position, this.rows, this.cols);
  }

  isInsideCoords(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  get totalCells(): number {
    return this.rows * this.cols;
  }
}

// Initial Handcrafted Campaign Levels
export const DEFAULT_LEVELS: readonly LevelData[] = [
  {
    id: 1,
    name: 'First Steps',
    rows: 3,
    cols: 3,
    parMoves: 3,
    arrows: [
      { id: '1-1', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '1-2', row: 1, col: 1, direction: 'left', color: '#3b82f6' },
      { id: '1-3', row: 1, col: 2, direction: 'left', color: '#6366f1' },
    ],
  },
  {
    id: 2,
    name: 'Cross Traffic',
    rows: 3,
    cols: 3,
    parMoves: 4,
    arrows: [
      { id: '2-1', row: 0, col: 1, direction: 'up', color: '#10b981' },
      { id: '2-2', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '2-3', row: 1, col: 2, direction: 'right', color: '#f59e0b' },
      { id: '2-4', row: 2, col: 1, direction: 'down', color: '#ec4899' },
    ],
  },
  {
    id: 3,
    name: 'Spiral Knot',
    rows: 3,
    cols: 3,
    parMoves: 6,
    arrows: [
      { id: '3-1', row: 0, col: 0, direction: 'right', color: '#8b5cf6' },
      { id: '3-2', row: 0, col: 1, direction: 'down', color: '#3b82f6' },
      { id: '3-3', row: 1, col: 1, direction: 'down', color: '#06b6d4' },
      { id: '3-4', row: 2, col: 1, direction: 'left', color: '#10b981' },
      { id: '3-5', row: 2, col: 0, direction: 'down', color: '#f59e0b' },
      { id: '3-6', row: 0, col: 2, direction: 'right', color: '#ec4899' },
    ],
  },
  {
    id: 4,
    name: 'Diagonal Corridors',
    rows: 4,
    cols: 4,
    parMoves: 8,
    arrows: [
      { id: '4-1', row: 0, col: 0, direction: 'up-left', color: '#06b6d4' },
      { id: '4-2', row: 0, col: 3, direction: 'up-right', color: '#3b82f6' },
      { id: '4-3', row: 3, col: 0, direction: 'down-left', color: '#ec4899' },
      { id: '4-4', row: 3, col: 3, direction: 'down-right', color: '#f59e0b' },
      { id: '4-5', row: 1, col: 1, direction: 'up', color: '#10b981' },
      { id: '4-6', row: 1, col: 2, direction: 'right', color: '#8b5cf6' },
      { id: '4-7', row: 2, col: 1, direction: 'left', color: '#06b6d4' },
      { id: '4-8', row: 2, col: 2, direction: 'down', color: '#f43f5e' },
    ],
  },
  {
    id: 5,
    name: 'Pinwheel Core',
    rows: 4,
    cols: 4,
    parMoves: 10,
    arrows: [
      { id: '5-1', row: 0, col: 1, direction: 'right', color: '#06b6d4' },
      { id: '5-2', row: 0, col: 2, direction: 'right', color: '#06b6d4' },
      { id: '5-3', row: 1, col: 3, direction: 'down', color: '#3b82f6' },
      { id: '5-4', row: 2, col: 3, direction: 'down', color: '#3b82f6' },
      { id: '5-5', row: 3, col: 2, direction: 'left', color: '#10b981' },
      { id: '5-6', row: 3, col: 1, direction: 'left', color: '#10b981' },
      { id: '5-7', row: 2, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '5-8', row: 1, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '5-9', row: 1, col: 1, direction: 'up-left', color: '#ec4899' },
      { id: '5-10', row: 2, col: 2, direction: 'down-right', color: '#8b5cf6' },
    ],
  },
];
