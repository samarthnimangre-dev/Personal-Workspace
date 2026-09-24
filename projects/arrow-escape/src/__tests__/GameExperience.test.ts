import { describe, it, expect, beforeEach } from 'vitest';
import { soundEffects } from '../audio/SoundEffects';
import { haptics } from '../utils/haptics';
import { loadSettings, saveSettings, loadProgress, recordLevelCompletion } from '../persistence/storage';
import { levelRegistry, getDifficultyForLevel, TOTAL_CAMPAIGN_LEVELS } from '../engine/LevelRegistry';
import { ArrowEscapeSolver } from '../engine/ArrowEscapeSolver';
import { BoardModel } from '../engine/BoardModel';
import { ArrowModel } from '../engine/ArrowModel';

describe('Complete Game Experience Integration Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('SoundEffects & Haptics Control', () => {
    it('manages sound mute toggle and persistence correctly', () => {
      soundEffects.setMuted(false);
      expect(soundEffects.getMuted()).toBe(false);

      const toggled = soundEffects.toggleMute();
      expect(toggled).toBe(true);
      expect(soundEffects.getMuted()).toBe(true);

      soundEffects.setMuted(false);
      expect(soundEffects.getMuted()).toBe(false);
    });

    it('handles sound synthesis calls without throwing errors when audio context is unavailable or muted', () => {
      soundEffects.setMuted(true);
      expect(() => soundEffects.playTap()).not.toThrow();
      expect(() => soundEffects.playEscape()).not.toThrow();
      expect(() => soundEffects.playBlocked()).not.toThrow();
      expect(() => soundEffects.playLifeLost()).not.toThrow();
      expect(() => soundEffects.playWin()).not.toThrow();
      expect(() => soundEffects.playGameOver()).not.toThrow();
      expect(() => soundEffects.playCoin()).not.toThrow();
    });

    it('manages haptic enablement and executes patterns safely', () => {
      haptics.setEnabled(true);
      expect(haptics.isEnabled()).toBe(true);

      const toggled = haptics.toggle();
      expect(toggled).toBe(false);
      expect(haptics.isEnabled()).toBe(false);

      expect(() => {
        haptics.tap();
        haptics.escape();
        haptics.blocked();
        haptics.lifeLost();
        haptics.win();
        haptics.gameOver();
      }).not.toThrow();
    });
  });

  describe('Settings & Campaign Persistence', () => {
    it('saves and loads game settings with dark, minimal-white, and eye-comfort themes, and zen mode', () => {
      const initial = loadSettings();
      expect(initial.theme).toBe('dark');
      expect(initial.zenMode).toBe(false);
      expect(initial.showGridDots).toBe(true);

      // Minimal-white theme
      saveSettings({
        soundMuted: true,
        hapticsEnabled: false,
        theme: 'minimal-white',
        zenMode: true,
        showGridDots: false,
      });

      let loaded = loadSettings();
      expect(loaded.soundMuted).toBe(true);
      expect(loaded.hapticsEnabled).toBe(false);
      expect(loaded.theme).toBe('minimal-white');
      expect(loaded.zenMode).toBe(true);
      expect(loaded.showGridDots).toBe(false);

      // Eye-comfort theme
      saveSettings({
        soundMuted: false,
        hapticsEnabled: true,
        theme: 'eye-comfort',
        zenMode: false,
        showGridDots: true,
      });

      loaded = loadSettings();
      expect(loaded.theme).toBe('eye-comfort');
      expect(loaded.showGridDots).toBe(true);
    });


    it('records level completion and tracks personal best moves', () => {
      let progress = loadProgress();
      expect(progress.currentLevel).toBe(1);
      expect(progress.completedLevels).toHaveLength(0);

      // Complete level 1 in 8 moves
      progress = recordLevelCompletion(progress, 1, 8);
      expect(progress.currentLevel).toBe(2);
      expect(progress.completedLevels).toContain(1);
      expect(progress.bestMoves[1]).toBe(8);

      // Replay level 1 in 6 moves (improved)
      progress = recordLevelCompletion(progress, 1, 6);
      expect(progress.bestMoves[1]).toBe(6);

      // Replay level 1 in 10 moves (should preserve best 6)
      progress = recordLevelCompletion(progress, 1, 10);
      expect(progress.bestMoves[1]).toBe(6);
    });
  });

  describe('Campaign Level Progression & Scalability', () => {
    it('provides 50 escalating campaign levels across all 4 tiers', () => {
      const list = levelRegistry.getLevelMetadataList();
      expect(list).toHaveLength(TOTAL_CAMPAIGN_LEVELS);

      expect(getDifficultyForLevel(1)).toBe('easy');
      expect(getDifficultyForLevel(8)).toBe('easy');
      expect(getDifficultyForLevel(15)).toBe('medium');
      expect(getDifficultyForLevel(25)).toBe('hard');
      expect(getDifficultyForLevel(45)).toBe('expert');
    });

    it('verifies Level 3 is free of cycle deadlocks and solves in the verified sequence', () => {
      const level3 = levelRegistry.getLevel(3);
      expect(level3.id).toBe(3);
      expect(level3.parMoves).toBe(6);

      const arrow35 = level3.arrows.find((a) => a.id === '3-5');
      expect(arrow35).toBeDefined();
      expect(arrow35!.direction).toBe('down');

      const solverResult = ArrowEscapeSolver.solve(level3);
      expect(solverResult.solvable).toBe(true);
      expect(solverResult.solutionMoves).toEqual(['3-5', '3-4', '3-3', '3-2', '3-6', '3-1']);
    });

    it('verifies all 50 campaign levels fetched from registry are structurally valid and solvable', () => {
      for (let lvlId = 1; lvlId <= TOTAL_CAMPAIGN_LEVELS; lvlId++) {
        const level = levelRegistry.getLevel(lvlId);
        expect(level.id).toBe(lvlId);
        expect(level.arrows.length).toBeGreaterThan(0);
        expect(level.rows).toBeGreaterThanOrEqual(3);
        expect(level.cols).toBeGreaterThanOrEqual(3);

        const solverResult = ArrowEscapeSolver.solve(level);
        expect(solverResult.solvable).toBe(true);
        expect(solverResult.solutionMoves).toBeDefined();

        const hasObstacles = level.arrows.some((a) => a.isFrozen || a.isPivot || a.isBomb);
        if (!hasObstacles) {
          expect(solverResult.solutionMoves!.length).toBe(level.arrows.length);
        } else {
          expect(solverResult.solutionMoves!.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    describe('Master Silhouette Levels (Amaze GO! & Arrows - Puzzle Escape Inspirations)', () => {
      it('verifies Level 36 (The Anchor) is composed of multi-segment serpents with continuous Manhattan adjacency and is 100% solvable', () => {
        const level = levelRegistry.getLevel(36);
        expect(level.name).toBe('The Anchor');
        expect(level.rows).toBe(7);
        expect(level.cols).toBe(7);

        // Every arrow is a multi-segment serpentine snake (length >= 3)
        for (const arrow of level.arrows) {
          expect(arrow.occupiedCells).toBeDefined();
          expect(arrow.occupiedCells!.length).toBeGreaterThanOrEqual(3);

          // Verify strict Manhattan adjacency between consecutive cells (no diagonal jumps or double-backs)
          const cells = arrow.occupiedCells!;
          for (let i = 0; i < cells.length - 1; i++) {
            const dist = Math.abs(cells[i].row - cells[i + 1].row) + Math.abs(cells[i].col - cells[i + 1].col);
            expect(dist).toBe(1);
          }

          // Verify head is at one of the endpoints
          const head = arrow.head!;
          const isEndpoint =
            (cells[0].row === head.row && cells[0].col === head.col) ||
            (cells[cells.length - 1].row === head.row && cells[cells.length - 1].col === head.col);
          expect(isEndpoint).toBe(true);
        }

        const valid = ArrowEscapeSolver.validateLevelStructure(level);
        expect(valid.valid).toBe(true);

        const solution = ArrowEscapeSolver.solve(level);
        expect(solution.solvable).toBe(true);
        expect(solution.solutionMoves).toBeDefined();
        expect(solution.solutionMoves!.length).toBe(level.arrows.length);
      });

      it('verifies Level 37 (The Trophy) is composed of multi-segment serpents with continuous Manhattan adjacency and is 100% solvable', () => {
        const level = levelRegistry.getLevel(37);
        expect(level.name).toBe('The Trophy');
        expect(level.rows).toBe(7);
        expect(level.cols).toBe(7);

        // All arrows are multi-segment serpentine snakes
        for (const arrow of level.arrows) {
          expect(arrow.occupiedCells).toBeDefined();
          expect(arrow.occupiedCells!.length).toBeGreaterThanOrEqual(2);

          const cells = arrow.occupiedCells!;
          for (let i = 0; i < cells.length - 1; i++) {
            const dist = Math.abs(cells[i].row - cells[i + 1].row) + Math.abs(cells[i].col - cells[i + 1].col);
            expect(dist).toBe(1);
          }

          const head = arrow.head!;
          const isEndpoint =
            (cells[0].row === head.row && cells[0].col === head.col) ||
            (cells[cells.length - 1].row === head.row && cells[cells.length - 1].col === head.col);
          expect(isEndpoint).toBe(true);
        }

        const valid = ArrowEscapeSolver.validateLevelStructure(level);
        expect(valid.valid).toBe(true);

        const solution = ArrowEscapeSolver.solve(level);
        expect(solution.solvable).toBe(true);
        expect(solution.solutionMoves).toBeDefined();
        expect(solution.solutionMoves!.length).toBe(level.arrows.length);
      });

      it('verifies Level 38 (The Chess Knight) is composed of multi-segment serpents with continuous Manhattan adjacency and is 100% solvable', () => {
        const level = levelRegistry.getLevel(38);
        expect(level.name).toBe('The Chess Knight');
        expect(level.rows).toBe(7);
        expect(level.cols).toBe(7);

        for (const arrow of level.arrows) {
          expect(arrow.occupiedCells).toBeDefined();
          expect(arrow.occupiedCells!.length).toBeGreaterThanOrEqual(2);

          const cells = arrow.occupiedCells!;
          for (let i = 0; i < cells.length - 1; i++) {
            const dist = Math.abs(cells[i].row - cells[i + 1].row) + Math.abs(cells[i].col - cells[i + 1].col);
            expect(dist).toBe(1);
          }

          const head = arrow.head!;
          const isEndpoint =
            (cells[0].row === head.row && cells[0].col === head.col) ||
            (cells[cells.length - 1].row === head.row && cells[cells.length - 1].col === head.col);
          expect(isEndpoint).toBe(true);
        }

        const valid = ArrowEscapeSolver.validateLevelStructure(level);
        expect(valid.valid).toBe(true);

        const solution = ArrowEscapeSolver.solve(level);
        expect(solution.solvable).toBe(true);
        expect(solution.solutionMoves).toBeDefined();
        expect(solution.solutionMoves!.length).toBe(level.arrows.length);
      });

      it('verifies Level 39 (The Dog) is composed of multi-segment serpents with continuous Manhattan adjacency and is 100% solvable', () => {
        const level = levelRegistry.getLevel(39);
        expect(level.name).toBe('The Dog');
        expect(level.rows).toBe(7);
        expect(level.cols).toBe(7);

        for (const arrow of level.arrows) {
          expect(arrow.occupiedCells).toBeDefined();
          expect(arrow.occupiedCells!.length).toBeGreaterThanOrEqual(2);

          const cells = arrow.occupiedCells!;
          for (let i = 0; i < cells.length - 1; i++) {
            const dist = Math.abs(cells[i].row - cells[i + 1].row) + Math.abs(cells[i].col - cells[i + 1].col);
            expect(dist).toBe(1);
          }

          const head = arrow.head!;
          const isEndpoint =
            (cells[0].row === head.row && cells[0].col === head.col) ||
            (cells[cells.length - 1].row === head.row && cells[cells.length - 1].col === head.col);
          expect(isEndpoint).toBe(true);
        }

        const valid = ArrowEscapeSolver.validateLevelStructure(level);
        expect(valid.valid).toBe(true);

        const solution = ArrowEscapeSolver.solve(level);
        expect(solution.solvable).toBe(true);
        expect(solution.solutionMoves).toBeDefined();
        expect(solution.solutionMoves!.length).toBe(level.arrows.length);
      });

      it('verifies Level 40 (The Heart) is composed of multi-segment serpents with continuous Manhattan adjacency and is 100% solvable', () => {
        const level = levelRegistry.getLevel(40);
        expect(level.name).toBe('The Heart');
        expect(level.rows).toBe(7);
        expect(level.cols).toBe(7);

        for (const arrow of level.arrows) {
          expect(arrow.occupiedCells).toBeDefined();
          expect(arrow.occupiedCells!.length).toBeGreaterThanOrEqual(3);

          const cells = arrow.occupiedCells!;
          for (let i = 0; i < cells.length - 1; i++) {
            const dist = Math.abs(cells[i].row - cells[i + 1].row) + Math.abs(cells[i].col - cells[i + 1].col);
            expect(dist).toBe(1);
          }

          const head = arrow.head!;
          const isEndpoint =
            (cells[0].row === head.row && cells[0].col === head.col) ||
            (cells[cells.length - 1].row === head.row && cells[cells.length - 1].col === head.col);
          expect(isEndpoint).toBe(true);
        }

        const valid = ArrowEscapeSolver.validateLevelStructure(level);
        expect(valid.valid).toBe(true);

        const solution = ArrowEscapeSolver.solve(level);
        expect(solution.solvable).toBe(true);
        expect(solution.solutionMoves).toBeDefined();
        expect(solution.solutionMoves!.length).toBe(level.arrows.length);
      });
    });

    describe('Runtime In-Flight State & Solver Resilience', () => {
      it('correctly ignores in-flight escaping arrows during solveFromState hint calculations', () => {
        const board = new BoardModel(3, 3);
        // Arrow 1 escapes to the right, Arrow 2 is behind it
        const arrow1 = new ArrowModel('a1', 'right', { row: 1, col: 1 }, [{ row: 1, col: 1 }], 'escaping');
        const arrow2 = new ArrowModel('a2', 'right', { row: 1, col: 0 }, [{ row: 1, col: 0 }], 'idle');

        // Since a1 is in mid-flight ('escaping'), a2 must be recognized as eligible to escape
        const result = ArrowEscapeSolver.solveFromState(board, [arrow1, arrow2]);
        expect(result.solvable).toBe(true);
        expect(result.solutionMoves).toEqual(['a2']);
      });
    });
  });
});

