// Spatial hash occupancy map for multi-cell arrow collision detection and vector raycasting
import type { Position, RaycastResult } from './types';
import type { ArrowModel } from './ArrowModel';
import type { BoardModel } from './BoardModel';
import { stepPosition } from './Direction';

export class OccupancyMap {
  // Maps cell key "row,col" -> ArrowModel occupying that cell
  private readonly cellToArrow: Map<string, ArrowModel>;

  constructor(arrows: readonly ArrowModel[] = []) {
    this.cellToArrow = new Map();
    for (const arrow of arrows) {
      if (!arrow.isEscaped) {
        this.addArrow(arrow);
      }
    }
  }

  private static key(row: number, col: number): string {
    return `${row},${col}`;
  }

  isOccupied(row: number, col: number): boolean {
    return this.cellToArrow.has(OccupancyMap.key(row, col));
  }

  getArrowAt(row: number, col: number): ArrowModel | undefined {
    return this.cellToArrow.get(OccupancyMap.key(row, col));
  }

  addArrow(arrow: ArrowModel): void {
    for (const cell of arrow.occupiedCells) {
      this.cellToArrow.set(OccupancyMap.key(cell.row, cell.col), arrow);
    }
  }

  removeArrow(arrow: ArrowModel): void {
    for (const cell of arrow.occupiedCells) {
      const key = OccupancyMap.key(cell.row, cell.col);
      const existing = this.cellToArrow.get(key);
      if (existing && existing.id === arrow.id) {
        this.cellToArrow.delete(key);
      }
    }
  }

  get totalOccupiedCells(): number {
    return this.cellToArrow.size;
  }

  // An arrow can escape only if every cell from its head toward the board edge is empty.
  traceEscape(arrow: ArrowModel, board: BoardModel): RaycastResult {
    const path: Position[] = [];
    let current = stepPosition(arrow.head, arrow.direction);

    while (board.isInside(current)) {
      path.push(current);
      const blocker = this.getArrowAt(current.row, current.col);

      // If the cell is occupied by any arrow, it blocks the escape path
      if (blocker && blocker.id !== arrow.id) {
        return {
          canEscape: false,
          blockerId: blocker.id,
          blockerCell: current,
          path,
        };
      }

      current = stepPosition(current, arrow.direction);
    }

    // Reached outside the board boundaries without encountering any blocker
    return {
      canEscape: true,
      path,
    };
  }

  // Clones the occupancy map
  clone(): OccupancyMap {
    const copy = new OccupancyMap();
    for (const [key, arrow] of this.cellToArrow.entries()) {
      copy.cellToArrow.set(key, arrow);
    }
    return copy;
  }
}
