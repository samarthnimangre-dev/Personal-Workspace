import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';
import type { LevelData } from '../types';

describe('GameEngine Pure Functional Engine Suite', () => {
  const sampleLevel: LevelData = {
    id: 101,
    name: 'Engine Test Board',
    rows: 3,
    cols: 3,
    parMoves: 3,
    arrows: [
      { id: 'arr-left', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: 'arr-blocked', row: 1, col: 1, direction: 'left', color: '#3b82f6' }, // blocked by arr-left
      { id: 'arr-down', row: 2, col: 2, direction: 'down', color: '#10b981' },
    ],
  };

  describe('1. createInitialState', () => {
    it('initializes game engine state accurately from level data', () => {
      const state = GameEngine.createInitialState(sampleLevel);

      expect(state.level).toBe(sampleLevel);
      expect(state.board.rows).toBe(3);
      expect(state.board.cols).toBe(3);
      expect(state.movesCount).toBe(0);
      expect(state.status).toBe('playing');
      expect(state.lastResult).toBeNull();
      expect(state.arrows.size).toBe(3);

      const arrLeft = state.arrows.get('arr-left');
      expect(arrLeft).toBeDefined();
      expect(arrLeft!.isIdle).toBe(true);
      expect(arrLeft!.direction).toBe('left');

      // Occupancy map should have 3 occupied cells
      expect(state.occupancy.totalOccupiedCells).toBe(3);
      expect(state.occupancy.isOccupied(1, 0)).toBe(true);
      expect(state.occupancy.isOccupied(1, 1)).toBe(true);
      expect(state.occupancy.isOccupied(2, 2)).toBe(true);
      expect(state.occupancy.isOccupied(0, 0)).toBe(false);
    });
  });

  describe('2. executeTap - Move Execution and Collision Detection', () => {
    it('executes successful escape for an unblocked arrow', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const { nextState, result } = GameEngine.executeTap(state, 'arr-left');

      expect(result.success).toBe(true);
      expect(result.arrowId).toBe('arr-left');
      expect(result.blockerId).toBeUndefined();
      expect(result.path).toEqual([]); // escapes immediately off the board edge

      expect(nextState.movesCount).toBe(1);
      expect(nextState.arrows.get('arr-left')!.state).toBe('escaping');
      expect(nextState.arrows.get('arr-left')!.isEscaping).toBe(true);

      // Trailing arrow 'arr-blocked' should now have clear escape path because 'arr-left'
      // is immediately removed from active spatial occupancy during flight
      expect(nextState.occupancy.isOccupied(1, 0)).toBe(false);
      const trailingTrace = nextState.occupancy.traceEscape(
        nextState.arrows.get('arr-blocked')!,
        nextState.board
      );
      expect(trailingTrace.canEscape).toBe(true);
    });

    it('detects collision and blocker ID when tapping a blocked arrow', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const { nextState, result } = GameEngine.executeTap(state, 'arr-blocked');

      expect(result.success).toBe(false);
      expect(result.arrowId).toBe('arr-blocked');
      expect(result.blockerId).toBe('arr-left');
      expect(result.path).toEqual([{ row: 1, col: 0 }]);

      expect(nextState.movesCount).toBe(1);
      expect(nextState.arrows.get('arr-blocked')!.state).toBe('blocked');
      expect(nextState.arrows.get('arr-blocked')!.isBlocked).toBe(true);

      // 'arr-blocked' remains on the board in occupancy map
      expect(nextState.occupancy.isOccupied(1, 1)).toBe(true);
    });

    it('returns a no-op result when tapping a non-idle arrow or non-existent arrow ID', () => {
      const state = GameEngine.createInitialState(sampleLevel);

      // Non-existent ID
      const missing = GameEngine.executeTap(state, 'non-existent-arrow');
      expect(missing.result.success).toBe(false);
      expect(missing.result.blockerId).toBeUndefined();
      expect(missing.nextState.movesCount).toBe(0);
      expect(missing.nextState).toBe(state);

      // Arrow in escaping state
      const { nextState: escapingState } = GameEngine.executeTap(state, 'arr-left');
      const doubleTap = GameEngine.executeTap(escapingState, 'arr-left');
      expect(doubleTap.result.success).toBe(false);
      expect(doubleTap.result.blockerId).toBeUndefined();
      expect(doubleTap.nextState.movesCount).toBe(1); // unchanged
      expect(doubleTap.nextState).toBe(escapingState);
    });

    it('returns a no-op result without state change when tapping after puzzle is won', () => {
      let state = GameEngine.createInitialState(sampleLevel);
      // Force status to 'won'
      state = { ...state, status: 'won' };

      const { nextState, result } = GameEngine.executeTap(state, 'arr-left');
      expect(result.success).toBe(false);
      expect(result.blockerId).toBeUndefined();
      expect(nextState).toBe(state);
      expect(nextState.movesCount).toBe(0);
    });
  });

  describe('3. finalizeEscape and Victory State Transitions', () => {
    it('marks arrow as escaped and keeps status as playing if other arrows remain', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const { nextState } = GameEngine.executeTap(state, 'arr-left');
      const finalized = GameEngine.finalizeEscape(nextState, 'arr-left');

      expect(finalized.arrows.get('arr-left')!.state).toBe('escaped');
      expect(finalized.arrows.get('arr-left')!.isEscaped).toBe(true);
      expect(finalized.status).toBe('playing');
    });

    it('transitions status to won when all arrows have fully escaped', () => {
      let state = GameEngine.createInitialState(sampleLevel);

      // 1. arr-left escapes and finalizes
      let tap1 = GameEngine.executeTap(state, 'arr-left');
      state = GameEngine.finalizeEscape(tap1.nextState, 'arr-left');
      expect(state.status).toBe('playing');

      // 2. arr-blocked escapes and finalizes
      let tap2 = GameEngine.executeTap(state, 'arr-blocked');
      state = GameEngine.finalizeEscape(tap2.nextState, 'arr-blocked');
      expect(state.status).toBe('playing');

      // 3. arr-down escapes and finalizes (last arrow)
      let tap3 = GameEngine.executeTap(state, 'arr-down');
      state = GameEngine.finalizeEscape(tap3.nextState, 'arr-down');
      expect(state.status).toBe('won');
      expect(state.movesCount).toBe(3);
    });

    it('returns unmodified state if finalizeEscape is called with non-existent arrow ID', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const result = GameEngine.finalizeEscape(state, 'invalid-id');
      expect(result).toBe(state);
    });

    it('returns unmodified state if finalizeEscape is called on an arrow that is idle or blocked (not escaping)', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      // arr-left is idle
      const resultIdle = GameEngine.finalizeEscape(state, 'arr-left');
      expect(resultIdle).toBe(state);

      // Blocked arrow
      const { nextState: blockedState } = GameEngine.executeTap(state, 'arr-blocked');
      const resultBlocked = GameEngine.finalizeEscape(blockedState, 'arr-blocked');
      expect(resultBlocked).toBe(blockedState);
    });
  });

  describe('4. resetBlockedState and Occupancy Map Synchronization', () => {
    it('resets a blocked arrow back to idle state and updates occupancy reference', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const { nextState } = GameEngine.executeTap(state, 'arr-blocked');
      expect(nextState.arrows.get('arr-blocked')!.isBlocked).toBe(true);
      expect(nextState.occupancy.getArrowAt(1, 1)!.isBlocked).toBe(true);

      const resetState = GameEngine.resetBlockedState(nextState, 'arr-blocked');
      expect(resetState.arrows.get('arr-blocked')!.isIdle).toBe(true);
      expect(resetState.arrows.get('arr-blocked')!.state).toBe('idle');
      expect(resetState.occupancy.getArrowAt(1, 1)!.isIdle).toBe(true);
    });

    it('ignores resetBlockedState if arrow is not in blocked state', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      // Arrow is currently idle
      const unchanged = GameEngine.resetBlockedState(state, 'arr-left');
      expect(unchanged).toBe(state);

      // Invalid ID
      const invalid = GameEngine.resetBlockedState(state, 'invalid-id');
      expect(invalid).toBe(state);
    });
  });

  describe('5. Multi-Flight In-Flight Combos & Concurrency', () => {
    it('allows concurrent flights of unblocked arrows while maintaining occupancy accuracy', () => {
      const level: LevelData = {
        id: 105,
        name: 'Concurrent Escapes',
        rows: 3,
        cols: 3,
        parMoves: 3,
        arrows: [
          { id: 'arr-up', row: 0, col: 0, direction: 'up', color: '#06b6d4' },
          { id: 'arr-down', row: 2, col: 2, direction: 'down', color: '#10b981' },
          { id: 'arr-right', row: 1, col: 2, direction: 'right', color: '#ec4899' },
        ],
      };

      let state = GameEngine.createInitialState(level);

      // Tap arr-up: escapes
      const tap1 = GameEngine.executeTap(state, 'arr-up');
      expect(tap1.result.success).toBe(true);
      state = tap1.nextState;

      // Without waiting for arr-up to finalize, tap arr-down: escapes concurrently
      const tap2 = GameEngine.executeTap(state, 'arr-down');
      expect(tap2.result.success).toBe(true);
      state = tap2.nextState;

      // Both arrows are escaping simultaneously
      expect(state.arrows.get('arr-up')!.isEscaping).toBe(true);
      expect(state.arrows.get('arr-down')!.isEscaping).toBe(true);
      expect(state.arrows.get('arr-right')!.isIdle).toBe(true);

      // Occupancy map contains only the idle arr-right
      expect(state.occupancy.totalOccupiedCells).toBe(1);
      expect(state.occupancy.isOccupied(1, 2)).toBe(true);

      // Finalize arr-up
      state = GameEngine.finalizeEscape(state, 'arr-up');
      expect(state.status).toBe('playing');
      expect(state.arrows.get('arr-up')!.isEscaped).toBe(true);
      expect(state.arrows.get('arr-down')!.isEscaping).toBe(true);

      // Finalize arr-down
      state = GameEngine.finalizeEscape(state, 'arr-down');
      expect(state.status).toBe('playing');
      expect(state.arrows.get('arr-down')!.isEscaped).toBe(true);

      // Tap and finalize last arrow
      const tap3 = GameEngine.executeTap(state, 'arr-right');
      state = GameEngine.finalizeEscape(tap3.nextState, 'arr-right');
      expect(state.status).toBe('won');
      expect(state.movesCount).toBe(3);
    });
  });

  describe('6. Functional Immutability & StrictMode Purity', () => {
    it('does not mutate previous state when executing transitions', () => {
      const state1 = GameEngine.createInitialState(sampleLevel);
      const { nextState: state2 } = GameEngine.executeTap(state1, 'arr-left');

      expect(state1.movesCount).toBe(0);
      expect(state2.movesCount).toBe(1);
      expect(state1.arrows.get('arr-left')!.state).toBe('idle');
      expect(state2.arrows.get('arr-left')!.state).toBe('escaping');
      expect(state1.arrows).not.toBe(state2.arrows);

      const state3 = GameEngine.finalizeEscape(state2, 'arr-left');
      expect(state2.arrows.get('arr-left')!.state).toBe('escaping');
      expect(state3.arrows.get('arr-left')!.state).toBe('escaped');
    });

    it('produces identical pure outputs when executeTap is evaluated twice on identical state', () => {
      const state = GameEngine.createInitialState(sampleLevel);
      const run1 = GameEngine.executeTap(state, 'arr-left');
      const run2 = GameEngine.executeTap(state, 'arr-left');

      expect(run1.result).toEqual(run2.result);
      expect(run1.nextState.movesCount).toBe(run2.nextState.movesCount);
      expect(run1.nextState.status).toBe(run2.nextState.status);
      expect(state.movesCount).toBe(0); // input unmodified
    });
  });
});
