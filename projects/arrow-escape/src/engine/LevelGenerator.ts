// Deterministic Procedural Level Generator using Reverse-Construction and Solver Validation
import type { ArrowData, Direction, LevelData, Position } from './types';
import { BoardModel } from './BoardModel';
import { ArrowModel } from './ArrowModel';
import { OccupancyMap } from './OccupancyMap';
import { getDirectionDelta, stepPosition } from './Direction';
import { SeededRng } from './SeededRng';
import { ArrowEscapeSolver } from './ArrowEscapeSolver';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface LevelGeneratorOptions {
  levelNumber?: number;
  seed?: number | string;
  difficulty?: Difficulty;
  rows?: number;
  cols?: number;
  arrowCount?: number;
  minLength?: number;
  maxLength?: number;
  allowDiagonals?: boolean;
}

interface ResolvedConfig {
  levelNumber: number;
  masterSeed: number;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  arrowCount: number;
  minLength: number;
  maxLength: number;
  allowDiagonals: boolean;
}

const NEON_PALETTE = ['#06b6d4', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b'];

export class LevelGenerator {
  /**
   * Resolves defaults according to difficulty parameter.
   */
  private static resolveConfig(options: LevelGeneratorOptions = {}): ResolvedConfig {
    const levelNumber = options.levelNumber ?? 1;
    const difficulty: Difficulty = options.difficulty ?? 'medium';
    const masterSeed = SeededRng.combineSeed(levelNumber, options.seed ?? 1337);

    // Default parameters mapped by difficulty
    let defaultRows = 4;
    let defaultCols = 4;
    let defaultCount = 6;
    let defaultMinLen = 1;
    let defaultMaxLen = 1;
    let defaultDiagonals = false;

    switch (difficulty) {
      case 'easy':
        defaultRows = 3;
        defaultCols = 3;
        defaultCount = 4;
        defaultMinLen = 1;
        defaultMaxLen = 1;
        defaultDiagonals = false;
        break;
      case 'medium':
        defaultRows = 4;
        defaultCols = 4;
        defaultCount = 7;
        defaultMinLen = 1;
        defaultMaxLen = 3;
        defaultDiagonals = true;
        break;
      case 'hard':
        defaultRows = 5;
        defaultCols = 5;
        defaultCount = 11;
        defaultMinLen = 1;
        defaultMaxLen = 4;
        defaultDiagonals = true;
        break;
      case 'expert':
        defaultRows = 6;
        defaultCols = 6;
        defaultCount = 16;
        defaultMinLen = 1;
        defaultMaxLen = 5;
        defaultDiagonals = true;
        break;
    }

    const rows = options.rows ?? defaultRows;
    const cols = options.cols ?? defaultCols;
    const minLength = options.minLength ?? defaultMinLen;
    const maxLength = Math.max(minLength, options.maxLength ?? defaultMaxLen);
    const maxFittingArrows = Math.max(2, Math.floor((rows * cols * 0.8) / Math.max(1, minLength)));
    const arrowCount = Math.min(options.arrowCount ?? defaultCount, maxFittingArrows);

    return {
      levelNumber,
      masterSeed,
      difficulty,
      rows,
      cols,
      arrowCount,
      minLength,
      maxLength,
      allowDiagonals: options.allowDiagonals ?? defaultDiagonals,
    };
  }

  /**
   * Generates an arrow candidate that can legally escape the current board state.
   */
  private static findValidReversePlacement(
    board: BoardModel,
    occupancy: OccupancyMap,
    desiredLength: number,
    directions: readonly Direction[],
    rng: SeededRng,
    placedArrows?: readonly ArrowData[]
  ): { head: Position; occupiedCells: Position[]; direction: Direction } | null {
    // 1. Build set of cells that lie on the escape rays of already placed arrows
    const existingEscapeRays = new Set<string>();
    if (placedArrows && placedArrows.length > 0) {
      for (const arrow of placedArrows) {
        let scan = stepPosition(arrow.head!, arrow.direction);
        while (board.isWithinBounds(scan)) {
          existingEscapeRays.add(`${scan.row},${scan.col}`);
          scan = stepPosition(scan, arrow.direction);
        }
      }
    }

    // 2. Generate all available empty cells as potential heads (must be inside active shape)
    const candidateHeads: Position[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (board.isInsideCoords(r, c) && !occupancy.isOccupied(r, c)) {
          candidateHeads.push({ row: r, col: c });
        }
      }
    }

    rng.shuffle(candidateHeads);
    const shuffledDirs = rng.shuffle([...directions]);

    const intersectingCandidates: { head: Position; occupiedCells: Position[]; direction: Direction }[] = [];
    const fallbackCandidates: { head: Position; occupiedCells: Position[]; direction: Direction }[] = [];

    for (const head of candidateHeads) {
      for (const dir of shuffledDirs) {
        // 1. Verify that the escape path from head toward board edge is completely empty
        let escapePathClear = true;
        let scan = stepPosition(head, dir);
        while (board.isWithinBounds(scan)) {
          if (occupancy.isOccupied(scan.row, scan.col)) {
            escapePathClear = false;
            break;
          }
          scan = stepPosition(scan, dir);
        }

        if (!escapePathClear) {
          continue;
        }

        // 2. Build trailing body cells behind the head (opposite to direction)
        const delta = getDirectionDelta(dir);
        const occupiedCells: Position[] = [head];
        let bodyValid = true;

        if (desiredLength > 1) {
          const firstStep: Position = {
            row: head.row - delta.dRow,
            col: head.col - delta.dCol,
          };

          if (!board.isInsideShape(firstStep) || occupancy.isOccupied(firstStep.row, firstStep.col)) {
            bodyValid = false;
          } else {
            occupiedCells.push(firstStep);
          }
        }

        if (bodyValid && desiredLength > 2) {
          let curCell = occupiedCells[1];
          let curDrow = -delta.dRow;
          let curDcol = -delta.dCol;

          for (let step = 2; step < desiredLength; step++) {
            const candidates: { dRow: number; dCol: number }[] = [];
            const isOrthogonal =
              (curDrow === 0 && Math.abs(curDcol) === 1) ||
              (curDcol === 0 && Math.abs(curDrow) === 1);

            if (isOrthogonal) {
              const straight = { dRow: curDrow, dCol: curDcol };
              const turnLeft = { dRow: -curDcol, dCol: curDrow };
              const turnRight = { dRow: curDcol, dCol: -curDrow };

              // 65% chance to prioritize bends/turns for serpentine snake arrows
              if (rng.next() < 0.65) {
                if (rng.next() < 0.5) {
                  candidates.push(turnLeft, turnRight, straight);
                } else {
                  candidates.push(turnRight, turnLeft, straight);
                }
              } else {
                candidates.push(straight, turnLeft, turnRight);
              }
            } else {
              candidates.push({ dRow: curDrow, dCol: curDcol });
            }

            let foundNext = false;
            for (const cand of candidates) {
              const nextCell: Position = {
                row: curCell.row + cand.dRow,
                col: curCell.col + cand.dCol,
              };

              if (
                board.isInsideShape(nextCell) &&
                !occupancy.isOccupied(nextCell.row, nextCell.col) &&
                !occupiedCells.some((c) => c.row === nextCell.row && c.col === nextCell.col)
              ) {
                occupiedCells.push(nextCell);
                curCell = nextCell;
                curDrow = cand.dRow;
                curDcol = cand.dCol;
                foundNext = true;
                break;
              }
            }

            if (!foundNext) {
              bodyValid = false;
              break;
            }
          }
        }

        if (bodyValid) {
          const candidate = { head, occupiedCells, direction: dir };
          const intersectsExistingRay = occupiedCells.some((cell) =>
            existingEscapeRays.has(`${cell.row},${cell.col}`)
          );

          if (intersectsExistingRay) {
            intersectingCandidates.push(candidate);
          } else {
            fallbackCandidates.push(candidate);
          }
        }
      }
    }

    if (intersectingCandidates.length > 0) {
      return rng.choice(intersectingCandidates);
    }

    if (fallbackCandidates.length > 0) {
      return rng.choice(fallbackCandidates);
    }

    return null;
  }

  /**
   * Generates a fully validated, deterministic level using reverse-construction.
   */
  public static generateLevel(options: LevelGeneratorOptions = {}): LevelData {
    const config = this.resolveConfig(options);
    const directions: Direction[] = config.allowDiagonals
      ? ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']
      : ['up', 'down', 'left', 'right'];

    // Max retry attempts with deterministic perturbation if candidate fails validation
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentSeed = (config.masterSeed + attempt * 7919) >>> 0;
      const rng = new SeededRng(currentSeed);

      const board = new BoardModel(config.rows, config.cols);
      const occupancy = new OccupancyMap();
      const placedArrows: ArrowData[] = [];

      // REVERSE-CONSTRUCTION:
      // Place arrows one by one from last to escape (N) down to first to escape (1).
      // Each newly placed arrow must have an unblocked escape path at the moment of placement.
      let generationFailed = false;

      for (let i = 0; i < config.arrowCount; i++) {
        const desiredLen = rng.nextInt(config.minLength, config.maxLength);
        const minLen = Math.max(1, config.minLength);
        let placement: { head: Position; occupiedCells: Position[]; direction: Direction } | null = null;

        // Dynamic length reduction: if desired length fails, try len - 1 down to minLen (or 1)
        for (let l = desiredLen; l >= minLen; l--) {
          placement = this.findValidReversePlacement(
            board,
            occupancy,
            l,
            directions,
            rng,
            placedArrows
          );
          if (placement) {
            break;
          }
        }

        if (!placement) {
          // Board is too full or cramped to legally place another unblocked arrow
          const minAcceptable = Math.min(
            config.arrowCount,
            Math.max(2, Math.floor(config.arrowCount * 0.7))
          );
          if (placedArrows.length >= minAcceptable) {
            // If we placed a substantial number of arrows, keep what we have
            break;
          } else {
            generationFailed = true;
            break;
          }
        }

        const arrowId = `lvl${config.levelNumber}-arr${i + 1}`;
        const arrowData: ArrowData = {
          id: arrowId,
          direction: placement.direction,
          head: placement.head,
          row: placement.head.row,
          col: placement.head.col,
          occupiedCells: placement.occupiedCells,
          color: NEON_PALETTE[i % NEON_PALETTE.length],
        };

        // Add to occupancy map
        occupancy.addArrow(ArrowModel.fromData(arrowData));
        placedArrows.push(arrowData);
      }

      if (generationFailed || placedArrows.length === 0) {
        continue;
      }

      // Par moves equals the number of placed arrows
      const candidateLevel: LevelData = {
        id: config.levelNumber,
        name: `Level ${config.levelNumber}`,
        rows: config.rows,
        cols: config.cols,
        parMoves: placedArrows.length,
        arrows: placedArrows,
      };

      // SOLVER VALIDATION: Verify level is 100% solvable
      const solverResult = ArrowEscapeSolver.solve(candidateLevel);
      if (solverResult.solvable) {
        return candidateLevel;
      }
    }

    throw new Error(
      `Failed to generate a solvable level for level ${config.levelNumber} with seed ${options.seed} after ${maxAttempts} attempts.`
    );
  }
}
