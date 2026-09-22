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
    this.board = new BoardModel(level.rows, level.cols);
    this.arrowsMap = new Map();
    this.occupancyMap = new OccupancyMap();
    this.movesCount = 0;

    this.initializeFromLevel(level);
  }

  private initializeFromLevel(level: LevelData): void {
    this.level = level;
    this.board = new BoardModel(level.rows, level.cols);
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

    const trace = this.occupancyMap.traceEscape(arrow, this.board);

    if (trace.canEscape) {
      this.removeArrow(arrowId);
      return {
        success: true,
        arrowId,
        path: trace.path,
      };
    } else {
      this.movesCount++;
      return {
        success: false,
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
