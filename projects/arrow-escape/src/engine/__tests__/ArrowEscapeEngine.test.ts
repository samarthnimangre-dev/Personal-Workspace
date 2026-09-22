import { describe, it, expect, beforeEach } from 'vitest';
import { ArrowEscapeEngine } from '../ArrowEscapeEngine';
import type { LevelData } from '../types';

describe('ArrowEscapeEngine - Complete Game Engine Test Suite', () => {
  describe('Collision Detection', () => {
    it('detects head-on collision between two opposing arrows', () => {
      const level: LevelData = {
        id: 101,
        name: 'Head-On Collision',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          // arrow1 at (1, 0) pointing right towards (1, 1)
          { id: 'arrow1', head: { row: 1, col: 0 }, direction: 'right' },
          // arrow2 at (1, 2) pointing left towards (1, 1)
          { id: 'arrow2', head: { row: 1, col: 2 }, direction: 'left' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      // arrow1 wants to go right through (1,1) then (1,2) where arrow2 sits -> blocked!
      expect(engine.canEscape('arrow1')).toBe(false);
      // arrow2 wants to go left through (1,1) then (1,0) where arrow1 sits -> blocked!
      expect(engine.canEscape('arrow2')).toBe(false);
      expect(engine.getAvailableArrows()).toHaveLength(0);
    });

    it('detects collision when an arrow path is blocked by the body of a multi-cell arrow', () => {
      const level: LevelData = {
        id: 102,
        name: 'Multi-Cell Body Blocking',
        rows: 4,
        cols: 4,
        parMoves: 2,
        arrows: [
          // arrow1 points up from (2, 1)
          { id: 'arrow1', head: { row: 2, col: 1 }, direction: 'up' },
          // arrow2 is a 3-cell horizontal bar spanning (1, 0), (1, 1), (1, 2) with head at (1, 3) pointing right
          {
            id: 'arrow2',
            head: { row: 1, col: 3 },
            occupiedCells: [
              { row: 1, col: 3 },
              { row: 1, col: 2 },
              { row: 1, col: 1 },
              { row: 1, col: 0 },
            ],
            direction: 'right',
          },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      // arrow1 pointing up from row 2 must pass row 1 col 1, which is occupied by arrow2 body!
      expect(engine.canEscape('arrow1')).toBe(false);

      // arrow2 head is at (1, 3) pointing right toward board edge -> clear!
      expect(engine.canEscape('arrow2')).toBe(true);
      expect(engine.getAvailableArrows().map((a) => a.id)).toEqual(['arrow2']);
    });

    it('detects diagonal collisions properly', () => {
      const level: LevelData = {
        id: 103,
        name: 'Diagonal Collision',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          // arrow1 at (2, 0) pointing up-right towards (1, 1) and (0, 2)
          { id: 'arrow1', head: { row: 2, col: 0 }, direction: 'up-right' },
          // arrow2 at (1, 1) blocking the diagonal
          { id: 'arrow2', head: { row: 1, col: 1 }, direction: 'down' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.canEscape('arrow1')).toBe(false);

      // arrow2 at (1, 1) points down through (2, 1) to edge -> empty!
      expect(engine.canEscape('arrow2')).toBe(true);
    });
  });

  describe('Edge Exits (All 8 Directions)', () => {
    it('allows immediate escape when arrow head is at the board boundary facing outward', () => {
      const level: LevelData = {
        id: 201,
        name: 'Perimeter Boundary Exits',
        rows: 4,
        cols: 4,
        parMoves: 4,
        arrows: [
          { id: 'top-edge', head: { row: 0, col: 1 }, direction: 'up' },
          { id: 'bottom-edge', head: { row: 3, col: 2 }, direction: 'down' },
          { id: 'left-edge', head: { row: 2, col: 0 }, direction: 'left' },
          { id: 'right-edge', head: { row: 1, col: 3 }, direction: 'right' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      expect(engine.canEscape('top-edge')).toBe(true);
      expect(engine.canEscape('bottom-edge')).toBe(true);
      expect(engine.canEscape('left-edge')).toBe(true);
      expect(engine.canEscape('right-edge')).toBe(true);
      expect(engine.getAvailableArrows()).toHaveLength(4);
    });

    it('verifies all 4 diagonal exit trajectories', () => {
      const level: LevelData = {
        id: 202,
        name: 'Corner Diagonal Exits',
        rows: 5,
        cols: 5,
        parMoves: 4,
        arrows: [
          // (1, 1) pointing up-left traverses (0, 0) then exits
          { id: 'corner-ul', head: { row: 1, col: 1 }, direction: 'up-left' },
          // (1, 3) pointing up-right traverses (0, 4) then exits
          { id: 'corner-ur', head: { row: 1, col: 3 }, direction: 'up-right' },
          // (3, 1) pointing down-left traverses (4, 0) then exits
          { id: 'corner-dl', head: { row: 3, col: 1 }, direction: 'down-left' },
          // (3, 3) pointing down-right traverses (4, 4) then exits
          { id: 'corner-dr', head: { row: 3, col: 3 }, direction: 'down-right' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      expect(engine.canEscape('corner-ul')).toBe(true);
      expect(engine.canEscape('corner-ur')).toBe(true);
      expect(engine.canEscape('corner-dl')).toBe(true);
      expect(engine.canEscape('corner-dr')).toBe(true);
    });

    it('allows interior arrow to escape across multiple empty cells toward board edge', () => {
      const level: LevelData = {
        id: 203,
        name: 'Deep Corridor Escape',
        rows: 7,
        cols: 7,
        parMoves: 1,
        arrows: [
          // Arrow at (3, 3) pointing left. Cells (3, 2), (3, 1), (3, 0) are all empty.
          { id: 'center-arrow', head: { row: 3, col: 3 }, direction: 'left' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);
      expect(engine.canEscape('center-arrow')).toBe(true);
      const moveRes = engine.attemptMove('center-arrow');
      expect(moveRes.success).toBe(true);
      expect(moveRes.path).toEqual([
        { row: 3, col: 2 },
        { row: 3, col: 1 },
        { row: 3, col: 0 },
      ]);
    });
  });

  describe('Blocked Arrows Invariant ("A blocked arrow must not move")', () => {
    let engine: ArrowEscapeEngine;

    beforeEach(() => {
      const level: LevelData = {
        id: 301,
        name: 'Blocked Invariant Test',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          { id: 'blocked-arrow', head: { row: 1, col: 1 }, direction: 'right' },
          { id: 'blocker', head: { row: 1, col: 2 }, direction: 'up' },
        ],
      };
      engine = new ArrowEscapeEngine(level);
    });

    it('returns false when calling removeArrow on a blocked arrow', () => {
      expect(engine.canEscape('blocked-arrow')).toBe(false);
      const removed = engine.removeArrow('blocked-arrow');
      expect(removed).toBe(false);
    });

    it('does not alter board state or positions when blocked arrow attempts removal', () => {
      const beforeRemaining = engine.getRemainingArrows();
      expect(beforeRemaining).toHaveLength(2);

      engine.removeArrow('blocked-arrow');

      const afterRemaining = engine.getRemainingArrows();
      expect(afterRemaining).toHaveLength(2);

      const arrow = engine.getArrow('blocked-arrow');
      expect(arrow?.isEscaped).toBe(false);
      expect(arrow?.position).toEqual({ row: 1, col: 1 });
      expect(engine.getOccupancyMap().isOccupied(1, 1)).toBe(true);
    });

    it('returns attemptMove success=false with blockerId for a blocked arrow', () => {
      const res = engine.attemptMove('blocked-arrow');
      expect(res.success).toBe(false);
      expect(res.blockerId).toBe('blocker');
      expect(res.path).toEqual([{ row: 1, col: 2 }]);
    });
  });

  describe('Removal and Path Unblocking', () => {
    it('permanently removes an escaped arrow and frees all its occupied cells', () => {
      const level: LevelData = {
        id: 401,
        name: 'Chain Removal Test',
        rows: 3,
        cols: 3,
        parMoves: 2,
        arrows: [
          // arrow1 at (1, 0) blocks arrow2 at (1, 1)
          { id: 'arrow1', head: { row: 1, col: 0 }, direction: 'left' },
          { id: 'arrow2', head: { row: 1, col: 1 }, direction: 'left' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      // Initially, arrow2 cannot escape because arrow1 blocks it
      expect(engine.canEscape('arrow1')).toBe(true);
      expect(engine.canEscape('arrow2')).toBe(false);

      // Successfully escape and remove arrow1
      const removed1 = engine.removeArrow('arrow1');
      expect(removed1).toBe(true);
      expect(engine.getArrow('arrow1')?.isEscaped).toBe(true);
      expect(engine.getOccupancyMap().isOccupied(1, 0)).toBe(false);

      // Now arrow2 is unblocked and can escape!
      expect(engine.canEscape('arrow2')).toBe(true);
      expect(engine.getAvailableArrows().map((a) => a.id)).toEqual(['arrow2']);

      // Remove arrow2
      const removed2 = engine.removeArrow('arrow2');
      expect(removed2).toBe(true);
      expect(engine.getArrow('arrow2')?.isEscaped).toBe(true);
      expect(engine.getOccupancyMap().isOccupied(1, 1)).toBe(false);
    });

    it('frees multiple cells when a multi-cell arrow escapes', () => {
      const level: LevelData = {
        id: 402,
        name: 'Multi-Cell Unblocking',
        rows: 3,
        cols: 4,
        parMoves: 3,
        arrows: [
          // longArrow occupies (1, 1), (1, 2), (1, 3) pointing right
          {
            id: 'longArrow',
            head: { row: 1, col: 3 },
            occupiedCells: [
              { row: 1, col: 3 },
              { row: 1, col: 2 },
              { row: 1, col: 1 },
            ],
            direction: 'right',
          },
          // blockedUp at (2, 1) pointing up towards (1, 1)
          { id: 'blockedUp', head: { row: 2, col: 1 }, direction: 'up' },
          // blockedDown at (0, 2) pointing down towards (1, 2)
          { id: 'blockedDown', head: { row: 0, col: 2 }, direction: 'down' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      // Both vertical arrows are blocked by the body of longArrow
      expect(engine.canEscape('blockedUp')).toBe(false);
      expect(engine.canEscape('blockedDown')).toBe(false);
      expect(engine.canEscape('longArrow')).toBe(true);

      // Remove longArrow
      expect(engine.removeArrow('longArrow')).toBe(true);

      // All 3 cells occupied by longArrow must now be empty
      expect(engine.getOccupancyMap().isOccupied(1, 1)).toBe(false);
      expect(engine.getOccupancyMap().isOccupied(1, 2)).toBe(false);
      expect(engine.getOccupancyMap().isOccupied(1, 3)).toBe(false);

      // Both vertical arrows must now be free to escape!
      expect(engine.canEscape('blockedUp')).toBe(true);
      expect(engine.canEscape('blockedDown')).toBe(true);
    });
  });

  describe('Level Win Detection', () => {
    it('reports isLevelComplete=false while arrows remain and true when all escape', () => {
      const level: LevelData = {
        id: 501,
        name: 'Win Detection',
        rows: 3,
        cols: 3,
        parMoves: 3,
        arrows: [
          { id: 'a', head: { row: 0, col: 1 }, direction: 'up' },
          { id: 'b', head: { row: 2, col: 1 }, direction: 'down' },
          { id: 'c', head: { row: 1, col: 2 }, direction: 'right' },
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      expect(engine.isLevelComplete()).toBe(false);
      expect(engine.getRemainingArrows()).toHaveLength(3);

      engine.removeArrow('a');
      expect(engine.isLevelComplete()).toBe(false);
      expect(engine.getRemainingArrows()).toHaveLength(2);

      engine.removeArrow('b');
      expect(engine.isLevelComplete()).toBe(false);
      expect(engine.getRemainingArrows()).toHaveLength(1);

      engine.removeArrow('c');
      // All arrows removed -> victory!
      expect(engine.isLevelComplete()).toBe(true);
      expect(engine.getRemainingArrows()).toHaveLength(0);
      expect(engine.getAvailableArrows()).toHaveLength(0);
    });

    it('solves a complete 4-arrow pinwheel cycle', () => {
      // In a 4-arrow pinwheel, each arrow blocks the next in a circle, EXCEPT one unblocked key
      const level: LevelData = {
        id: 502,
        name: 'Pinwheel Cycle',
        rows: 3,
        cols: 3,
        parMoves: 4,
        arrows: [
          { id: 'top', head: { row: 0, col: 0 }, direction: 'right' }, // points toward (0, 1)
          { id: 'right', head: { row: 0, col: 2 }, direction: 'down' }, // points toward (1, 2)
          { id: 'bottom', head: { row: 2, col: 2 }, direction: 'left' }, // points toward (2, 1)
          { id: 'exit', head: { row: 2, col: 0 }, direction: 'left' }, // points left off board!
        ],
      };

      const engine = new ArrowEscapeEngine(level);

      // 'exit' is the only arrow pointing directly off-board
      const availableInitial = engine.getAvailableArrows();
      expect(availableInitial.map((a) => a.id)).toEqual(['exit']);

      expect(engine.removeArrow('exit')).toBe(true);
      expect(engine.isLevelComplete()).toBe(false);

      // Reset allows restoring level
      engine.reset();
      expect(engine.getRemainingArrows()).toHaveLength(4);
      expect(engine.isLevelComplete()).toBe(false);
    });
  });
});
