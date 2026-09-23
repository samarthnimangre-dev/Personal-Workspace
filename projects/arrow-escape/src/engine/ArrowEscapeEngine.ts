// Complete Arrow Escape game engine
// Strictly independent from React and UI frameworks.
import type { LevelData, MoveResult } from './types';
import { BoardModel } from './BoardModel';
import { ArrowModel } from './ArrowModel';
import { OccupancyMap } from './OccupancyMap';

export class ArrowEscapeEngine {
  private level: LevelData;
  private board: BoardModel;
  private arrowsMap: Map<string, ArrowModel>;
  private occupancyMap: OccupancyMap;
  private movesCount: number;

  constructor(level: LevelData) {
    this.level = level;
    this.board = new BoardModel(
      level.rows,
      level.cols,
      level.maskShape,
      level.mask,
      level.deflectors
    );
    this.arrowsMap = new Map();
    this.occupancyMap = new OccupancyMap();
    this.movesCount = 0;

    this.initializeFromLevel(level);
  }

  private initializeFromLevel(level: LevelData): void {
    this.level = level;
    this.board = new BoardModel(
      level.rows,
      level.cols,
      level.maskShape,
      level.mask,
      level.deflectors
    );
    this.arrowsMap = new Map();
    this.movesCount = 0;

    const initialArrows: ArrowModel[] = [];
    for (const data of level.arrows) {
      const arrow = ArrowModel.fromData(data);
      this.arrowsMap.set(arrow.id, arrow);
      initialArrows.push(arrow);
    }

    this.occupancyMap = new OccupancyMap(initialArrows);
  }

  /**
   * Resets the current level back to its initial state.
   */
  public reset(): void {
    this.initializeFromLevel(this.level);
  }

  /**
   * Restores engine state from an arrow snapshot.
   */
  public restoreState(arrows: readonly ArrowModel[]): void {
    this.arrowsMap.clear();
    const active: ArrowModel[] = [];
    for (const a of arrows) {
      this.arrowsMap.set(a.id, a);
      if (!a.isEscaped) {
        active.push(a);
      }
    }
    this.occupancyMap = new OccupancyMap(active);
  }

  /**
   * Loads a new level and resets the engine state.
   */
  public loadLevel(level: LevelData): void {
    this.initializeFromLevel(level);
  }

  /**
   * Returns the BoardModel of the current level.
   */
  public getBoard(): BoardModel {
    return this.board;
  }

  /**
   * Returns the active level configuration.
   */
  public getLevel(): LevelData {
    return this.level;
  }

  /**
   * Returns the number of move attempts made.
   */
  public getMovesCount(): number {
    return this.movesCount;
  }

  /**
   * Returns an arrow by its ID.
   */
  public getArrow(arrowId: string): ArrowModel | undefined {
    return this.arrowsMap.get(arrowId);
  }

  /**
   * Returns all arrows in the level (including escaped ones).
   */
  public getAllArrows(): readonly ArrowModel[] {
    return Array.from(this.arrowsMap.values());
  }

  /**
   * Returns all arrows that have not yet escaped.
   */
  public getRemainingArrows(): readonly ArrowModel[] {
    return Array.from(this.arrowsMap.values()).filter((a) => !a.isEscaped);
  }

  /**
   * Returns the current spatial occupancy map.
   */
  public getOccupancyMap(): OccupancyMap {
    return this.occupancyMap;
  }

  /**
   * RULE: An arrow can escape only if every cell from its head toward the board edge is empty.
   */
  public canEscape(arrowId: string): boolean {
    const arrow = this.arrowsMap.get(arrowId);
    if (!arrow || arrow.isEscaped) {
      return false;
    }

    const trace = this.occupancyMap.traceEscape(arrow, this.board);
    return trace.canEscape;
  }

  /**
   * RULE: Returns all arrows currently eligible to escape.
   */
  public getAvailableArrows(): ArrowModel[] {
    const available: ArrowModel[] = [];
    for (const arrow of this.arrowsMap.values()) {
      if (!arrow.isEscaped && this.canEscape(arrow.id)) {
        available.push(arrow);
      }
    }
    return available;
  }

