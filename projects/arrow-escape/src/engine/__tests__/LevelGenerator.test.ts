import { describe, it, expect } from 'vitest';
import { LevelGenerator, type Difficulty } from '../LevelGenerator';
import { ArrowEscapeSolver } from '../ArrowEscapeSolver';
import { ArrowEscapeEngine } from '../ArrowEscapeEngine';
import { SeededRng } from '../SeededRng';
import type { LevelData } from '../types';

describe('LevelGenerator & ArrowEscapeSolver - Procedural Engine Test Suite', () => {
  // =========================================================================
  // Requirement 1: Identical seed produces identical level
  // =========================================================================
  describe('1. Determinism and Reproducibility', () => {
    it('produces identical levels when given identical numeric seed and level number', () => {
      const levelA = LevelGenerator.generateLevel({ levelNumber: 7, seed: 9942 });
      const levelB = LevelGenerator.generateLevel({ levelNumber: 7, seed: 9942 });

      expect(levelA).toEqual(levelB);
      expect(levelA.rows).toBe(levelB.rows);
      expect(levelA.cols).toBe(levelB.cols);
      expect(levelA.parMoves).toBe(levelB.parMoves);
      expect(levelA.arrows.length).toBe(levelB.arrows.length);

      for (let i = 0; i < levelA.arrows.length; i++) {
        const arrowA = levelA.arrows[i];
        const arrowB = levelB.arrows[i];
        expect(arrowA.id).toBe(arrowB.id);
        expect(arrowA.direction).toBe(arrowB.direction);
        expect(arrowA.head).toEqual(arrowB.head);
        expect(arrowA.occupiedCells).toEqual(arrowB.occupiedCells);
      }
    });

    it('produces identical levels when given identical string seeds', () => {
      const levelA = LevelGenerator.generateLevel({
        levelNumber: 12,
        seed: 'production-release-2026',
        difficulty: 'hard',
      });
      const levelB = LevelGenerator.generateLevel({
        levelNumber: 12,
        seed: 'production-release-2026',
        difficulty: 'hard',
      });

      expect(levelA).toEqual(levelB);
    });

    it('produces different levels when seed is varied with same level number', () => {
      const level1 = LevelGenerator.generateLevel({ levelNumber: 3, seed: 1111 });
      const level2 = LevelGenerator.generateLevel({ levelNumber: 3, seed: 9999 });

      // Seeds should produce different arrow configurations or positions
      const json1 = JSON.stringify(level1.arrows);
      const json2 = JSON.stringify(level2.arrows);
      expect(json1).not.toBe(json2);
    });

    it('produces different levels for different level numbers with same master seed', () => {
      const levelA = LevelGenerator.generateLevel({ levelNumber: 1, seed: 42 });
      const levelB = LevelGenerator.generateLevel({ levelNumber: 2, seed: 42 });

      expect(levelA.id).toBe(1);
      expect(levelB.id).toBe(2);
      expect(JSON.stringify(levelA.arrows)).not.toBe(JSON.stringify(levelB.arrows));
    });

    it('SeededRng behaves deterministically for all primitive methods', () => {
      const rng1 = new SeededRng(54321);
      const rng2 = new SeededRng(54321);

      // Verify sequence of next() floats
      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }

      // Verify nextInt() range
      for (let i = 0; i < 10; i++) {
        expect(rng1.nextInt(5, 25)).toBe(rng2.nextInt(5, 25));
      }

      // Verify choice()
      const items = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
      expect(rng1.choice(items)).toBe(rng2.choice(items));

      // Verify shuffle()
      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8];
      const arr2 = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(rng1.shuffle(arr1)).toEqual(rng2.shuffle(arr2));
    });
  });

  // =========================================================================
  // Requirement 2: Generated levels are solvable
  // =========================================================================
  describe('2. Solvability Verification', () => {
    it('generates 10 consecutive levels and verifies all pass the solver', () => {
      for (let levelNum = 1; levelNum <= 10; levelNum++) {
        const level = LevelGenerator.generateLevel({ levelNumber: levelNum, seed: 777 });
        const result = ArrowEscapeSolver.solve(level);

        expect(result.solvable).toBe(true);
        expect(result.solutionMoves).toBeDefined();
        expect(result.solutionMoves!.length).toBe(level.arrows.length);
        expect(ArrowEscapeSolver.isSolvable(level)).toBe(true);
      }
    });

    it('verifies solvability across all four difficulty tiers', () => {
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

      for (const diff of difficulties) {
        for (let i = 1; i <= 3; i++) {
          const level = LevelGenerator.generateLevel({
            levelNumber: i,
            difficulty: diff,
            seed: `diff-test-${diff}-${i}`,
          });

          const result = ArrowEscapeSolver.solve(level);
          expect(result.solvable).toBe(true);
          expect(result.solutionMoves).toBeDefined();
          expect(result.solutionMoves!.length).toBe(level.arrows.length);
        }
      }
    });

    it('executes solver solution moves in ArrowEscapeEngine to confirm 100% win completion', () => {
      const level = LevelGenerator.generateLevel({
        levelNumber: 15,
        difficulty: 'hard',
        seed: 'engine-replay-test',
      });

      const solution = ArrowEscapeSolver.solve(level);
      expect(solution.solvable).toBe(true);
      expect(solution.solutionMoves).toBeDefined();

      const engine = new ArrowEscapeEngine(level);
      expect(engine.isLevelComplete()).toBe(false);

      // Execute each recommended move sequentially
      for (const arrowId of solution.solutionMoves!) {
        const canEscape = engine.canEscape(arrowId);
        expect(canEscape).toBe(true);

        const removed = engine.removeArrow(arrowId);
        expect(removed).toBe(true);
      }

      // Assert engine completed state
      expect(engine.isLevelComplete()).toBe(true);
      expect(engine.getRemainingArrows()).toHaveLength(0);
    });

    it('validates physical integrity: no overlaps and all arrows inside bounds', () => {
      const level = LevelGenerator.generateLevel({
        levelNumber: 8,
        difficulty: 'expert',
        seed: 88888,
      });

      // Structural pre-validation must pass
      const validation = ArrowEscapeSolver.validateLevelStructure(level);
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();

      const occupied = new Set<string>();
      for (const arrow of level.arrows) {
        expect(arrow.head).toBeDefined();
        expect(arrow.head!.row).toBeGreaterThanOrEqual(0);
        expect(arrow.head!.row).toBeLessThan(level.rows);
        expect(arrow.head!.col).toBeGreaterThanOrEqual(0);
        expect(arrow.head!.col).toBeLessThan(level.cols);

        for (const cell of arrow.occupiedCells!) {
          expect(cell.row).toBeGreaterThanOrEqual(0);
          expect(cell.row).toBeLessThan(level.rows);
          expect(cell.col).toBeGreaterThanOrEqual(0);
          expect(cell.col).toBeLessThan(level.cols);

          const key = `${cell.row},${cell.col}`;
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
    });
  });

  // =========================================================================
  // Requirement 3: Invalid levels are rejected
  // =========================================================================
  describe('3. Rejection of Invalid Levels', () => {
    it('rejects a closed-cycle 4-arrow pinwheel deadlock where no arrow can escape', () => {
      // 4 arrows mutually blocking each other in a circle:
      // (0,0) -> (0,1) -> (1,1) -> (1,0) -> (0,0)
      const deadlockLevel: LevelData = {
        id: 999,
        name: 'Deadlocked Cycle',
        rows: 3,
        cols: 3,
        parMoves: 4,
        arrows: [
          { id: 'a1', head: { row: 0, col: 0 }, direction: 'right' }, // ray goes toward (0,1) where a2 is
          { id: 'a2', head: { row: 0, col: 1 }, direction: 'down' },  // ray goes toward (1,1) where a3 is
          { id: 'a3', head: { row: 1, col: 1 }, direction: 'left' },  // ray goes toward (1,0) where a4 is
          { id: 'a4', head: { row: 1, col: 0 }, direction: 'up' },    // ray goes toward (0,0) where a1 is
        ],
      };

      const result = ArrowEscapeSolver.solve(deadlockLevel);
      expect(result.solvable).toBe(false);
      expect(result.error).toContain('Unsolvable level');
      expect(ArrowEscapeSolver.isSolvable(deadlockLevel)).toBe(false);
    });

    it('rejects two opposing arrows blocking each other in a dead end', () => {
      const opposingLevel: LevelData = {
        id: 998,
        name: 'Head-On Blocked',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          { id: 'leftArrow', head: { row: 1, col: 0 }, direction: 'right' },
          { id: 'rightArrow', head: { row: 1, col: 1 }, direction: 'left' },
        ],
      };

      const result = ArrowEscapeSolver.solve(opposingLevel);
      expect(result.solvable).toBe(false);
      expect(ArrowEscapeSolver.isSolvable(opposingLevel)).toBe(false);
    });

    it('rejects overlapping arrows with validation error', () => {
      const overlappingLevel: LevelData = {
        id: 997,
        name: 'Overlap Level',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          { id: 'arrow1', head: { row: 1, col: 1 }, direction: 'up' },
          { id: 'arrow2', head: { row: 1, col: 1 }, direction: 'down' },
        ],
      };

      const result = ArrowEscapeSolver.solve(overlappingLevel);
      expect(result.solvable).toBe(false);
      expect(result.error).toContain('Overlapping arrows detected at cell (1, 1)');
      expect(ArrowEscapeSolver.isSolvable(overlappingLevel)).toBe(false);
    });

    it('rejects arrows with out-of-bounds coordinates', () => {
      const oobHeadLevel: LevelData = {
        id: 996,
        name: 'OOB Head',
        rows: 3,
        cols: 3,
        parMoves: 1,
        arrows: [
          { id: 'arrow1', head: { row: 5, col: 1 }, direction: 'down' },
        ],
      };

      const resultHead = ArrowEscapeSolver.solve(oobHeadLevel);
      expect(resultHead.solvable).toBe(false);
      expect(resultHead.error).toContain('out of bounds');

      const oobBodyLevel: LevelData = {
        id: 995,
        name: 'OOB Body',
        rows: 3,
        cols: 3,
        parMoves: 1,
        arrows: [
          {
            id: 'arrow2',
            head: { row: 0, col: 0 },
            direction: 'right',
            occupiedCells: [{ row: 0, col: 0 }, { row: -1, col: 0 }],
          },
        ],
      };

      const resultBody = ArrowEscapeSolver.solve(oobBodyLevel);
      expect(resultBody.solvable).toBe(false);
      expect(resultBody.error).toContain('out of bounds');
    });

    it('rejects invalid board dimensions and empty arrow lists', () => {
      const zeroDimLevel: LevelData = {
        id: 994,
        name: 'Zero Dim',
        rows: 0,
        cols: 3,
        parMoves: 0,
        arrows: [{ id: 'a1', head: { row: 0, col: 0 }, direction: 'up' }],
      };
      expect(ArrowEscapeSolver.solve(zeroDimLevel).solvable).toBe(false);

      const emptyArrowsLevel: LevelData = {
        id: 993,
        name: 'Empty Arrows',
        rows: 3,
        cols: 3,
        parMoves: 0,
        arrows: [],
      };
      expect(ArrowEscapeSolver.solve(emptyArrowsLevel).solvable).toBe(false);
      expect(ArrowEscapeSolver.solve(emptyArrowsLevel).error).toContain('no arrows');
    });
  });

  // =========================================================================
  // Requirement 4: Difficulty parameters affect board complexity
  // =========================================================================
  describe('4. Difficulty Parameters and Complexity', () => {
    it('scales board dimensions across difficulty tiers', () => {
      const easyLevel = LevelGenerator.generateLevel({ difficulty: 'easy', seed: 100 });
      const mediumLevel = LevelGenerator.generateLevel({ difficulty: 'medium', seed: 100 });
      const hardLevel = LevelGenerator.generateLevel({ difficulty: 'hard', seed: 100 });
      const expertLevel = LevelGenerator.generateLevel({ difficulty: 'expert', seed: 100 });

      expect(easyLevel.rows).toBe(3);
      expect(easyLevel.cols).toBe(3);

      expect(mediumLevel.rows).toBe(4);
      expect(mediumLevel.cols).toBe(4);

      expect(hardLevel.rows).toBe(5);
      expect(hardLevel.cols).toBe(5);

      expect(expertLevel.rows).toBe(6);
      expect(expertLevel.cols).toBe(6);
    });

    it('increases arrow density and count as difficulty increases', () => {
      const easyLevel = LevelGenerator.generateLevel({ difficulty: 'easy', seed: 444 });
      const mediumLevel = LevelGenerator.generateLevel({ difficulty: 'medium', seed: 444 });
      const hardLevel = LevelGenerator.generateLevel({ difficulty: 'hard', seed: 444 });
      const expertLevel = LevelGenerator.generateLevel({ difficulty: 'expert', seed: 444 });

      expect(easyLevel.arrows.length).toBeLessThan(mediumLevel.arrows.length);
      expect(mediumLevel.arrows.length).toBeLessThan(hardLevel.arrows.length);
      expect(hardLevel.arrows.length).toBeLessThan(expertLevel.arrows.length);
    });

    it('restricts easy difficulty to 1-cell arrows without diagonals', () => {
      const easyLevel = LevelGenerator.generateLevel({ difficulty: 'easy', seed: 333 });
      const diagonalDirs = ['up-left', 'up-right', 'down-left', 'down-right'];

      for (const arrow of easyLevel.arrows) {
        // Arrow length must be exactly 1
        expect(arrow.occupiedCells?.length ?? 1).toBe(1);
        // Arrow must not have diagonal direction
        expect(diagonalDirs).not.toContain(arrow.direction);
      }
    });

    it('enables multi-cell arrows and diagonal trajectories on higher difficulties', () => {
      const expertLevel = LevelGenerator.generateLevel({ difficulty: 'expert', seed: 777 });
      const diagonalDirs = ['up-left', 'up-right', 'down-left', 'down-right'];

      const hasMultiCell = expertLevel.arrows.some((a) => (a.occupiedCells?.length ?? 1) > 1);
      const hasDiagonals = expertLevel.arrows.some((a) => diagonalDirs.includes(a.direction));

      expect(hasMultiCell).toBe(true);
      expect(hasDiagonals).toBe(true);
    });

    it('respects custom overrides for dimensions, count, length, and diagonals', () => {
      const customLevel = LevelGenerator.generateLevel({
        rows: 5,
        cols: 6,
        arrowCount: 8,
        minLength: 2,
        maxLength: 2,
        allowDiagonals: false,
        seed: 12345,
      });

      expect(customLevel.rows).toBe(5);
      expect(customLevel.cols).toBe(6);
      expect(customLevel.arrows.length).toBe(8);

      const diagonalDirs = ['up-left', 'up-right', 'down-left', 'down-right'];
      for (const arrow of customLevel.arrows) {
        expect(arrow.occupiedCells?.length).toBe(2);
        expect(diagonalDirs).not.toContain(arrow.direction);
      }

      // Must still be 100% solvable
      expect(ArrowEscapeSolver.isSolvable(customLevel)).toBe(true);
    });

    it('generates bended serpentine arrows (L/S/U shapes) with non-collinear body segments on expert difficulty', () => {
      let foundBendedArrow = false;

      // Check across several seeds to verify bended serpent arrows are generated
      for (let s = 1; s <= 10; s++) {
        const level = LevelGenerator.generateLevel({
          difficulty: 'expert',
          minLength: 3,
          maxLength: 5,
          seed: `bended-test-${s}`,
        });

        for (const arrow of level.arrows) {
          const cells = arrow.occupiedCells ?? [];
          if (cells.length >= 3) {
            for (let i = 0; i < cells.length - 2; i++) {
              const d0 = { r: cells[i + 1].row - cells[i].row, c: cells[i + 1].col - cells[i].col };
              const d1 = { r: cells[i + 2].row - cells[i + 1].row, c: cells[i + 2].col - cells[i + 1].col };
              if (d0.r !== d1.r || d0.c !== d1.c) {
                foundBendedArrow = true;
                break;
              }
            }
          }
          if (foundBendedArrow) break;
        }
        if (foundBendedArrow) break;
      }

      expect(foundBendedArrow).toBe(true);
    });
  });
});
