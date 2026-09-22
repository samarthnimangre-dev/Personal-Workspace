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
    const board = new BoardModel(level.rows, level.cols);
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
        blockerId: trace.blockerId,
        path: trace.path,
      };

      const nextMovesCount = state.movesCount + 1;
      const nextState: GameEngineState = {
        ...state,
        arrows: nextArrows,
        movesCount: nextMovesCount,
        lastResult: result,
      };

      return { nextState, result };
    }
  }

  // Marks an escaping arrow as fully escaped and checks for level victory
  static finalizeEscape(state: GameEngineState, arrowId: string): GameEngineState {
    const arrow = state.arrows.get(arrowId);
    if (!arrow) return state;

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
    };
  }
}
