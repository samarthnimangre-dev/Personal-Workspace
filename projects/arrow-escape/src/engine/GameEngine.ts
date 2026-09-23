// Pure functional game engine managing state transitions, moves, and victory conditions
import type { LevelData, MoveResult } from './types';
import { BoardModel } from './BoardModel';
import { ArrowModel } from './ArrowModel';
import { OccupancyMap } from './OccupancyMap';

export interface GameEngineState {
  readonly level: LevelData;
  readonly board: BoardModel;
  readonly arrows: ReadonlyMap<string, ArrowModel>;
  readonly occupancy: OccupancyMap;
  readonly movesCount: number;
  readonly status: 'playing' | 'won';
  readonly lastResult: MoveResult | null;
}

export class GameEngine {
  static createInitialState(level: LevelData): GameEngineState {
    const board = new BoardModel(
      level.rows,
      level.cols,
      level.maskShape,
      level.mask,
      level.deflectors
    );
    const arrowsMap = new Map<string, ArrowModel>();

    for (const data of level.arrows) {
      arrowsMap.set(data.id, ArrowModel.fromData(data));
    }

    const arrowsList = Array.from(arrowsMap.values());
    const occupancy = new OccupancyMap(arrowsList);

    return {
      level,
      board,
      arrows: arrowsMap,
      occupancy,
      movesCount: 0,
      status: 'playing',
      lastResult: null,
    };
  }

  static executeTap(
    state: GameEngineState,
    arrowId: string
  ): { nextState: GameEngineState; result: MoveResult } {
    if (state.status === 'won') {
      const emptyResult: MoveResult = { success: false, arrowId, path: [] };
      return { nextState: state, result: emptyResult };
    }

    const arrow = state.arrows.get(arrowId);
    if (!arrow || !arrow.isIdle) {
      const noopResult: MoveResult = { success: false, arrowId, path: [] };
      return { nextState: state, result: noopResult };
    }

    // 1. ICE OBSTACLE TAP
    if (arrow.isFrozen) {
      const updatedArrow = arrow.withIceHit();
      const nextArrows = new Map(state.arrows);
      nextArrows.set(arrowId, updatedArrow);

      const actionType = updatedArrow.isFrozen ? 'iceCrack' : 'iceShatter';
      const result: MoveResult = {
        success: true,
        arrowId,
        actionType,
        path: [],
      };

      const nextState: GameEngineState = {
        ...state,
        arrows: nextArrows,
        occupancy: new OccupancyMap(Array.from(nextArrows.values())),
        movesCount: state.movesCount + 1,
        lastResult: result,
      };

      return { nextState, result };
    }

    // 2. BOMB ARROW DETONATION
    if (arrow.isBomb) {
      const bombCells = arrow.occupiedCells;
      const affected: string[] = [];
      const nextArrows = new Map(state.arrows);

      // Clears bomb itself
      nextArrows.set(arrowId, arrow.withState('escaped'));

      // Detonate 3x3 surrounding radius
      for (const [id, other] of state.arrows.entries()) {
        if (id === arrowId || other.isEscaped) continue;
        const isNear = other.occupiedCells.some((c) =>
          bombCells.some(
            (bc) => Math.max(Math.abs(c.row - bc.row), Math.abs(c.col - bc.col)) <= 1
          )
        );
        if (isNear) {
          affected.push(id);
          nextArrows.set(id, other.withState('escaped'));
        }
      }

      const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));
      const allEscaped = Array.from(nextArrows.values()).every((a) => a.isEscaped);

      const result: MoveResult = {
        success: true,
        arrowId,
        actionType: 'bombDetonate',
        affectedArrowIds: affected,
        path: [],
      };

      const nextState: GameEngineState = {
        ...state,
        arrows: nextArrows,
        occupancy: nextOccupancy,
        movesCount: state.movesCount + 1,
        status: allEscaped ? 'won' : state.status,
        lastResult: result,
      };

