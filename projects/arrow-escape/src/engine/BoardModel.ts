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

// Master-Crafted Silhouette Levels inspired by Amaze GO! and Arrows - Puzzle Escape
export const SILHOUETTE_LEVELS: readonly LevelData[] = [
  // ── Level 36: The Anchor (inspired by Level 27 in Amaze GO!) ─────────────
  {
    id: 36,
    name: 'The Anchor',
    subtitle: 'The maritime silhouette of winding serpents (inspired by Amaze GO! Lvl 27)',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 8,
    rewardCoins: 1200,
    arrows: [
      {
        id: 'anc-cross-l',
        direction: 'left',
        head: { row: 2, col: 1 },
        occupiedCells: [{ row: 2, col: 1 }, { row: 2, col: 2 }, { row: 1, col: 2 }],
        color: '#06b6d4',
      },
      {
        id: 'anc-cross-r',
        direction: 'right',
        head: { row: 2, col: 5 },
        occupiedCells: [{ row: 2, col: 5 }, { row: 2, col: 4 }, { row: 1, col: 4 }],
        color: '#06b6d4',
      },
      {
        id: 'anc-ring',
        direction: 'left',
        head: { row: 0, col: 2 },
        occupiedCells: [{ row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
        color: '#3b82f6',
      },
      {
        id: 'anc-shank',
        direction: 'up',
        head: { row: 1, col: 3 },
        occupiedCells: [{ row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }],
        color: '#8b5cf6',
      },
      {
        id: 'anc-fluke-l',
        direction: 'up',
        head: { row: 4, col: 1 },
        occupiedCells: [{ row: 4, col: 1 }, { row: 5, col: 1 }, { row: 6, col: 1 }, { row: 6, col: 2 }],
        color: '#10b981',
      },
      {
        id: 'anc-fluke-r',
        direction: 'up',
        head: { row: 4, col: 5 },
        occupiedCells: [{ row: 4, col: 5 }, { row: 5, col: 5 }, { row: 6, col: 5 }, { row: 6, col: 4 }],
        color: '#10b981',
      },
      {
        id: 'anc-crown',
        direction: 'down',
        head: { row: 6, col: 3 },
        occupiedCells: [{ row: 6, col: 3 }, { row: 5, col: 3 }, { row: 4, col: 3 }],
        color: '#ec4899',
      },
    ],
  },

  // ── Level 37: The Trophy (inspired by Level 10 in Amaze GO!) ─────────────
  {
    id: 37,
    name: 'The Trophy',
    subtitle: 'The golden chalice of champions (inspired by Amaze GO! Lvl 10)',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 9,
    rewardCoins: 1250,
    arrows: [
      {
        id: 'tro-h-l',
        direction: 'up',
        head: { row: 1, col: 0 },
        occupiedCells: [{ row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 3, col: 1 }],
        color: '#f59e0b',
      },
      {
        id: 'tro-h-r',
        direction: 'up',
        head: { row: 1, col: 6 },
        occupiedCells: [{ row: 1, col: 6 }, { row: 2, col: 6 }, { row: 3, col: 6 }, { row: 3, col: 5 }],
        color: '#f59e0b',
      },
      {
        id: 'tro-rim',
        direction: 'left',
        head: { row: 0, col: 2 },
        occupiedCells: [{ row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
        color: '#eab308',
      },
      {
        id: 'tro-flank-l',
        direction: 'left',
        head: { row: 1, col: 2 },
        occupiedCells: [{ row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 }],
        color: '#06b6d4',
      },
      {
        id: 'tro-flank-r',
        direction: 'right',
        head: { row: 1, col: 4 },
        occupiedCells: [{ row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 }],
        color: '#06b6d4',
      },
      {
        id: 'tro-stem',
        direction: 'up',
        head: { row: 1, col: 3 },
        occupiedCells: [{ row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 }],
        color: '#3b82f6',
      },
      {
        id: 'tro-base-top',
        direction: 'left',
        head: { row: 5, col: 2 },
        occupiedCells: [{ row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }],
        color: '#ec4899',
      },
      {
        id: 'tro-base-l',
        direction: 'left',
        head: { row: 6, col: 1 },
        occupiedCells: [{ row: 6, col: 1 }, { row: 6, col: 2 }],
        color: '#10b981',
      },
      {
        id: 'tro-base-r',
        direction: 'right',
        head: { row: 6, col: 5 },
        occupiedCells: [{ row: 6, col: 5 }, { row: 6, col: 4 }, { row: 6, col: 3 }],
        color: '#10b981',
      },
    ],
  },

  // ── Level 38: The Chess Knight (inspired by Arrows - Puzzle Escape) ───────
  {
    id: 38,
    name: 'The Chess Knight',
    subtitle: 'The noble steed of the grandmaster board (inspired by Arrows - Puzzle Escape)',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 8,
    rewardCoins: 1300,
    arrows: [
      {
        id: 'kni-snout',
        direction: 'left',
        head: { row: 1, col: 1 },
        occupiedCells: [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }],
        color: '#06b6d4',
      },
      {
        id: 'kni-ears',
        direction: 'up',
        head: { row: 0, col: 3 },
        occupiedCells: [{ row: 0, col: 3 }, { row: 0, col: 4 }],
        color: '#3b82f6',
      },
      {
        id: 'kni-jaw',
        direction: 'left',
        head: { row: 2, col: 1 },
        occupiedCells: [{ row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 2 }],
        color: '#10b981',
      },
      {
        id: 'kni-mane-top',
        direction: 'up',
        head: { row: 1, col: 4 },
        occupiedCells: [{ row: 1, col: 4 }, { row: 2, col: 4 }, { row: 2, col: 5 }, { row: 3, col: 5 }],
        color: '#f59e0b',
      },
      {
        id: 'kni-neck-back',
        direction: 'right',
        head: { row: 4, col: 5 },
        occupiedCells: [{ row: 4, col: 5 }, { row: 4, col: 4 }, { row: 3, col: 4 }],
        color: '#8b5cf6',
      },
      {
        id: 'kni-chest',
        direction: 'left',
        head: { row: 4, col: 2 },
        occupiedCells: [{ row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 3 }],
        color: '#ec4899',
      },
      {
        id: 'kni-base-mid',
        direction: 'left',
        head: { row: 5, col: 2 },
        occupiedCells: [{ row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }],
        color: '#06b6d4',
      },
      {
        id: 'kni-base-foot',
        direction: 'left',
        head: { row: 6, col: 1 },
        occupiedCells: [
          { row: 6, col: 1 },
          { row: 6, col: 2 },
          { row: 6, col: 3 },
          { row: 6, col: 4 },
          { row: 6, col: 5 },
        ],
        color: '#10b981',
      },
    ],
  },

  // ── Level 39: The Dog (inspired by Level 40 in Amaze GO!) ─────────────────
  {
    id: 39,
    name: 'The Dog',
    subtitle: 'Mans loyal best friend outlined in playful serpents (inspired by Amaze GO! Lvl 40)',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 8,
    rewardCoins: 1350,
    arrows: [
      {
        id: 'dog-tail',
        direction: 'up',
        head: { row: 0, col: 6 },
        occupiedCells: [{ row: 0, col: 6 }, { row: 1, col: 6 }, { row: 2, col: 6 }],
        color: '#f59e0b',
      },
      {
        id: 'dog-ears',
        direction: 'up',
        head: { row: 0, col: 2 },
        occupiedCells: [{ row: 0, col: 2 }, { row: 0, col: 3 }],
        color: '#3b82f6',
      },
      {
        id: 'dog-snout',
        direction: 'left',
        head: { row: 1, col: 0 },
        occupiedCells: [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
        color: '#06b6d4',
      },
      {
        id: 'dog-spine',
        direction: 'right',
        head: { row: 2, col: 5 },
        occupiedCells: [{ row: 2, col: 5 }, { row: 2, col: 4 }, { row: 2, col: 3 }],
        color: '#8b5cf6',
      },
      {
        id: 'dog-chest',
        direction: 'left',
        head: { row: 2, col: 1 },
        occupiedCells: [{ row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 2 }],
        color: '#ec4899',
      },
      {
        id: 'dog-belly',
        direction: 'right',
        head: { row: 3, col: 4 },
        occupiedCells: [{ row: 3, col: 4 }, { row: 3, col: 3 }, { row: 4, col: 3 }],
        color: '#eab308',
      },
      {
        id: 'dog-leg-front',
        direction: 'down',
        head: { row: 6, col: 2 },
        occupiedCells: [{ row: 6, col: 2 }, { row: 5, col: 2 }, { row: 4, col: 2 }],
        color: '#10b981',
      },
      {
        id: 'dog-leg-back',
        direction: 'down',
        head: { row: 6, col: 5 },
        occupiedCells: [{ row: 6, col: 5 }, { row: 5, col: 5 }, { row: 4, col: 5 }],
        color: '#10b981',
      },
    ],
  },

  // ── Level 40: The Heart ───────────────────────────────────────────────────
  {
    id: 40,
    name: 'The Heart',
    subtitle: 'Winding serpentine love knot intertwined without breaks',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 8,
    rewardCoins: 1400,
    arrows: [
      {
        id: 'hrt-lobe-l',
        direction: 'left',
        head: { row: 0, col: 1 },
        occupiedCells: [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 1, col: 1 }],
        color: '#f43f5e',
      },
      {
        id: 'hrt-lobe-r',
        direction: 'right',
        head: { row: 0, col: 5 },
        occupiedCells: [{ row: 0, col: 5 }, { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 1, col: 5 }],
        color: '#f43f5e',
      },
      {
        id: 'hrt-spine',
        direction: 'up',
        head: { row: 1, col: 3 },
        occupiedCells: [{ row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }],
        color: '#ec4899',
      },
      {
        id: 'hrt-flank-l',
        direction: 'left',
        head: { row: 2, col: 0 },
        occupiedCells: [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
        color: '#f43f5e',
      },
      {
        id: 'hrt-flank-r',
        direction: 'right',
        head: { row: 2, col: 6 },
        occupiedCells: [{ row: 2, col: 6 }, { row: 2, col: 5 }, { row: 2, col: 4 }],
        color: '#f43f5e',
      },
      {
        id: 'hrt-sweep-l',
        direction: 'left',
        head: { row: 3, col: 1 },
        occupiedCells: [{ row: 3, col: 1 }, { row: 3, col: 2 }, { row: 4, col: 2 }, { row: 5, col: 2 }],
        color: '#e11d48',
      },
      {
        id: 'hrt-sweep-r',
        direction: 'right',
        head: { row: 3, col: 5 },
        occupiedCells: [{ row: 3, col: 5 }, { row: 3, col: 4 }, { row: 4, col: 4 }, { row: 5, col: 4 }],
        color: '#e11d48',
      },
      {
        id: 'hrt-apex',
        direction: 'down',
        head: { row: 6, col: 3 },
        occupiedCells: [{ row: 6, col: 3 }, { row: 5, col: 3 }, { row: 4, col: 3 }],
        color: '#be123c',
      },
    ],
  },
];

// Complete Handcrafted Campaign Levels (including Master Silhouette levels)
export const DEFAULT_LEVELS: readonly LevelData[] = [...CAMPAIGN_LEVELS, ...SILHOUETTE_LEVELS];