  /**
   * RULE: A successful escape permanently removes the arrow.
   * RULE: A blocked arrow must not move.
   *
   * @returns true if the arrow successfully escaped and was removed; false if blocked.
   */
  public removeArrow(arrowId: string): boolean {
    const arrow = this.arrowsMap.get(arrowId);
    if (!arrow || arrow.isEscaped) {
      return false;
    }

    this.movesCount++;

    if (!this.canEscape(arrowId)) {
      // Blocked arrow must not move or be removed
      return false;
    }

    // Permanently remove arrow from board and occupancy map
    this.occupancyMap.removeArrow(arrow);
    this.arrowsMap.set(arrowId, arrow.withState('escaped'));
    return true;
  }

  /**
   * Attempt move with detailed result (useful for UI animation hooks).
   */
  public attemptMove(arrowId: string): MoveResult {
    const arrow = this.arrowsMap.get(arrowId);
    if (!arrow || arrow.isEscaped) {
      return { success: false, arrowId, path: [] };
    }

    this.movesCount++;

    // 1. Ice obstacle handling
    if (arrow.isFrozen) {
      const updated = arrow.withIceHit();
      this.arrowsMap.set(arrowId, updated);
      if (updated.isFrozen) {
        return {
          success: true,
          actionType: 'iceCrack',
          arrowId,
          path: [],
        };
      } else {
        return {
          success: true,
          actionType: 'iceShatter',
          arrowId,
          path: [],
        };
      }
    }

    // 2. Bomb arrow handling
    if (arrow.isBomb) {
      const affected: string[] = [];
      const bombCells = arrow.occupiedCells;

      // Find all arrows within Chebyshev distance 1 of any bomb cell
      for (const other of this.arrowsMap.values()) {
        if (other.id === arrow.id || other.isEscaped) continue;
        const isNear = other.occupiedCells.some((c) =>
          bombCells.some(
            (bc) => Math.max(Math.abs(c.row - bc.row), Math.abs(c.col - bc.col)) <= 1
          )
        );
        if (isNear) {
          affected.push(other.id);
          this.occupancyMap.removeArrow(other);
          this.arrowsMap.set(other.id, other.withState('escaped'));
        }
      }

      this.occupancyMap.removeArrow(arrow);
      this.arrowsMap.set(arrowId, arrow.withState('escaped'));

      return {
        success: true,
        actionType: 'bombDetonate',
        arrowId,
        affectedArrowIds: affected,
        path: [],
      };
    }

    // 3. Pivot arrow handling
    if (arrow.isPivot) {
      const rotated = arrow.withPivotRotated();
      this.arrowsMap.set(arrowId, rotated);
      const trace = this.occupancyMap.traceEscape(rotated, this.board);
      if (trace.canEscape) {
        this.occupancyMap.removeArrow(rotated);
        this.arrowsMap.set(arrowId, rotated.withState('escaped'));
        return {
          success: true,
          actionType: 'escape',
          arrowId,
          path: trace.path,
        };
      } else {
        return {
          success: true,
          actionType: 'pivotRotate',
          arrowId,
          blockerId: trace.blockerId,
          path: trace.path,
        };
      }
    }

    // 4. Standard arrow escape check
    const trace = this.occupancyMap.traceEscape(arrow, this.board);
    if (trace.canEscape) {
      this.occupancyMap.removeArrow(arrow);
      this.arrowsMap.set(arrowId, arrow.withState('escaped'));
      return {
        success: true,
        actionType: 'escape',
        arrowId,
        path: trace.path,
      };
    } else {
      return {
        success: false,
        actionType: 'blocked',
        arrowId,
        blockerId: trace.blockerId,
        path: trace.path,
      };
    }
  }

  /**
   * RULE: True if all arrows in the level have been successfully escaped and removed.
   */
  public isLevelComplete(): boolean {
    return this.getRemainingArrows().length === 0;
  }
}
