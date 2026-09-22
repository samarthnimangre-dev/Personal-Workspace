import { ArrowDirection, ArrowTile } from '@/types/game';

export interface RaycastResult {
  canEscape: boolean;
  blockerId?: string;
  blockerPos?: { row: number; col: number };
  pathCells: { row: number; col: number }[];
}

export function getDirectionDelta(dir: ArrowDirection): { dRow: number; dCol: number } {
  switch (dir) {
    case 'up':
      return { dRow: -1, dCol: 0 };
    case 'down':
      return { dRow: 1, dCol: 0 };
    case 'left':
      return { dRow: 0, dCol: -1 };
    case 'right':
      return { dRow: 0, dCol: 1 };
    case 'up-left':
      return { dRow: -1, dCol: -1 };
    case 'up-right':
      return { dRow: -1, dCol: 1 };
    case 'down-left':
      return { dRow: 1, dCol: -1 };
    case 'down-right':
      return { dRow: 1, dCol: 1 };
    default:
      return { dRow: 0, dCol: 0 };
  }
}

export function getDirectionAngle(dir: ArrowDirection): number {
  switch (dir) {
    case 'up':
      return -90;
    case 'down':
      return 90;
    case 'left':
      return 180;
    case 'right':
      return 0;
    case 'up-left':
      return -135;
    case 'up-right':
      return -45;
    case 'down-left':
      return 135;
    case 'down-right':
      return 45;
    default:
      return 0;
  }
}

export function traceArrowEscape(
  arrow: ArrowTile,
  activeArrows: ArrowTile[],
  rows: number,
  cols: number
): RaycastResult {
  const { dRow, dCol } = getDirectionDelta(arrow.direction);
  const pathCells: { row: number; col: number }[] = [];

  // Spatial lookup for lightning fast O(1) collision detection
  const grid = new Map<string, ArrowTile>();
  for (const item of activeArrows) {
    if (item.id !== arrow.id && !item.isRemoving) {
      grid.set(`${item.row},${item.col}`, item);
    }
  }

  let currRow = arrow.row + dRow;
  let currCol = arrow.col + dCol;

  while (currRow >= 0 && currRow < rows && currCol >= 0 && currCol < cols) {
    pathCells.push({ row: currRow, col: currCol });
    const blocker = grid.get(`${currRow},${currCol}`);
    if (blocker) {
      return {
        canEscape: false,
        blockerId: blocker.id,
        blockerPos: { row: currRow, col: currCol },
        pathCells,
      };
    }
    currRow += dRow;
    currCol += dCol;
  }

  // Traversed outside the boundaries with no collisions
  return {
    canEscape: true,
    pathCells,
  };
}

export function findUnblockedArrows(
  activeArrows: ArrowTile[],
  rows: number,
  cols: number
): ArrowTile[] {
  const unblocked: ArrowTile[] = [];
  for (const arrow of activeArrows) {
    if (!arrow.isRemoving) {
      const res = traceArrowEscape(arrow, activeArrows, rows, cols);
      if (res.canEscape) {
        unblocked.push(arrow);
      }
    }
  }
  return unblocked;
}
