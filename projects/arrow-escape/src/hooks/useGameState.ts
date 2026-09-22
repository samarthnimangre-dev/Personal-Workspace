// React hook managing game lifecycle, procedural level loading, lives, haptics, and settings
import { useState, useEffect, useCallback, useRef } from 'react';
import type { LevelData } from '../engine/types';
import { GameEngine, type GameEngineState } from '../engine/GameEngine';
import { levelRegistry, TOTAL_CAMPAIGN_LEVELS } from '../engine/LevelRegistry';
import {
  loadProgress,
  recordLevelCompletion,
  loadSettings,
  saveSettings,
  type GameSettings,
} from '../persistence/storage';
import { soundEffects } from '../audio/SoundEffects';
import { haptics } from '../utils/haptics';
import { particleController } from '../utils/particles';

const DEFAULT_LIVES = 3;

export function useGameState(initialLevelId: number = 1) {
  const [progress, setProgress] = useState(loadProgress);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    const loaded = loadProgress();
    return Math.min(Math.max(initialLevelId, loaded.currentLevel), TOTAL_CAMPAIGN_LEVELS);
  });

  const [lives, setLives] = useState<number>(DEFAULT_LIVES);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync sound & haptics managers with stored settings
  useEffect(() => {
    soundEffects.setMuted(settings.soundMuted);
    haptics.setEnabled(settings.hapticsEnabled);
    saveSettings(settings);

    // Apply theme class to document body
    if (typeof document !== 'undefined') {
      if (settings.theme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('theme-dark');
      } else {
        document.documentElement.classList.add('theme-dark');
        document.documentElement.classList.remove('theme-light');
      }
    }
  }, [settings]);

  // Load level configuration from registry
  const currentLevel: LevelData = levelRegistry.getLevel(currentLevelId);

  const [gameState, setGameState] = useState<GameEngineState>(() =>
    GameEngine.createInitialState(currentLevel)
  );

  const activeTimeoutsRef = useRef<number[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
      particleController.clear();
    };
  }, []);

  // Initialize new level
  const loadLevel = useCallback((lvlId: number) => {
    activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    activeTimeoutsRef.current = [];
    particleController.clear();

    const targetLevel = levelRegistry.getLevel(lvlId);
    setCurrentLevelId(targetLevel.id);
    setGameState(GameEngine.createInitialState(targetLevel));
    setLives(DEFAULT_LIVES);
    setIsGameOver(false);
  }, []);

  // Handle arrow tap with animation delays, lives penalties, and audio/haptics
  const handleArrowTap = useCallback(
    (arrowId: string) => {
      if (isGameOver || gameState.status === 'won') return;

      setGameState((prev) => {
        const { nextState, result } = GameEngine.executeTap(prev, arrowId);

        if (result.success) {
          // ESCAPE EVENT
          soundEffects.playEscape();
          haptics.escape();

          const timer = window.setTimeout(() => {
            setGameState((s) => {
              const finalized = GameEngine.finalizeEscape(s, arrowId);
              if (finalized.status === 'won') {
                soundEffects.playWin();
                haptics.win();
                particleController.burstWin(400, 500);
                setProgress((p) => recordLevelCompletion(p, s.level.id, finalized.movesCount));
              }
              return finalized;
            });
          }, 300);
          activeTimeoutsRef.current.push(timer);
        } else if (result.blockerId || !result.success) {
          // BLOCKED COLLISION EVENT
          soundEffects.playBlocked();
          haptics.blocked();

          // Lives deduction in Challenge Mode
          if (!settings.zenMode) {
            setLives((prevLives) => {
              const nextLives = Math.max(0, prevLives - 1);
              if (nextLives === 0) {
                soundEffects.playGameOver();
                haptics.gameOver();
                setIsGameOver(true);
              } else {
                soundEffects.playLifeLost();
                haptics.lifeLost();
              }
              return nextLives;
            });
          }

          // Reset blocked shake state after animation finishes
          const timer = window.setTimeout(() => {
            setGameState((s) => GameEngine.resetBlockedState(s, arrowId));
          }, 360);
          activeTimeoutsRef.current.push(timer);
        }

        return nextState;
      });
    },
    [isGameOver, gameState.status, settings.zenMode]
  );

  const restartCurrentLevel = useCallback(() => {
    soundEffects.playTap();
    haptics.tap();
    loadLevel(currentLevelId);
  }, [currentLevelId, loadLevel]);

  const advanceToNextLevel = useCallback(() => {
    soundEffects.playTap();
    haptics.tap();
    const nextId = currentLevelId < TOTAL_CAMPAIGN_LEVELS ? currentLevelId + 1 : 1;
    loadLevel(nextId);
  }, [currentLevelId, loadLevel]);

  const continueInZenMode = useCallback(() => {
    soundEffects.playTap();
    haptics.tap();
    setSettings((s) => ({ ...s, zenMode: true }));
    setLives(DEFAULT_LIVES);
    setIsGameOver(false);
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((s) => {
      const next = !s.soundMuted;
      soundEffects.setMuted(next);
      return { ...s, soundMuted: next };
    });
  }, []);

  const toggleHaptics = useCallback(() => {
    setSettings((s) => {
      const next = !s.hapticsEnabled;
      haptics.setEnabled(next);
      if (next) haptics.tap();
      return { ...s, hapticsEnabled: next };
    });
  }, []);

  const toggleTheme = useCallback(() => {
    soundEffects.playTap();
    haptics.tap();
    setSettings((s) => ({
      ...s,
      theme: s.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const toggleZenMode = useCallback(() => {
    soundEffects.playTap();
    haptics.tap();
    setSettings((s) => ({
      ...s,
      zenMode: !s.zenMode,
    }));
    setLives(DEFAULT_LIVES);
    setIsGameOver(false);
  }, []);

  return {
    gameState,
    progress,
    settings,
    currentLevelId,
    lives,
    maxLives: DEFAULT_LIVES,
    isGameOver,
    isSettingsOpen,
    allLevels: levelRegistry.getLevelMetadataList(),
    setIsSettingsOpen,
    handleArrowTap,
    restartCurrentLevel,
    advanceToNextLevel,
    selectLevel: loadLevel,
    continueInZenMode,
    toggleSound,
    toggleHaptics,
    toggleTheme,
    toggleZenMode,
  };
}
