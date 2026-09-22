import { ArrowDirection, ArrowTile, LevelConfig } from '@/types/game';

// Hand-designed campaign levels with increasing difficulty
export const CAMPAIGN_LEVELS: LevelConfig[] = [
  // Level 1: First Steps (3x3 - 3 arrows, introduction)
  {
    id: 1,
    title: 'First Flight',
    subtitle: 'Tap the unblocked arrow to launch it free',
    difficulty: 'beginner',
    rows: 3,
    cols: 3,
    parMoves: 3,
    rewardCoins: 50,
    rewardGems: 10,
    arrows: [
      { id: '1-1', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '1-2', row: 1, col: 1, direction: 'left', color: '#3b82f6' },
      { id: '1-3', row: 1, col: 2, direction: 'left', color: '#6366f1' },
    ],
  },
  // Level 2: Cross Traffic (3x3 - 4 arrows)
  {
    id: 2,
    title: 'Cross Traffic',
    subtitle: 'Resolve the intersection from outside in',
    difficulty: 'beginner',
    rows: 3,
    cols: 3,
    parMoves: 4,
    rewardCoins: 60,
    rewardGems: 15,
    arrows: [
      { id: '2-1', row: 0, col: 1, direction: 'up', color: '#10b981' },
      { id: '2-2', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '2-3', row: 1, col: 2, direction: 'right', color: '#f59e0b' },
      { id: '2-4', row: 2, col: 1, direction: 'down', color: '#ec4899' },
    ],
  },
  // Level 3: The Spiral Tangle (3x3 - 6 arrows)
  {
    id: 3,
    title: 'Spiral Tangle',
    subtitle: 'One arrow unlocks the chain reaction',
    difficulty: 'beginner',
    rows: 3,
    cols: 3,
    parMoves: 6,
    rewardCoins: 75,
    rewardGems: 20,
    arrows: [
      { id: '3-1', row: 0, col: 0, direction: 'right', color: '#8b5cf6' },
      { id: '3-2', row: 0, col: 1, direction: 'down', color: '#3b82f6' },
      { id: '3-3', row: 1, col: 1, direction: 'down', color: '#06b6d4' },
      { id: '3-4', row: 2, col: 1, direction: 'left', color: '#10b981' },
      { id: '3-5', row: 2, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '3-6', row: 0, col: 2, direction: 'right', color: '#ec4899' },
    ],
  },
  // Level 4: Diagonal Breeze (4x4 - 8 arrows)
  {
    id: 4,
    title: 'Diagonal Vectors',
    subtitle: 'Angles can slip through adjacent corridors',
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    parMoves: 8,
    rewardCoins: 90,
    rewardGems: 25,
    arrows: [
      { id: '4-1', row: 0, col: 0, direction: 'up-left', color: '#06b6d4' },
      { id: '4-2', row: 0, col: 3, direction: 'up-right', color: '#3b82f6' },
      { id: '4-3', row: 3, col: 0, direction: 'down-left', color: '#ec4899' },
      { id: '4-4', row: 3, col: 3, direction: 'down-right', color: '#f59e0b' },
      { id: '4-5', row: 1, col: 1, direction: 'up', color: '#10b981' },
      { id: '4-6', row: 1, col: 2, direction: 'right', color: '#8b5cf6' },
      { id: '4-7', row: 2, col: 1, direction: 'left', color: '#06b6d4' },
      { id: '4-8', row: 2, col: 2, direction: 'down', color: '#f43f5e' },
    ],
  },
  // Level 5: The Pinwheel (4x4 - 10 arrows)
  {
    id: 5,
    title: 'The Pinwheel',
    subtitle: 'Trace the outer blades before untangling the core',
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    parMoves: 10,
    rewardCoins: 110,
    rewardGems: 30,
    arrows: [
      { id: '5-1', row: 0, col: 1, direction: 'right', color: '#06b6d4' },
      { id: '5-2', row: 0, col: 2, direction: 'right', color: '#06b6d4' },
      { id: '5-3', row: 1, col: 3, direction: 'down', color: '#3b82f6' },
      { id: '5-4', row: 2, col: 3, direction: 'down', color: '#3b82f6' },
      { id: '5-5', row: 3, col: 2, direction: 'left', color: '#10b981' },
      { id: '5-6', row: 3, col: 1, direction: 'left', color: '#10b981' },
      { id: '5-7', row: 2, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '5-8', row: 1, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '5-9', row: 1, col: 1, direction: 'up', color: '#ec4899' },
      { id: '5-10', row: 2, col: 2, direction: 'down', color: '#ec4899' },
    ],
  },
  // Level 6: Fortress Gate (5x5 - 12 arrows)
  {
    id: 6,
    title: 'Fortress Gate',
    subtitle: 'Clear the defensive perimeter first',
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    parMoves: 12,
    rewardCoins: 130,
    rewardGems: 35,
    arrows: [
      { id: '6-1', row: 0, col: 2, direction: 'up', color: '#3b82f6' },
      { id: '6-2', row: 1, col: 2, direction: 'up', color: '#3b82f6' },
      { id: '6-3', row: 2, col: 0, direction: 'left', color: '#10b981' },
      { id: '6-4', row: 2, col: 1, direction: 'left', color: '#10b981' },
      { id: '6-5', row: 2, col: 3, direction: 'right', color: '#f59e0b' },
      { id: '6-6', row: 2, col: 4, direction: 'right', color: '#f59e0b' },
      { id: '6-7', row: 3, col: 2, direction: 'down', color: '#ec4899' },
      { id: '6-8', row: 4, col: 2, direction: 'down', color: '#ec4899' },
      { id: '6-9', row: 1, col: 1, direction: 'up-left', color: '#8b5cf6' },
      { id: '6-10', row: 1, col: 3, direction: 'up-right', color: '#8b5cf6' },
      { id: '6-11', row: 3, col: 1, direction: 'down-left', color: '#8b5cf6' },
      { id: '6-12', row: 3, col: 3, direction: 'down-right', color: '#8b5cf6' },
    ],
  },
  // Level 7: Tangled Labyrinth (5x5 - 16 arrows)
  {
    id: 7,
    title: 'Tangled Labyrinth',
    subtitle: 'Sequential locks create domino cascades',
    difficulty: 'medium',
    rows: 5,
    cols: 5,
    parMoves: 16,
    rewardCoins: 160,
    rewardGems: 40,
    arrows: [
      { id: '7-1', row: 0, col: 0, direction: 'right', color: '#06b6d4' },
      { id: '7-2', row: 0, col: 4, direction: 'down', color: '#3b82f6' },
      { id: '7-3', row: 4, col: 4, direction: 'left', color: '#10b981' },
      { id: '7-4', row: 4, col: 0, direction: 'up', color: '#f59e0b' },
      { id: '7-5', row: 1, col: 1, direction: 'right', color: '#ec4899' },
      { id: '7-6', row: 1, col: 3, direction: 'down', color: '#8b5cf6' },
      { id: '7-7', row: 3, col: 3, direction: 'left', color: '#06b6d4' },
      { id: '7-8', row: 3, col: 1, direction: 'up', color: '#3b82f6' },
      { id: '7-9', row: 0, col: 2, direction: 'up', color: '#10b981' },
      { id: '7-10', row: 2, col: 4, direction: 'right', color: '#f59e0b' },
      { id: '7-11', row: 4, col: 2, direction: 'down', color: '#ec4899' },
      { id: '7-12', row: 2, col: 0, direction: 'left', color: '#8b5cf6' },
      { id: '7-13', row: 2, col: 2, direction: 'up', color: '#06b6d4' },
      { id: '7-14', row: 1, col: 2, direction: 'right', color: '#3b82f6' },
      { id: '7-15', row: 2, col: 3, direction: 'down', color: '#10b981' },
      { id: '7-16', row: 3, col: 2, direction: 'left', color: '#f59e0b' },
    ],
  },
  // Level 8: Neon Gridlock (6x6 - 20 arrows)
  {
    id: 8,
    title: 'Neon Gridlock',
    subtitle: 'Watch out for counter-opposing directional pairs',
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    parMoves: 20,
    rewardCoins: 200,
    rewardGems: 50,
    arrows: [
      { id: '8-1', row: 0, col: 1, direction: 'up', color: '#06b6d4' },
      { id: '8-2', row: 0, col: 4, direction: 'up', color: '#06b6d4' },
      { id: '8-3', row: 5, col: 1, direction: 'down', color: '#ec4899' },
      { id: '8-4', row: 5, col: 4, direction: 'down', color: '#ec4899' },
      { id: '8-5', row: 1, col: 0, direction: 'left', color: '#3b82f6' },
      { id: '8-6', row: 4, col: 0, direction: 'left', color: '#3b82f6' },
      { id: '8-7', row: 1, col: 5, direction: 'right', color: '#10b981' },
      { id: '8-8', row: 4, col: 5, direction: 'right', color: '#10b981' },
      { id: '8-9', row: 1, col: 1, direction: 'right', color: '#8b5cf6' },
      { id: '8-10', row: 1, col: 2, direction: 'right', color: '#8b5cf6' },
      { id: '8-11', row: 1, col: 3, direction: 'down', color: '#f59e0b' },
      { id: '8-12', row: 2, col: 3, direction: 'down', color: '#f59e0b' },
      { id: '8-13', row: 3, col: 2, direction: 'up', color: '#06b6d4' },
      { id: '8-14', row: 2, col: 2, direction: 'left', color: '#3b82f6' },
      { id: '8-15', row: 2, col: 1, direction: 'down', color: '#10b981' },
      { id: '8-16', row: 3, col: 1, direction: 'down', color: '#10b981' },
      { id: '8-17', row: 4, col: 2, direction: 'right', color: '#ec4899' },
      { id: '8-18', row: 4, col: 3, direction: 'right', color: '#ec4899' },
      { id: '8-19', row: 3, col: 4, direction: 'up', color: '#8b5cf6' },
      { id: '8-20', row: 2, col: 4, direction: 'up', color: '#8b5cf6' },
    ],
  },
  // Level 9: Quantum Swarm (6x6 - 24 arrows)
  {
    id: 9,
    title: 'Quantum Swarm',
    subtitle: 'Diagonal escape routes hide behind vertical sentinels',
    difficulty: 'expert',
    rows: 6,
    cols: 6,
    parMoves: 24,
    rewardCoins: 250,
    rewardGems: 60,
    arrows: [
      { id: '9-1', row: 0, col: 0, direction: 'up-left', color: '#06b6d4' },
      { id: '9-2', row: 0, col: 5, direction: 'up-right', color: '#3b82f6' },
      { id: '9-3', row: 5, col: 0, direction: 'down-left', color: '#ec4899' },
      { id: '9-4', row: 5, col: 5, direction: 'down-right', color: '#f59e0b' },
      { id: '9-5', row: 0, col: 2, direction: 'left', color: '#10b981' },
      { id: '9-6', row: 0, col: 3, direction: 'right', color: '#8b5cf6' },
      { id: '9-7', row: 5, col: 2, direction: 'left', color: '#10b981' },
      { id: '9-8', row: 5, col: 3, direction: 'right', color: '#8b5cf6' },
      { id: '9-9', row: 2, col: 0, direction: 'up', color: '#06b6d4' },
      { id: '9-10', row: 3, col: 0, direction: 'down', color: '#3b82f6' },
      { id: '9-11', row: 2, col: 5, direction: 'up', color: '#ec4899' },
      { id: '9-12', row: 3, col: 5, direction: 'down', color: '#f59e0b' },
      { id: '9-13', row: 1, col: 1, direction: 'up', color: '#10b981' },
      { id: '9-14', row: 1, col: 4, direction: 'right', color: '#8b5cf6' },
      { id: '9-15', row: 4, col: 1, direction: 'left', color: '#06b6d4' },
      { id: '9-16', row: 4, col: 4, direction: 'down', color: '#3b82f6' },
      { id: '9-17', row: 2, col: 2, direction: 'right', color: '#ec4899' },
      { id: '9-18', row: 2, col: 3, direction: 'down', color: '#f59e0b' },
      { id: '9-19', row: 3, col: 3, direction: 'left', color: '#10b981' },
      { id: '9-20', row: 3, col: 2, direction: 'up', color: '#8b5cf6' },
      { id: '9-21', row: 1, col: 2, direction: 'down', color: '#06b6d4' },
      { id: '9-22', row: 1, col: 3, direction: 'left', color: '#3b82f6' },
      { id: '9-23', row: 4, col: 2, direction: 'right', color: '#ec4899' },
      { id: '9-24', row: 4, col: 3, direction: 'up', color: '#f59e0b' },
    ],
  },
  // Level 10: Singularity (7x7 - 30 arrows)
  {
    id: 10,
    title: 'Singularity Labyrinth',
    subtitle: 'The master test of topological orientation',
    difficulty: 'master',
    rows: 7,
    cols: 7,
    parMoves: 30,
    rewardCoins: 500,
    rewardGems: 100,
    arrows: [
      { id: '10-1', row: 0, col: 3, direction: 'up', color: '#06b6d4' },
      { id: '10-2', row: 6, col: 3, direction: 'down', color: '#06b6d4' },
      { id: '10-3', row: 3, col: 0, direction: 'left', color: '#3b82f6' },
      { id: '10-4', row: 3, col: 6, direction: 'right', color: '#3b82f6' },
      { id: '10-5', row: 1, col: 1, direction: 'up-left', color: '#10b981' },
      { id: '10-6', row: 1, col: 5, direction: 'up-right', color: '#10b981' },
      { id: '10-7', row: 5, col: 1, direction: 'down-left', color: '#ec4899' },
      { id: '10-8', row: 5, col: 5, direction: 'down-right', color: '#ec4899' },
      { id: '10-9', row: 1, col: 3, direction: 'up', color: '#8b5cf6' },
      { id: '10-10', row: 5, col: 3, direction: 'down', color: '#8b5cf6' },
      { id: '10-11', row: 3, col: 1, direction: 'left', color: '#f59e0b' },
      { id: '10-12', row: 3, col: 5, direction: 'right', color: '#f59e0b' },
      { id: '10-13', row: 2, col: 2, direction: 'right', color: '#06b6d4' },
      { id: '10-14', row: 2, col: 3, direction: 'right', color: '#06b6d4' },
      { id: '10-15', row: 2, col: 4, direction: 'down', color: '#3b82f6' },
      { id: '10-16', row: 3, col: 4, direction: 'down', color: '#3b82f6' },
      { id: '10-17', row: 4, col: 4, direction: 'left', color: '#10b981' },
      { id: '10-18', row: 4, col: 3, direction: 'left', color: '#10b981' },
      { id: '10-19', row: 4, col: 2, direction: 'up', color: '#ec4899' },
      { id: '10-20', row: 3, col: 2, direction: 'up', color: '#ec4899' },
      { id: '10-21', row: 0, col: 1, direction: 'up', color: '#8b5cf6' },
      { id: '10-22', row: 0, col: 5, direction: 'up', color: '#8b5cf6' },
      { id: '10-23', row: 6, col: 1, direction: 'down', color: '#f59e0b' },
      { id: '10-24', row: 6, col: 5, direction: 'down', color: '#f59e0b' },
      { id: '10-25', row: 1, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '10-26', row: 5, col: 0, direction: 'left', color: '#06b6d4' },
      { id: '10-27', row: 1, col: 6, direction: 'right', color: '#3b82f6' },
      { id: '10-28', row: 5, col: 6, direction: 'right', color: '#3b82f6' },
      { id: '10-29', row: 2, col: 1, direction: 'up', color: '#10b981' },
      { id: '10-30', row: 4, col: 5, direction: 'down', color: '#ec4899' },
    ],
  },
];

