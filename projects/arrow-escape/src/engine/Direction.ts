// Direction math and boundary utilities for grid movement and vector raycasting
import type { Direction, DirectionDelta, Position } from './types';

export const DIRECTION_DELTAS: Readonly<Record<Direction, DirectionDelta>> = {
  up: { dRow: -1, dCol: 0 },
  down: { dRow: 1, dCol: 0 },
  left: { dRow: 0, dCol: -1 },
  right: { dRow: 0, dCol: 1 },
  'up-left': { dRow: -1, dCol: -1 },
  'up-right': { dRow: -1, dCol: 1 },
  'down-left': { dRow: 1, dCol: -1 },
  'down-right': { dRow: 1, dCol: 1 },
};

export const DIRECTION_ANGLES: Readonly<Record<Direction, number>> = {
  right: 0,
  'down-right': 45,
  down: 90,
  'down-left': 135,
  left: 180,
  'up-left': -135,
  up: -90,
  'up-right': -45,
};

export function getDirectionDelta(direction: Direction): DirectionDelta {
  return DIRECTION_DELTAS[direction];
}

export function getDirectionAngle(direction: Direction): number {
  return DIRECTION_ANGLES[direction];
}

export function stepPosition(position: Position, direction: Direction): Position {
  const delta = DIRECTION_DELTAS[direction];
  return {
    row: position.row + delta.dRow,
    col: position.col + delta.dCol,
  };
}

export function isWithinBounds(position: Position, rows: number, cols: number): boolean {
  return (
    position.row >= 0 &&
    position.row < rows &&
    position.col >= 0 &&
    position.col < cols
  );
}

export function isOpposite(a: Direction, b: Direction): boolean {
  const deltaA = DIRECTION_DELTAS[a];
  const deltaB = DIRECTION_DELTAS[b];
  return deltaA.dRow === -deltaB.dRow && deltaA.dCol === -deltaB.dCol;
}
