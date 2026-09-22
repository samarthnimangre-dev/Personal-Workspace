// Level Registry providing campaign levels across four escalating difficulty tiers
import type { LevelData } from './types';
import { LevelGenerator, type Difficulty } from './LevelGenerator';
import { DEFAULT_LEVELS } from './BoardModel';

export const TOTAL_CAMPAIGN_LEVELS = 50;

export function getDifficultyForLevel(levelId: number): Difficulty {
  if (levelId <= 8) return 'easy';
  if (levelId <= 20) return 'medium';
  if (levelId <= 35) return 'hard';
  return 'expert';
}

class LevelRegistryService {
  private levelCache = new Map<number, LevelData>();

  constructor() {
    // Seed with existing crafted levels
    for (const lvl of DEFAULT_LEVELS) {
      this.levelCache.set(lvl.id, lvl);
    }
  }

  public getLevel(levelId: number): LevelData {
    if (this.levelCache.has(levelId)) {
      return this.levelCache.get(levelId)!;
    }

    const difficulty = getDifficultyForLevel(levelId);
    const generated = LevelGenerator.generateLevel({
      levelNumber: levelId,
      seed: `campaign-tier-${levelId}`,
      difficulty,
    });

    this.levelCache.set(levelId, generated);
    return generated;
  }

  public getLevelMetadataList(): { id: number; name: string; difficulty: Difficulty }[] {
    const list = [];
    for (let id = 1; id <= TOTAL_CAMPAIGN_LEVELS; id++) {
      list.push({
        id,
        name: `Level ${id}`,
        difficulty: getDifficultyForLevel(id),
      });
    }
    return list;
  }
}

export const levelRegistry = new LevelRegistryService();
