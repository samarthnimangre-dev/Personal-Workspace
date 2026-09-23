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
  const gameStateRef = useRef<GameEngineState>(gameState);
  const isWinningPendingRef = useRef<boolean>(false);
  const livesRef = useRef<number>(DEFAULT_LIVES);
  const isGameOverRef = useRef<boolean>(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
    isWinningPendingRef.current = false;
    isGameOverRef.current = false;
    livesRef.current = DEFAULT_LIVES;

    const targetLevel = levelRegistry.getLevel(lvlId);
    setCurrentLevelId(targetLevel.id);
    const initial = GameEngine.createInitialState(targetLevel);
    gameStateRef.current = initial;
    setGameState(initial);
    setLives(DEFAULT_LIVES);
    setIsGameOver(false);
  }, []);

  // Handle arrow tap with animation delays, lives penalties, and audio/haptics
  const handleArrowTap = useCallback(
    (arrowId: string) => {
      if (
        isGameOver ||
        isGameOverRef.current ||
        gameStateRef.current.status === 'won' ||
        isWinningPendingRef.current
      ) {
        return;
      }

      const currentState = gameStateRef.current;
      const arrow = currentState.arrows.get(arrowId);
      if (!arrow || !arrow.isIdle) {
        return;
      }

      const { nextState, result } = GameEngine.executeTap(currentState, arrowId);

      if (!result.success && !result.blockerId) {
        return;
      }

      // Guard winning sequence so subsequent taps cannot trigger collisions or Game Over
      if (result.success) {
        const remainingActive = Array.from(nextState.arrows.values()).filter(
          (a) => !a.isEscaped && !a.isEscaping
        ).length;
        if (remainingActive === 0) {
          isWinningPendingRef.current = true;
        }
      }

      // Update game state immediately
      gameStateRef.current = nextState;
      setGameState(nextState);

      // Execute side effects cleanly outside React state updaters
      if (result.success) {
        // ESCAPE EVENT
        soundEffects.playEscape();
        haptics.escape();

        // Directional escape particle burst at head position
        const cellSize = 72;
        const padding = 18;
        const headX = arrow.head.col * cellSize + cellSize / 2 + padding;
        const headY = arrow.head.row * cellSize + cellSize / 2 + padding;
        particleController.burstEscape(headX, headY, arrow.color, arrow.angle);

        const timer = window.setTimeout(() => {
          activeTimeoutsRef.current = activeTimeoutsRef.current.filter((t) => t !== timer);
          const current = gameStateRef.current;
          const finalized = GameEngine.finalizeEscape(current, arrowId);
          gameStateRef.current = finalized;
          setGameState(finalized);

          if (finalized.status === 'won') {
            isWinningPendingRef.current = false;
            soundEffects.playWin();
            haptics.win();
            const boardW = current.board.cols * cellSize + padding * 2;
            const boardH = current.board.rows * cellSize + padding * 2;
            particleController.burstWin(boardW, boardH);
            setProgress((p) => recordLevelCompletion(p, current.level.id, finalized.movesCount));
          }
        }, 320);
        activeTimeoutsRef.current.push(timer);
      } else if (result.blockerId) {
        // BLOCKED COLLISION EVENT
        soundEffects.playBlocked();
        haptics.blocked();

        // Lives deduction in Challenge Mode
        if (!settings.zenMode) {
          if (livesRef.current > 0) {
            const nextLives = Math.max(0, livesRef.current - 1);
            livesRef.current = nextLives;
            setLives(nextLives);

            if (nextLives === 0) {
              isGameOverRef.current = true;
              setIsGameOver(true);
              soundEffects.playGameOver();
              haptics.gameOver();
            } else {
              soundEffects.playLifeLost();
              haptics.lifeLost();
            }
          }
        }

        // Reset blocked recoil shake state after 320ms animation finishes
        const timer = window.setTimeout(() => {
          activeTimeoutsRef.current = activeTimeoutsRef.current.filter((t) => t !== timer);
          const current = gameStateRef.current;
          const resetState = GameEngine.resetBlockedState(current, arrowId);
          gameStateRef.current = resetState;
          setGameState(resetState);
        }, 320);
        activeTimeoutsRef.current.push(timer);
      }
    },
    [isGameOver, settings.zenMode]
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
    livesRef.current = DEFAULT_LIVES;
    isGameOverRef.current = false;
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
    livesRef.current = DEFAULT_LIVES;
    isGameOverRef.current = false;
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
