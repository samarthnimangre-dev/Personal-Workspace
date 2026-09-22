// Arrow entity model representing a single puzzle tile
import type { ArrowData, ArrowState, Direction, Position } from './types';
import { getDirectionAngle } from './Direction';

export class ArrowModel {
  readonly id: string;
  readonly position: Position;
  readonly direction: Direction;
  readonly state: ArrowState;
  readonly color: string;

  constructor(
    id: string,
    position: Position,
    direction: Direction,
    state: ArrowState = 'idle',
    color: string = '#06b6d4'
  ) {
    this.id = id;
    this.position = position;
    this.direction = direction;
    this.state = state;
    this.color = color;
  }

  get row(): number {
    return this.position.row;
  }

  get col(): number {
    return this.position.col;
  }

  get angle(): number {
    return getDirectionAngle(this.direction);
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

  withState(state: ArrowState): ArrowModel {
    if (this.state === state) return this;
    return new ArrowModel(this.id, this.position, this.direction, state, this.color);
  }

  withPosition(position: Position): ArrowModel {
    return new ArrowModel(this.id, position, this.direction, this.state, this.color);
  }

  static fromData(data: ArrowData): ArrowModel {
    return new ArrowModel(
      data.id,
      { row: data.row, col: data.col },
      data.direction,
      'idle',
      data.color ?? '#06b6d4'
    );
  }
}
