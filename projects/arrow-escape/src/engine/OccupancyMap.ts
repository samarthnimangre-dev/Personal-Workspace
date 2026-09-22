// Spatial hash occupancy map for O(1) collision detection and raycast escape tracing
import type { Position } from './types';
import type { ArrowModel } from './ArrowModel';
import type { BoardModel } from './BoardModel';
import { stepPosition } from './Direction';

export interface RaycastTrace {
  readonly canEscape: boolean;
  readonly blocker?: ArrowModel;
  readonly path: readonly Position[];
}

export class OccupancyMap {
  private readonly map: Map<string, ArrowModel>;

  constructor(arrows: readonly ArrowModel[] = []) {
    this.map = new Map();
    for (const arrow of arrows) {
      if (!arrow.isEscaped) {
        this.set(arrow.position.row, arrow.position.col, arrow);
      }
    }
  }

  private static key(row: number, col: number): string {
    return `${row},${col}`;
  }

  has(row: number, col: number): boolean {
    return this.map.has(OccupancyMap.key(row, col));
  }

  get(row: number, col: number): ArrowModel | undefined {
    return this.map.get(OccupancyMap.key(row, col));
  }

  set(row: number, col: number, arrow: ArrowModel): void {
    this.map.set(OccupancyMap.key(row, col), arrow);
  }

  delete(row: number, col: number): boolean {
    return this.map.delete(OccupancyMap.key(row, col));
  }

  getAll(): readonly ArrowModel[] {
    return Array.from(this.map.values());
  }

  get count(): number {
    return this.map.size;
  }

  // Raycasts an arrow in its direction vector across the board until bounds or collision
  traceEscape(arrow: ArrowModel, board: BoardModel): RaycastTrace {
    const path: Position[] = [];
    let current = stepPosition(arrow.position, arrow.direction);

    while (board.isInside(current)) {
      path.push(current);
      const blocker = this.get(current.row, current.col);
      if (blocker && blocker.id !== arrow.id && !blocker.isEscaped) {
        return {
          canEscape: false,
          blocker,
          path,
        };
      }
      current = stepPosition(current, arrow.direction);
    }

    return {
      canEscape: true,
      path,
    };
  }

  // Finds all arrows currently unobstructed and eligible to escape
  findUnblocked(board: BoardModel): readonly ArrowModel[] {
    const unblocked: ArrowModel[] = [];
    for (const arrow of this.getAll()) {
      if (arrow.isIdle) {
        const trace = this.traceEscape(arrow, board);
        if (trace.canEscape) {
          unblocked.push(arrow);
        }
      }
    }
    return unblocked;
  }
}
