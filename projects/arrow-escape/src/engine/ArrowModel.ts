// Arrow entity model representing a directed arrow puzzle piece
// Each arrow has a direction, a head cell, and one or more occupied cells.
import type { ArrowData, ArrowState, Direction, Position } from './types';
import { getDirectionAngle, rotateClockwise } from './Direction';

export class ArrowModel {
  readonly id: string;
  readonly direction: Direction;
  readonly head: Position;
  readonly occupiedCells: readonly Position[];
  readonly state: ArrowState;
  readonly color: string;
  readonly isFrozen: boolean;
  readonly frozenHits: number;
  readonly isPivot: boolean;
  readonly isBomb: boolean;
  readonly isHinted: boolean;

  constructor(
    id: string,
    direction: Direction,
    head: Position,
    occupiedCells?: readonly Position[],
    state: ArrowState = 'idle',
    color: string = '#06b6d4',
    isFrozen: boolean = false,
    frozenHits: number = 0,
    isPivot: boolean = false,
    isBomb: boolean = false,
    isHinted: boolean = false
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
    this.isFrozen = isFrozen;
    this.frozenHits = frozenHits;
    this.isPivot = isPivot;
    this.isBomb = isBomb;
    this.isHinted = isHinted;
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
      this.color,
      this.isFrozen,
      this.frozenHits,
      this.isPivot,
      this.isBomb,
      this.isHinted
    );
  }

  withDirection(direction: Direction): ArrowModel {
    if (this.direction === direction) return this;
    return new ArrowModel(
      this.id,
      direction,
      this.head,
      this.occupiedCells,
      this.state,
      this.color,
      this.isFrozen,
      this.frozenHits,
      this.isPivot,
      this.isBomb,
      this.isHinted
    );
  }

  withIceHit(): ArrowModel {
    const nextHits = Math.max(0, this.frozenHits - 1);
    return new ArrowModel(
      this.id,
      this.direction,
      this.head,
      this.occupiedCells,
      this.state,
      this.color,
      nextHits > 0,
      nextHits,
      this.isPivot,
      this.isBomb,
      this.isHinted
    );
  }

  withPivotRotated(): ArrowModel {
    const nextDir = rotateClockwise(this.direction);
    return new ArrowModel(
      this.id,
      nextDir,
      this.head,
      this.occupiedCells,
      this.state,
      this.color,
      this.isFrozen,
      this.frozenHits,
      this.isPivot,
      this.isBomb,
      this.isHinted
    );
  }

  withHinted(isHinted: boolean): ArrowModel {
    if (this.isHinted === isHinted) return this;
    return new ArrowModel(
      this.id,
      this.direction,
      this.head,
      this.occupiedCells,
      this.state,
      this.color,
      this.isFrozen,
      this.frozenHits,
      this.isPivot,
      this.isBomb,
      isHinted
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

    const isFrozen = Boolean(data.isFrozen);
    const frozenHits = data.frozenHits ?? (isFrozen ? 1 : 0);

    return new ArrowModel(
      data.id,
      data.direction,
      head,
      data.occupiedCells,
      'idle',
      data.color ?? '#06b6d4',
      isFrozen,
      frozenHits,
      Boolean(data.isPivot),
      Boolean(data.isBomb),
      Boolean(data.isHinted)
    );
  }
}

