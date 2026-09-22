// Arrow entity model representing a directed arrow puzzle piece
// Each arrow has a direction, a head cell, and one or more occupied cells.
import type { ArrowData, ArrowState, Direction, Position } from './types';
import { getDirectionAngle } from './Direction';

export class ArrowModel {
  readonly id: string;
  readonly direction: Direction;
  readonly head: Position;
  readonly occupiedCells: readonly Position[];
  readonly state: ArrowState;
  readonly color: string;

  constructor(
    id: string,
    direction: Direction,
    head: Position,
    occupiedCells?: readonly Position[],
    state: ArrowState = 'idle',
    color: string = '#06b6d4'
  ) {
    if (!id) {
      throw new Error('Arrow id cannot be empty');
    }

    this.id = id;
    this.direction = direction;
    this.head = { row: head.row, col: head.col };

    // Ensure occupiedCells contains at least the head cell
    if (!occupiedCells || occupiedCells.length === 0) {
      this.occupiedCells = [this.head];
    } else {
      const hasHead = occupiedCells.some(
        (cell) => cell.row === head.row && cell.col === head.col
      );
      this.occupiedCells = hasHead ? [...occupiedCells] : [this.head, ...occupiedCells];
    }

    this.state = state;
    this.color = color;
  }

  get row(): number {
    return this.head.row;
  }

  get col(): number {
    return this.head.col;
  }

  get position(): Position {
    return this.head;
  }

  get angle(): number {
    return getDirectionAngle(this.direction);
  }

  get length(): number {
    return this.occupiedCells.length;
  }

  get isIdle(): boolean {
    return this.state === 'idle';
  }

  get isEscaping(): boolean {
    return this.state === 'escaping';
  }

  get isEscaped(): boolean {
    return this.state === 'escaped';
  }

  get isBlocked(): boolean {
    return this.state === 'blocked';
  }

  occupies(row: number, col: number): boolean {
    return this.occupiedCells.some((cell) => cell.row === row && cell.col === col);
  }

  withState(state: ArrowState): ArrowModel {
    if (this.state === state) return this;
    return new ArrowModel(
      this.id,
      this.direction,
      this.head,
      this.occupiedCells,
      state,
      this.color
    );
  }

  static fromData(data: ArrowData): ArrowModel {
    const head: Position =
      data.head ??
      (data.row !== undefined && data.col !== undefined
        ? { row: data.row, col: data.col }
        : (() => {
            throw new Error(`Arrow ${data.id} must define a head cell or row/col coordinates.`);
          })());

    return new ArrowModel(
      data.id,
      data.direction,
      head,
      data.occupiedCells,
      'idle',
      data.color ?? '#06b6d4'
    );
  }
}
