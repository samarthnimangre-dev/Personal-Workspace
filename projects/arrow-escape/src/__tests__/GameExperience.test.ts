import { describe, it, expect, beforeEach } from 'vitest';
import { soundEffects } from '../audio/SoundEffects';
import { haptics } from '../utils/haptics';
import { loadSettings, saveSettings, loadProgress, recordLevelCompletion } from '../persistence/storage';
import { levelRegistry, getDifficultyForLevel, TOTAL_CAMPAIGN_LEVELS } from '../engine/LevelRegistry';
import { ArrowEscapeSolver } from '../engine/ArrowEscapeSolver';

describe('Complete Game Experience Integration Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('SoundEffects & Haptics Control', () => {
    it('manages sound mute toggle and persistence correctly', () => {
      soundEffects.setMuted(false);
      expect(soundEffects.getMuted()).toBe(false);

      const toggled = soundEffects.toggleMute();
      expect(toggled).toBe(true);
      expect(soundEffects.getMuted()).toBe(true);

      soundEffects.setMuted(false);
      expect(soundEffects.getMuted()).toBe(false);
    });

    it('handles sound synthesis calls without throwing errors when audio context is unavailable or muted', () => {
      soundEffects.setMuted(true);
      expect(() => soundEffects.playTap()).not.toThrow();
      expect(() => soundEffects.playEscape()).not.toThrow();
      expect(() => soundEffects.playBlocked()).not.toThrow();
      expect(() => soundEffects.playLifeLost()).not.toThrow();
      expect(() => soundEffects.playWin()).not.toThrow();
      expect(() => soundEffects.playGameOver()).not.toThrow();
    });

    it('manages haptic enablement and executes patterns safely', () => {
      haptics.setEnabled(true);
      expect(haptics.isEnabled()).toBe(true);

      const toggled = haptics.toggle();
      expect(toggled).toBe(false);
      expect(haptics.isEnabled()).toBe(false);

      expect(() => {
        haptics.tap();
        haptics.escape();
        haptics.blocked();
        haptics.lifeLost();
        haptics.win();
        haptics.gameOver();
      }).not.toThrow();
    });
  });

  describe('Settings & Campaign Persistence', () => {
    it('saves and loads game settings with dark/light themes and zen mode', () => {
      const initial = loadSettings();
      expect(initial.theme).toBe('dark');
      expect(initial.zenMode).toBe(false);

      saveSettings({
        soundMuted: true,
        hapticsEnabled: false,
        theme: 'light',
        zenMode: true,
      });

      const loaded = loadSettings();
      expect(loaded.soundMuted).toBe(true);
      expect(loaded.hapticsEnabled).toBe(false);
      expect(loaded.theme).toBe('light');
      expect(loaded.zenMode).toBe(true);
    });

    it('records level completion and tracks personal best moves', () => {
      let progress = loadProgress();
      expect(progress.currentLevel).toBe(1);
      expect(progress.completedLevels).toHaveLength(0);

      // Complete level 1 in 8 moves
      progress = recordLevelCompletion(progress, 1, 8);
      expect(progress.currentLevel).toBe(2);
      expect(progress.completedLevels).toContain(1);
      expect(progress.bestMoves[1]).toBe(8);

      // Replay level 1 in 6 moves (improved)
      progress = recordLevelCompletion(progress, 1, 6);
      expect(progress.bestMoves[1]).toBe(6);

      // Replay level 1 in 10 moves (should preserve best 6)
      progress = recordLevelCompletion(progress, 1, 10);
      expect(progress.bestMoves[1]).toBe(6);
    });
  });

  describe('Campaign Level Progression & Scalability', () => {
    it('provides 50 escalating campaign levels across all 4 tiers', () => {
      const list = levelRegistry.getLevelMetadataList();
      expect(list).toHaveLength(TOTAL_CAMPAIGN_LEVELS);

      expect(getDifficultyForLevel(1)).toBe('easy');
      expect(getDifficultyForLevel(8)).toBe('easy');
      expect(getDifficultyForLevel(15)).toBe('medium');
      expect(getDifficultyForLevel(25)).toBe('hard');
      expect(getDifficultyForLevel(45)).toBe('expert');
    });

    it('verifies campaign levels fetched from registry are structurally valid and solvable', () => {
      // Test key milestone levels across difficulty boundaries
      const milestoneLevels = [1, 5, 10, 20, 30];

      for (const lvlId of milestoneLevels) {
        const level = levelRegistry.getLevel(lvlId);
        expect(level.id).toBe(lvlId);
        expect(level.arrows.length).toBeGreaterThan(0);
        expect(level.rows).toBeGreaterThanOrEqual(3);
        expect(level.cols).toBeGreaterThanOrEqual(3);

        const solverResult = ArrowEscapeSolver.solve(level);
        expect(solverResult.solvable).toBe(true);
        expect(solverResult.solutionMoves).toBeDefined();
      }
    });
  });
});