      return { nextState, result };
    }

    // 3. PIVOT ARROW TAP
    if (arrow.isPivot) {
      const rotated = arrow.withPivotRotated();
      const trace = state.occupancy.traceEscape(rotated, state.board);

      if (trace.canEscape) {
        // Escapes in the newly rotated direction!
        const updatedArrow = rotated.withState('escaping');
        const nextArrows = new Map(state.arrows);
        nextArrows.set(arrowId, updatedArrow);

        const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));
        const result: MoveResult = {
          success: true,
          arrowId,
          actionType: 'escape',
          path: trace.path,
        };

        const nextState: GameEngineState = {
          ...state,
          arrows: nextArrows,
          occupancy: nextOccupancy,
          movesCount: state.movesCount + 1,
          lastResult: result,
        };

        return { nextState, result };
      } else {
        // Stays rotated facing new direction
        const nextArrows = new Map(state.arrows);
        nextArrows.set(arrowId, rotated);

        const result: MoveResult = {
          success: true,
          arrowId,
          actionType: 'pivotRotate',
          blockerId: trace.blockerId,
          path: trace.path,
        };

        const nextState: GameEngineState = {
          ...state,
          arrows: nextArrows,
          occupancy: new OccupancyMap(Array.from(nextArrows.values())),
          movesCount: state.movesCount + 1,
          lastResult: result,
        };

        return { nextState, result };
      }
    }

    // 4. REGULAR ARROW
    const trace = state.occupancy.traceEscape(arrow, state.board);

    if (trace.canEscape) {
      // SUCCESSFUL ESCAPE
      const updatedArrow = arrow.withState('escaping');
      const nextArrows = new Map(state.arrows);
      nextArrows.set(arrowId, updatedArrow);

      // Remove from active spatial occupancy immediately so trailing arrows can escape
      const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));

      const result: MoveResult = {
        success: true,
        arrowId,
        actionType: 'escape',
        path: trace.path,
      };

      const nextMovesCount = state.movesCount + 1;
      const nextState: GameEngineState = {
        ...state,
        arrows: nextArrows,
        occupancy: nextOccupancy,
        movesCount: nextMovesCount,
        lastResult: result,
      };

      return { nextState, result };
    } else {
      // BLOCKED COLLISION
      const updatedArrow = arrow.withState('blocked');
      const nextArrows = new Map(state.arrows);
      nextArrows.set(arrowId, updatedArrow);

      const result: MoveResult = {
        success: false,
        arrowId,
        actionType: 'blocked',
        blockerId: trace.blockerId,
        path: trace.path,
      };

      const nextMovesCount = state.movesCount + 1;
      const nextState: GameEngineState = {
        ...state,
        arrows: nextArrows,
        occupancy: new OccupancyMap(Array.from(nextArrows.values())),
        movesCount: nextMovesCount,
        lastResult: result,
      };

      return { nextState, result };
    }
  }

  // BOOSTER: Hammer smashes selected arrow immediately
  static executeHammer(
    state: GameEngineState,
    arrowId: string
  ): { nextState: GameEngineState; result: MoveResult } {
    const arrow = state.arrows.get(arrowId);
    if (!arrow || arrow.isEscaped) {
      return { nextState: state, result: { success: false, arrowId, path: [] } };
    }

    const nextArrows = new Map(state.arrows);
    nextArrows.set(arrowId, arrow.withState('escaped'));
    const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));
    const allEscaped = Array.from(nextArrows.values()).every((a) => a.isEscaped);

    const result: MoveResult = {
      success: true,
      arrowId,
      actionType: 'boosterHammer',
      path: [],
    };

    const nextState: GameEngineState = {
      ...state,
      arrows: nextArrows,
      occupancy: nextOccupancy,
      status: allEscaped ? 'won' : state.status,
      lastResult: result,
    };

    return { nextState, result };
  }

  // BOOSTER: Bomb triggers 3x3 detonation centered at selected arrow
  static executeBomb(
    state: GameEngineState,
    arrowId: string
  ): { nextState: GameEngineState; result: MoveResult } {
    const arrow = state.arrows.get(arrowId);
    if (!arrow || arrow.isEscaped) {
      return { nextState: state, result: { success: false, arrowId, path: [] } };
    }

    const bombCells = arrow.occupiedCells;
    const affected: string[] = [arrowId];
    const nextArrows = new Map(state.arrows);

    nextArrows.set(arrowId, arrow.withState('escaped'));

    for (const [id, other] of state.arrows.entries()) {
      if (id === arrowId || other.isEscaped) continue;
      const isNear = other.occupiedCells.some((c) =>
        bombCells.some(
          (bc) => Math.max(Math.abs(c.row - bc.row), Math.abs(c.col - bc.col)) <= 1
        )
      );
      if (isNear) {
        affected.push(id);
        nextArrows.set(id, other.withState('escaped'));
      }
    }

    const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));
    const allEscaped = Array.from(nextArrows.values()).every((a) => a.isEscaped);

    const result: MoveResult = {
      success: true,
      arrowId,
      actionType: 'bombDetonate',
      affectedArrowIds: affected,
      path: [],
    };

    const nextState: GameEngineState = {
      ...state,
      arrows: nextArrows,
      occupancy: nextOccupancy,
      status: allEscaped ? 'won' : state.status,
      lastResult: result,
    };

    return { nextState, result };
  }

  // BOOSTER: Highlight next suggested arrow
  static executeHint(state: GameEngineState, arrowId: string): GameEngineState {
    const nextArrows = new Map(state.arrows);
    for (const [id, a] of state.arrows.entries()) {
      if (id === arrowId) {
        nextArrows.set(id, a.withHinted(true));
      } else if (a.isHinted) {
        nextArrows.set(id, a.withHinted(false));
      }
    }
    return {
      ...state,
      arrows: nextArrows,
    };
  }

  // Clear hinted flags
  static clearHint(state: GameEngineState): GameEngineState {
    const nextArrows = new Map(state.arrows);
    for (const [id, a] of state.arrows.entries()) {
      if (a.isHinted) {
        nextArrows.set(id, a.withHinted(false));
      }
    }
    return {
      ...state,
      arrows: nextArrows,
    };
  }

  // Marks an escaping arrow as fully escaped and checks for level victory
  static finalizeEscape(state: GameEngineState, arrowId: string): GameEngineState {
    const arrow = state.arrows.get(arrowId);
    if (!arrow || arrow.state !== 'escaping') return state;

    const updatedArrow = arrow.withState('escaped');
    const nextArrows = new Map(state.arrows);
    nextArrows.set(arrowId, updatedArrow);

    const nextOccupancy = new OccupancyMap(Array.from(nextArrows.values()));

    // Check if all arrows have successfully escaped
    const allEscaped = Array.from(nextArrows.values()).every((a) => a.isEscaped);

    return {
      ...state,
      arrows: nextArrows,
      occupancy: nextOccupancy,
      status: allEscaped ? 'won' : state.status,
    };
  }

  // Resets a blocked arrow's state back to idle after animation finishes
  static resetBlockedState(state: GameEngineState, arrowId: string): GameEngineState {
    const arrow = state.arrows.get(arrowId);
    if (!arrow || arrow.state !== 'blocked') return state;

    const nextArrows = new Map(state.arrows);
    nextArrows.set(arrowId, arrow.withState('idle'));

    return {
      ...state,
      arrows: nextArrows,
      occupancy: new OccupancyMap(Array.from(nextArrows.values())),
    };
  }
}
