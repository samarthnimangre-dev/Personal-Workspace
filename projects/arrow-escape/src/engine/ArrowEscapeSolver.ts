// Arrow Escape Solver: Searches legal escape sequences and verifies level solvability
import type { LevelData } from './types';
import { ArrowEscapeEngine } from './ArrowEscapeEngine';

export interface SolverResult {
  readonly solvable: boolean;
  readonly solutionMoves?: readonly string[];
  readonly stepsExplored: number;
  readonly error?: string;
}

export class ArrowEscapeSolver {
  /**
   * Pre-validates level configuration for physical integrity:
   * - Valid rows/cols
   * - No arrows out of bounds
   * - No overlapping arrow cells
   */
  public static validateLevelStructure(level: LevelData): { valid: boolean; error?: string } {
    if (level.rows <= 0 || level.cols <= 0) {
      return { valid: false, error: `Invalid board dimensions: ${level.rows}x${level.cols}` };
    }

    if (!level.arrows || level.arrows.length === 0) {
      return { valid: false, error: 'Level has no arrows.' };
    }

    const occupied = new Set<string>();

    for (const arrow of level.arrows) {
      const head =
        arrow.head ??
        (arrow.row !== undefined && arrow.col !== undefined
          ? { row: arrow.row, col: arrow.col }
          : null);

      if (!head) {
        return { valid: false, error: `Arrow ${arrow.id} missing head coordinate.` };
      }

      if (head.row < 0 || head.row >= level.rows || head.col < 0 || head.col >= level.cols) {
        return {
          valid: false,
          error: `Arrow ${arrow.id} head (${head.row}, ${head.col}) out of bounds.`,
        };
      }

      const cells = arrow.occupiedCells && arrow.occupiedCells.length > 0
        ? arrow.occupiedCells
        : [head];

      for (const cell of cells) {
        if (cell.row < 0 || cell.row >= level.rows || cell.col < 0 || cell.col >= level.cols) {
          return {
            valid: false,
            error: `Arrow ${arrow.id} cell (${cell.row}, ${cell.col}) out of bounds.`,
          };
        }

        const key = `${cell.row},${cell.col}`;
        if (occupied.has(key)) {
          return {
            valid: false,
            error: `Overlapping arrows detected at cell (${cell.row}, ${cell.col}).`,
          };
        }
        occupied.add(key);
      }
    }

    return { valid: true };
  }

  /**
   * Solves the level by performing a search over legal arrow escape sequences.
   * Returns whether the level is solvable, along with a confirmed winning move sequence.
   */
  public static solve(level: LevelData, maxSteps: number = 20000): SolverResult {
    // 1. Structural validity check
    const validation = this.validateLevelStructure(level);
    if (!validation.valid) {
      return {
        solvable: false,
        stepsExplored: 0,
        error: validation.error,
      };
    }

    // 2. Initialize engine
    const engine = new ArrowEscapeEngine(level);

    // If already complete (e.g. empty level)
    if (engine.isLevelComplete()) {
      return { solvable: true, solutionMoves: [], stepsExplored: 0 };
    }

    const visitedStates = new Set<string>();
    let stepsExplored = 0;

    // Helper state key: sorted comma-separated IDs of remaining arrows
    const getStateKey = (): string => {
      return engine
        .getRemainingArrows()
        .map((a) => a.id)
        .sort()
        .join(',');
    };

    // Depth-First Search for valid topological escape order
    const search = (movesSoFar: string[]): string[] | null => {
      stepsExplored++;
      if (stepsExplored > maxSteps) {
        return null;
      }

      if (engine.isLevelComplete()) {
        return movesSoFar;
      }

      const stateKey = getStateKey();
      if (visitedStates.has(stateKey)) {
        return null;
      }
      visitedStates.add(stateKey);

      const available = engine.getAvailableArrows();
      if (available.length === 0) {
        // Deadlock reached: no arrow can escape from here
        return null;
      }

      for (const arrow of available) {
        // Clone or execute move in engine
        const success = engine.removeArrow(arrow.id);
        if (success) {
          const solution = search([...movesSoFar, arrow.id]);
          if (solution !== null) {
            return solution;
          }

          // Backtrack: reload current remaining state minus arrow
          // For simplicity and exact accuracy in backtracking, reset and re-apply path
          engine.reset();
          for (const m of movesSoFar) {
            engine.removeArrow(m);
          }
        }
      }

      return null;
    };

    const solutionMoves = search([]);

    if (solutionMoves !== null) {
      return {
        solvable: true,
        solutionMoves,
        stepsExplored,
      };
    }

    return {
      solvable: false,
      stepsExplored,
      error: 'Unsolvable level: no valid sequence of unblocked arrows reaches victory.',
    };
  }

  /**
   * Fast boolean check if level is solvable.
   */
  public static isSolvable(level: LevelData): boolean {
    return this.solve(level).solvable;
  }
}