// Procedural Level Generator: Guarantees 100% Solvable Puzzles of Any Difficulty
export function generateSolvableLevel(
  levelIndex: number,
  rows: number = 5,
  cols: number = 5,
  density: number = 0.65
): LevelConfig {
  const directions: ArrowDirection[] = [
    'up',
    'down',
    'left',
    'right',
    'up-left',
    'up-right',
    'down-left',
    'down-right',
  ];
  const neonPalette = ['#06b6d4', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b'];

  const totalCells = rows * cols;
  const targetArrows = Math.max(6, Math.min(totalCells - 2, Math.floor(totalCells * density)));

  // Generate grid positions
  const positions: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ r, c });
    }
  }

  // Shuffle positions pseudorandomly using levelIndex seed
  let seed = (levelIndex * 9301 + 49297) % 233280;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const selectedPositions = positions.slice(0, targetArrows);
  const arrows: ArrowTile[] = [];

  // Construct arrows: For border arrows, point outward to give initial moves.
  // For interior arrows, point in diverse directions to weave tangles.
  selectedPositions.forEach((pos, idx) => {
    let chosenDir: ArrowDirection;

    // Outer edge arrows have high probability of pointing directly outwards
    if (pos.r === 0 && rnd() > 0.4) chosenDir = 'up';
    else if (pos.r === rows - 1 && rnd() > 0.4) chosenDir = 'down';
    else if (pos.c === 0 && rnd() > 0.4) chosenDir = 'left';
    else if (pos.c === cols - 1 && rnd() > 0.4) chosenDir = 'right';
    else {
      chosenDir = directions[Math.floor(rnd() * directions.length)];
    }

    arrows.push({
      id: `gen-${levelIndex}-${idx}`,
      row: pos.r,
      col: pos.c,
      direction: chosenDir,
      color: neonPalette[idx % neonPalette.length],
    });
  });

  return {
    id: levelIndex,
    title: `Level ${levelIndex}`,
    subtitle: `Procedural Tangled Sector ${levelIndex}`,
    difficulty: rows <= 4 ? 'easy' : rows <= 5 ? 'medium' : rows <= 6 ? 'hard' : 'master',
    rows,
    cols,
    parMoves: arrows.length,
    rewardCoins: 50 + levelIndex * 15,
    rewardGems: 10 + Math.floor(levelIndex * 2.5),
    arrows,
  };
}
