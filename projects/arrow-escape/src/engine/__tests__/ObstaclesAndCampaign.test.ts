import { describe, it, expect } from 'vitest';
import { ArrowEscapeEngine } from '../ArrowEscapeEngine';
import { ArrowEscapeSolver } from '../ArrowEscapeSolver';
import { BoardModel } from '../BoardModel';
import { GameEngine } from '../GameEngine';
import { ArrowModel } from '../ArrowModel';
import { CAMPAIGN_LEVELS } from '../CampaignLevels';
import { recordLevelCompletion } from '../../persistence/storage';
import type { LevelData, UserProgress } from '../types';

describe('Obstacles & Mechanics Suite', () => {
  describe('Ice Mechanics', () => {
    it('requires multiple hits to crack and shatter ice arrows', () => {
      const level: LevelData = {
        id: 101,
        name: 'Test Ice Shatter',
        rows: 3,
        cols: 3,
        parMoves: 3,
        arrows: [
          {
            id: 'ice-arrow',
            row: 1,
            col: 1,
            direction: 'right',
            color: '#06b6d4',
            isFrozen: true,
            frozenHits: 2,
          },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.getArrow('ice-arrow')?.isFrozen).toBe(true);
      expect(engine.getArrow('ice-arrow')?.frozenHits).toBe(2);

      // Hit 1: Cracks ice, reduces hits to 1, still frozen
      const hit1 = engine.attemptMove('ice-arrow');
      expect(hit1.success).toBe(true);
      expect(hit1.actionType).toBe('iceCrack');
      expect(engine.getArrow('ice-arrow')?.isFrozen).toBe(true);
      expect(engine.getArrow('ice-arrow')?.frozenHits).toBe(1);
      expect(engine.getRemainingArrows()).toHaveLength(1);

      // Hit 2: Shatters ice
      const hit2 = engine.attemptMove('ice-arrow');
      expect(hit2.success).toBe(true);
      expect(hit2.actionType).toBe('iceShatter');
      expect(engine.getArrow('ice-arrow')?.isFrozen).toBe(false);
      expect(engine.getArrow('ice-arrow')?.frozenHits).toBe(0);

      // Hit 3: Escapes board cleanly
      const hit3 = engine.attemptMove('ice-arrow');
      expect(hit3.success).toBe(true);
      expect(hit3.actionType).toBe('escape');
      expect(engine.getRemainingArrows()).toHaveLength(0);
      expect(engine.isLevelComplete()).toBe(true);
    });

    it('blocks other arrows when ice arrow is in the path', () => {
      const level: LevelData = {
        id: 102,
        name: 'Test Ice Blocker',
        rows: 3,
        cols: 3,
        parMoves: 4,
        arrows: [
          { id: 'ice-1', row: 1, col: 2, direction: 'right', color: '#06b6d4', isFrozen: true, frozenHits: 1 },
          { id: 'norm-1', row: 1, col: 0, direction: 'right', color: '#3b82f6' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      // norm-1 is blocked by ice-1
      expect(engine.canEscape('norm-1')).toBe(false);

      const res = engine.attemptMove('norm-1');
      expect(res.success).toBe(false);
      expect(res.actionType).toBe('blocked');
    });
  });

  describe('Pivot Mechanics', () => {
    it('rotates pivot arrow 90 degrees clockwise upon activation', () => {
      const level: LevelData = {
        id: 103,
        name: 'Test Pivot Rotation',
        rows: 4,
        cols: 4,
        parMoves: 2,
        arrows: [
          // Points down into blocker at row 2, col 1
          { id: 'pivot-1', row: 1, col: 1, direction: 'down', color: '#f59e0b', isPivot: true },
          { id: 'blocker-down', row: 2, col: 1, direction: 'right', color: '#06b6d4' },
          { id: 'blocker-left', row: 1, col: 0, direction: 'down', color: '#10b981' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.getArrow('pivot-1')?.direction).toBe('down');

      // Tapping pivot rotates clockwise from down -> left (still blocked by blocker-left at 1,0)
      const move1 = engine.attemptMove('pivot-1');
      expect(move1.success).toBe(true);
      expect(move1.actionType).toBe('pivotRotate');

      const updated = engine.getArrow('pivot-1');
      expect(updated?.direction).toBe('left');
      expect(engine.getRemainingArrows().some((a) => a.id === 'pivot-1')).toBe(true);

      // Tapping pivot again rotates clockwise from left -> up (path up to row 0 is clear!)
      const move2 = engine.attemptMove('pivot-1');
      expect(move2.success).toBe(true);
      expect(move2.actionType).toBe('escape');
      expect(engine.getRemainingArrows().some((a) => a.id === 'pivot-1')).toBe(false);
    });
  });

  describe('Bomb Mechanics', () => {
    it('vaporizes adjacent arrows in a 3x3 blast radius upon detonation', () => {
      const level: LevelData = {
        id: 104,
        name: 'Test Bomb Blast',
        rows: 3,
        cols: 3,
        parMoves: 1,
        arrows: [
          { id: 'bomb-1', row: 1, col: 1, direction: 'up', color: '#f43f5e', isBomb: true },
          { id: 'victim-1', row: 0, col: 1, direction: 'down', color: '#3b82f6' },
          { id: 'victim-2', row: 2, col: 1, direction: 'up', color: '#10b981' },
          { id: 'victim-3', row: 1, col: 0, direction: 'right', color: '#8b5cf6' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.getRemainingArrows()).toHaveLength(4);

      const blast = engine.attemptMove('bomb-1');
      expect(blast.success).toBe(true);
      expect(blast.actionType).toBe('bombDetonate');
      expect(blast.affectedArrowIds).toEqual(
        expect.arrayContaining(['victim-1', 'victim-2', 'victim-3'])
      );
      expect(engine.getRemainingArrows()).toHaveLength(0);
      expect(engine.isLevelComplete()).toBe(true);
    });
  });

  describe('Deflector Tiles & Portals', () => {
    it('redirects an escaping arrow toward deflector target direction', () => {
      const level: LevelData = {
        id: 105,
        name: 'Test Deflector Portal',
        rows: 4,
        cols: 4,
        parMoves: 1,
        deflectors: [
          { row: 1, col: 2, redirectDirection: 'down' },
        ],
        arrows: [
          // Moving right from (1,0), reaches (1,2) where deflector redirects it down off board
          { id: 'redirected', row: 1, col: 0, direction: 'right', color: '#3b82f6' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.canEscape('redirected')).toBe(true);

      const move = engine.attemptMove('redirected');
      expect(move.success).toBe(true);
      expect(move.actionType).toBe('escape');
      // Path visits (1,0) -> (1,1) -> (1,2) -> (2,2) -> (3,2)
      expect(move.path?.some((p) => p.row === 1 && p.col === 2)).toBe(true);
      expect(move.path?.some((p) => p.row === 3 && p.col === 2)).toBe(true);
      expect(engine.isLevelComplete()).toBe(true);
    });

    it('prevents cyclic deflector deadlock with cycle detection', () => {
      const level: LevelData = {
        id: 106,
        name: 'Test Deflector Cycle Loop',
        rows: 3,
        cols: 3,
        parMoves: 1,
        deflectors: [
          // Two deflectors pointing at each other
          { row: 1, col: 1, redirectDirection: 'right' },
          { row: 1, col: 2, redirectDirection: 'left' },
        ],
        arrows: [
          { id: 'trapped', row: 1, col: 0, direction: 'right', color: '#3b82f6' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      // Because deflectors loop infinitely, traceEscape safely detects the cycle and returns blocked
      expect(engine.canEscape('trapped')).toBe(false);
    });

    it('redirects across cascading multiple deflectors sequentially', () => {
      const level: LevelData = {
        id: 111,
        name: 'Test Deflector Cascade',
        rows: 5,
        cols: 5,
        parMoves: 1,
        deflectors: [
          // (1,0) starts moving right -> hits (1,2) turning down -> hits (3,2) turning left -> exits off board at (3,-1)
          { row: 1, col: 2, redirectDirection: 'down' },
          { row: 3, col: 2, redirectDirection: 'left' },
        ],
        arrows: [
          { id: 'zigzag', row: 1, col: 0, direction: 'right', color: '#06b6d4' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.canEscape('zigzag')).toBe(true);

      const move = engine.attemptMove('zigzag');
      expect(move.success).toBe(true);
      expect(move.actionType).toBe('escape');
      // Should traverse (1,1), (1,2), (2,2), (3,2), (3,1), (3,0)
      expect(move.path?.some((p) => p.row === 1 && p.col === 2)).toBe(true);
      expect(move.path?.some((p) => p.row === 3 && p.col === 2)).toBe(true);
      expect(move.path?.some((p) => p.row === 3 && p.col === 0)).toBe(true);
      expect(engine.isLevelComplete()).toBe(true);
    });
  });

  describe('Multi-Segment Snake Arrows', () => {
    it('correctly tracks multi-cell body coordinates for head and tail', () => {
      const level: LevelData = {
        id: 107,
        name: 'Test Multi-Segment Snake',
        rows: 4,
        cols: 4,
        parMoves: 2,
        arrows: [
          {
            id: 'snake-1',
            direction: 'up',
            head: { row: 1, col: 1 },
            occupiedCells: [
              { row: 1, col: 1 },
              { row: 2, col: 1 },
              { row: 2, col: 2 },
            ],
            color: '#10b981',
          },
          {
            id: 'snake-2',
            row: 0,
            col: 1,
            direction: 'up',
            color: '#3b82f6',
          },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      // snake-1 is blocked by snake-2 at (0,1)
      expect(engine.canEscape('snake-1')).toBe(false);
      // snake-2 has clear path upwards
      expect(engine.canEscape('snake-2')).toBe(true);

      engine.attemptMove('snake-2');
      // Now snake-1 has clear path upwards
      expect(engine.canEscape('snake-1')).toBe(true);
      const res = engine.attemptMove('snake-1');
      expect(res.success).toBe(true);
      expect(engine.isLevelComplete()).toBe(true);
    });
  });

  describe('Mask Shapes & Custom Geometry', () => {
    it('generates diamond, cross, star, and heart board masks', () => {
      const diamondMask = BoardModel.generateMask('diamond', 5, 5);
      expect(diamondMask.has('2,2')).toBe(true); // Center is inside
      expect(diamondMask.has('0,0')).toBe(false); // Corner is void

      const crossMask = BoardModel.generateMask('cross', 5, 5);
      expect(crossMask.has('2,2')).toBe(true);
      expect(crossMask.has('0,2')).toBe(true);
      expect(crossMask.has('0,0')).toBe(false);

      const heartMask = BoardModel.generateMask('heart', 5, 5);
      expect(heartMask.has('2,2')).toBe(true);
      expect(heartMask.has('0,0')).toBe(false);
    });

    it('correctly raycasts across void cells without premature escape when another arrow is in the ray path', () => {
      // In a heart mask on a 5x5 board, (1,2) is a void cleft between (1,1) and (1,3).
      const level: LevelData = {
        id: 108,
        name: 'Heart Void Raycast Test',
        rows: 5,
        cols: 5,
        parMoves: 2,
        maskShape: 'heart',
        arrows: [
          // arrow-left points right into void (1,2), behind which sits arrow-right at (1,3)
          { id: 'arrow-left', row: 1, col: 1, direction: 'right', color: '#06b6d4' },
          { id: 'arrow-right', row: 1, col: 3, direction: 'up', color: '#3b82f6' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      // arrow-left MUST NOT escape through void cell (1,2) because (1,3) blocks it!
      expect(engine.canEscape('arrow-left')).toBe(false);
      const move = engine.attemptMove('arrow-left');
      expect(move.success).toBe(false);
      expect(move.blockerId).toBe('arrow-right');

      // arrow-right points up off the board (1,3) -> (0,3) -> (-1,3) outside board bounds
      expect(engine.canEscape('arrow-right')).toBe(true);
      const escapeRight = engine.attemptMove('arrow-right');
      expect(escapeRight.success).toBe(true);

      // Now arrow-left has clear path across void (1,2), (1,3), (1,4), and off the board
      expect(engine.canEscape('arrow-left')).toBe(true);
      const escapeLeft = engine.attemptMove('arrow-left');
      expect(escapeLeft.success).toBe(true);
      expect(engine.isLevelComplete()).toBe(true);
    });

    it('rejects levels with arrows placed outside the shape mask in structural validation', () => {
      const invalidLevel: LevelData = {
        id: 109,
        name: 'Invalid Mask Placement',
        rows: 5,
        cols: 5,
        parMoves: 1,
        maskShape: 'cross',
        arrows: [
          // (0,0) is outside the cross mask!
          { id: 'void-arrow', row: 0, col: 0, direction: 'down', color: '#f43f5e' },
        ],
      };

      const validation = ArrowEscapeSolver.validateLevelStructure(invalidLevel);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('placed outside mask');
    });
  });

  describe('Runtime State Solver & Boosters', () => {
    it('solves from intermediate runtime state using solveFromState', () => {
      const level = CAMPAIGN_LEVELS[2]; // Level 3: 6 arrows
      const board = new BoardModel(level.rows, level.cols);
      const allArrows = level.arrows.map((d) => ArrowModel.fromData(d));

      // Simulate partial completion: arrow 3-5 and 3-4 have already escaped
      const remainingArrows = allArrows.map((a) => {
        if (a.id === '3-5' || a.id === '3-4') {
          return a.withState('escaped');
        }
        return a;
      });

      const result = ArrowEscapeSolver.solveFromState(board, remainingArrows);
      expect(result.solvable).toBe(true);
      expect(result.solutionMoves).toBeDefined();
      expect(result.solutionMoves).toEqual(['3-3', '3-2', '3-6', '3-1']);
    });

    it('executes Bomb Booster on GameEngine clearing target and 3x3 surrounding radius', () => {
      const level: LevelData = {
        id: 110,
        name: 'Booster Bomb Test',
        rows: 4,
        cols: 4,
        parMoves: 1,
        arrows: [
          { id: 'target', row: 1, col: 1, direction: 'down', color: '#06b6d4' },
          { id: 'near-1', row: 0, col: 1, direction: 'up', color: '#3b82f6' },
          { id: 'near-2', row: 2, col: 2, direction: 'right', color: '#10b981' },
          { id: 'far-1', row: 3, col: 3, direction: 'down', color: '#ec4899' },
        ],
      };

      const state = GameEngine.createInitialState(level);
      const { nextState, result } = GameEngine.executeBomb(state, 'target');

      expect(result.success).toBe(true);
      expect(result.actionType).toBe('bombDetonate');
      expect(result.affectedArrowIds).toEqual(expect.arrayContaining(['target', 'near-1', 'near-2']));
      expect(result.affectedArrowIds).not.toContain('far-1');

      expect(nextState.arrows.get('target')?.isEscaped).toBe(true);
      expect(nextState.arrows.get('near-1')?.isEscaped).toBe(true);
      expect(nextState.arrows.get('near-2')?.isEscaped).toBe(true);
      expect(nextState.arrows.get('far-1')?.isEscaped).toBe(false);
      expect(nextState.status).toBe('playing');
    });
  });

  describe('Campaign Levels Complete Solvability', () => {
    it('guarantees all 35 handcrafted campaign levels are fully solvable', () => {
      expect(CAMPAIGN_LEVELS).toHaveLength(35);
      for (const level of CAMPAIGN_LEVELS) {
        expect(level.id).toBeGreaterThanOrEqual(1);
        expect(level.arrows.length).toBeGreaterThanOrEqual(3);
        expect(level.parMoves).toBeGreaterThanOrEqual(level.arrows.length - 4);

        const solverResult = ArrowEscapeSolver.solve(level);
        expect(solverResult.solvable).toBe(true);
        expect(solverResult.solutionMoves).toBeDefined();
        expect(solverResult.solutionMoves!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Economy & Star Progression', () => {
    it('accurately accumulates coins and stars across campaign completions', () => {
      let progress: UserProgress = {
        currentLevel: 1,
        completedLevels: [],
        bestMoves: {},
        coins: 100,
        inventory: { hint: 3, hammer: 2, bomb: 2, undo: 3 },
        stars: {},
      };

      // Complete level 1 with 3 stars and 50 coins reward
      progress = recordLevelCompletion(progress, 1, 3, 3, 50);
      expect(progress.currentLevel).toBe(2);
      expect(progress.completedLevels).toEqual([1]);
      expect(progress.coins).toBe(150);
      expect(progress.stars?.[1]).toBe(3);

      // Replay level 1 with 2 stars (should preserve highest 3 stars)
      progress = recordLevelCompletion(progress, 1, 5, 2, 50);
      expect(progress.stars?.[1]).toBe(3);
      expect(progress.coins).toBe(200);
    });
  });
});
