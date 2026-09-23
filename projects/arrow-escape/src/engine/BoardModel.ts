// BoardModel defining grid dimensions, bounds checking, mask silhouettes, and campaign level configurations
import type { DeflectorTile, LevelData, MaskShape, Position } from './types';
import { isWithinBounds } from './Direction';
import { CAMPAIGN_LEVELS } from './CampaignLevels';

export class BoardModel {
  readonly rows: number;
  readonly cols: number;
  readonly maskShape?: MaskShape;
  readonly maskCells?: ReadonlySet<string>;
  readonly deflectors: ReadonlyMap<string, DeflectorTile>;

  constructor(
    rows: number,
    cols: number,
    maskShape?: MaskShape,
    mask?: readonly string[],
    deflectors?: readonly DeflectorTile[]
  ) {
    if (rows <= 0 || cols <= 0) {
      throw new Error(`Invalid board dimensions: ${rows}x${cols}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.maskShape = maskShape ?? 'square';

    if (mask && mask.length > 0) {
      this.maskCells = new Set(mask);
    } else if (maskShape && maskShape !== 'square' && maskShape !== 'custom') {
      this.maskCells = BoardModel.generateMask(maskShape, rows, cols);
    }

    const deflMap = new Map<string, DeflectorTile>();
    if (deflectors) {
      for (const d of deflectors) {
        deflMap.set(`${d.row},${d.col}`, d);
      }
    }
    this.deflectors = deflMap;
  }

  isWithinBounds(position: Position): boolean {
    return isWithinBounds(position, this.rows, this.cols);
  }

  isInsideShape(position: Position): boolean {
    if (!this.isWithinBounds(position)) return false;
    if (this.maskCells) {
      return this.maskCells.has(`${position.row},${position.col}`);
    }
    return true;
  }

  isInside(position: Position): boolean {
    return this.isInsideShape(position);
  }

  isInsideCoords(row: number, col: number): boolean {
    return this.isInsideShape({ row, col });
  }

  getDeflectorAt(row: number, col: number): DeflectorTile | undefined {
    return this.deflectors.get(`${row},${col}`);
  }

  get totalCells(): number {
    return this.maskCells ? this.maskCells.size : this.rows * this.cols;
  }

  static generateMask(shape: MaskShape, rows: number, cols: number): Set<string> {
    const mask = new Set<string>();
    const midR = Math.floor(rows / 2);
    const midC = Math.floor(cols / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        switch (shape) {
          case 'cross': {
            if (r === midR || c === midC) {
              mask.add(`${r},${c}`);
            }
            break;
          }
          case 'diamond': {
            const dist = Math.abs(r - midR) + Math.abs(c - midC);
            if (dist <= Math.min(midR, midC) + 1) {
              mask.add(`${r},${c}`);
            }
            break;
          }
          case 'star': {
            const dist = Math.abs(r - midR) + Math.abs(c - midC);
            if (
              r === midR ||
              c === midC ||
              dist <= 1 ||
              (Math.abs(r - midR) === Math.abs(c - midC) && dist <= 3)
            ) {
              mask.add(`${r},${c}`);
            }
            break;
          }
          case 'heart': {
            if (
              (r === 1 && (c === 0 || c === 1 || c === 3 || c === 4)) ||
              (r === 2 && c >= 0 && c <= 4) ||
              (r === 3 && c >= 1 && c <= 3) ||
              (r === 4 && c === 2)
            ) {
              mask.add(`${r},${c}`);
            }
            break;
          }
          default:
            mask.add(`${r},${c}`);
        }
      }
    }
    return mask;
  }
}

// Initial Handcrafted Campaign Levels (re-exported for full backward compatibility)
export const DEFAULT_LEVELS: readonly LevelData[] = CAMPAIGN_LEVELS;

