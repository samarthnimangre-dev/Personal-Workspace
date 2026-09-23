// React hook managing game lifecycle, procedural level loading, lives, haptics, boosters, and settings
import { useState, useEffect, useCallback, useRef } from 'react';
import type { LevelData, BoosterType } from '../engine/types';
import { GameEngine, type GameEngineState } from '../engine/GameEngine';
import { ArrowEscapeSolver } from '../engine/ArrowEscapeSolver';
import { ArrowModel } from '../engine/ArrowModel';
import { OccupancyMap } from '../engine/OccupancyMap';
import { levelRegistry, TOTAL_CAMPAIGN_LEVELS } from '../engine/LevelRegistry';
import {
  loadProgress,
  recordLevelCompletion,
  loadSettings,
  saveSettings,
  saveProgress,
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
  const [isHammerActive, setIsHammerActive] = useState<boolean>(false);
  const [isBombActive, setIsBombActive] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [canClaimDailyReward, setCanClaimDailyReward] = useState<boolean>(true);

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
  const historyStackRef = useRef<{ state: GameEngineState; lives: number }[]>([]);

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

  // Snapshot helper to ensure undo stack only saves sanitized, non-transient arrow states
  const saveHistorySnapshot = useCallback((state: GameEngineState, currentLives: number) => {
    const cleanArrows = new Map<string, ArrowModel>();
    for (const [id, a] of state.arrows.entries()) {
      if (a.isEscaping) {
        cleanArrows.set(id, a.withState('escaped'));
      } else if (a.isBlocked) {
        cleanArrows.set(id, a.withState('idle'));
      } else {
        cleanArrows.set(id, a.withHinted(false));
      }
    }
    const cleanOccupancy = new OccupancyMap(Array.from(cleanArrows.values()));
    const cleanState: GameEngineState = {
      ...state,
      arrows: cleanArrows,
      occupancy: cleanOccupancy,
    };
    historyStackRef.current.push({
      state: cleanState,
      lives: currentLives,
    });
    if (historyStackRef.current.length > 15) {
      historyStackRef.current.shift();
    }
  }, []);

  // Initialize new level
  const loadLevel = useCallback((lvlId: number) => {
    activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    activeTimeoutsRef.current = [];
    particleController.clear();
    isWinningPendingRef.current = false;
    isGameOverRef.current = false;
    livesRef.current = DEFAULT_LIVES;
    historyStackRef.current = [];
    setIsHammerActive(false);
    setIsBombActive(false);

    const targetLevel = levelRegistry.getLevel(lvlId);
    setCurrentLevelId(targetLevel.id);
    const initial = GameEngine.createInitialState(targetLevel);
    gameStateRef.current = initial;
    setGameState(initial);
    setLives(DEFAULT_LIVES);
    setIsGameOver(false);
  }, []);

  // Handle arrow tap with animation delays, lives penalties, audio/haptics, and booster modes
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

      let currentState = gameStateRef.current;
      const arrow = currentState.arrows.get(arrowId);
      if (!arrow || arrow.isEscaped || arrow.isEscaping) {
        return;
      }

      // ── HAMMER BOOSTER EXECUTION ──────────────────────────────────────────
      if (isHammerActive) {
        saveHistorySnapshot(currentState, livesRef.current);
        setIsHammerActive(false);
        soundEffects.playIceShatter();
        haptics.win();

        const cellSize = 72;
        const padding = 18;
        const headX = arrow.head.col * cellSize + cellSize / 2 + padding;
        const headY = arrow.head.row * cellSize + cellSize / 2 + padding;
        particleController.burstEscape(headX, headY, '#f43f5e', 0);

        const { nextState } = GameEngine.executeHammer(currentState, arrowId);
        gameStateRef.current = nextState;
        setGameState(nextState);

        // Deduct hammer from inventory
        setProgress((p) => {
          const nextInv = {
            hint: p.inventory?.hint ?? 3,
            hammer: Math.max(0, (p.inventory?.hammer ?? 2) - 1),
            bomb: p.inventory?.bomb ?? 2,
            undo: p.inventory?.undo ?? 3,
          };
          const updated = { ...p, inventory: nextInv };
          saveProgress(updated);
          return updated;
        });

        if (nextState.status === 'won') {
          soundEffects.playWin();
          haptics.win();
          const boardW = currentState.board.cols * cellSize + padding * 2;
          const boardH = currentState.board.rows * cellSize + padding * 2;
          particleController.burstWin(boardW, boardH);
          const starsEarned =
            nextState.movesCount <= currentState.level.parMoves
              ? 3
              : nextState.movesCount <= currentState.level.parMoves + 2
              ? 2
              : 1;
          const reward = currentState.level.rewardCoins ?? 50 + starsEarned * 25;
          setProgress((p) =>
            recordLevelCompletion(p, currentState.level.id, nextState.movesCount, starsEarned, reward)
          );
        }
        return;
      }

      // ── BOMB BOOSTER EXECUTION ────────────────────────────────────────────
      if (isBombActive) {
        saveHistorySnapshot(currentState, livesRef.current);
        setIsBombActive(false);
        soundEffects.playBombExplode();
        haptics.gameOver();

        const cellSize = 72;
        const padding = 18;
        const headX = arrow.head.col * cellSize + cellSize / 2 + padding;
        const headY = arrow.head.row * cellSize + cellSize / 2 + padding;
        particleController.burstEscape(headX, headY, '#f43f5e', 0);
        particleController.burstWin(currentState.board.cols * cellSize, currentState.board.rows * cellSize);

        const { nextState } = GameEngine.executeBomb(currentState, arrowId);
        gameStateRef.current = nextState;
        setGameState(nextState);

        // Deduct bomb from inventory
        setProgress((p) => {
          const nextInv = {
            hint: p.inventory?.hint ?? 3,
            hammer: p.inventory?.hammer ?? 2,
            bomb: Math.max(0, (p.inventory?.bomb ?? 2) - 1),
            undo: p.inventory?.undo ?? 3,
          };
          const updated = { ...p, inventory: nextInv };
          saveProgress(updated);
          return updated;
        });

        if (nextState.status === 'won') {
          soundEffects.playWin();
          haptics.win();
          const boardW = currentState.board.cols * cellSize + padding * 2;
          const boardH = currentState.board.rows * cellSize + padding * 2;
          particleController.burstWin(boardW, boardH);
          const starsEarned =
            nextState.movesCount <= currentState.level.parMoves
              ? 3
              : nextState.movesCount <= currentState.level.parMoves + 2
              ? 2
              : 1;
          const reward = currentState.level.rewardCoins ?? 50 + starsEarned * 25;
          setProgress((p) =>
            recordLevelCompletion(p, currentState.level.id, nextState.movesCount, starsEarned, reward)
          );
        }
        return;
      }

      if (!arrow.isIdle && !arrow.isFrozen) {
        return;
      }

      // Clear any active hint aura on move tap
      currentState = GameEngine.clearHint(currentState);

      // Record state in history before performing move
      saveHistorySnapshot(currentState, livesRef.current);

      const { nextState, result } = GameEngine.executeTap(currentState, arrowId);

      // Handle specific obstacle action types:
      if (result.actionType === 'iceCrack') {
        soundEffects.playIceCrack();
        haptics.tap();
        gameStateRef.current = nextState;
        setGameState(nextState);
        return;
      }

      if (result.actionType === 'iceShatter') {
        soundEffects.playIceShatter();
        haptics.win();
        const cellSize = 72;
        const padding = 18;
        const headX = arrow.head.col * cellSize + cellSize / 2 + padding;
        const headY = arrow.head.row * cellSize + cellSize / 2 + padding;
        particleController.burstEscape(headX, headY, '#38bdf8', 0);
        gameStateRef.current = nextState;
        setGameState(nextState);
        return;
      }

      if (result.actionType === 'pivotRotate') {
        soundEffects.playPivotRotate();
        haptics.tap();
        gameStateRef.current = nextState;
        setGameState(nextState);
        return;
      }

      if (result.actionType === 'bombDetonate') {
        soundEffects.playBombExplode();
        haptics.gameOver();
        const cellSize = 72;
        const padding = 18;
        const headX = arrow.head.col * cellSize + cellSize / 2 + padding;
        const headY = arrow.head.row * cellSize + cellSize / 2 + padding;
        particleController.burstEscape(headX, headY, '#f43f5e', 0);
        particleController.burstWin(currentState.board.cols * cellSize, currentState.board.rows * cellSize);

        gameStateRef.current = nextState;
        setGameState(nextState);

        if (nextState.status === 'won') {
          soundEffects.playWin();
          haptics.win();
          const starsEarned =
            nextState.movesCount <= currentState.level.parMoves
              ? 3
              : nextState.movesCount <= currentState.level.parMoves + 2
              ? 2
              : 1;
          const reward = currentState.level.rewardCoins ?? 50 + starsEarned * 25;
          setProgress((p) =>
            recordLevelCompletion(p, currentState.level.id, nextState.movesCount, starsEarned, reward)
          );
        }
        return;
      }

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

            const starsEarned =
              finalized.movesCount <= current.level.parMoves
                ? 3
                : finalized.movesCount <= current.level.parMoves + 2
                ? 2
                : 1;
            const reward = current.level.rewardCoins ?? 50 + starsEarned * 25;
            setProgress((p) =>
              recordLevelCompletion(p, current.level.id, finalized.movesCount, starsEarned, reward)
            );
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
    [isGameOver, isHammerActive, isBombActive, settings.zenMode, saveHistorySnapshot]
  );

  // ── BOOSTER TRIGGERS ──────────────────────────────────────────────────────
  const triggerHint = useCallback(() => {
    if ((progress.inventory?.hint ?? 0) <= 0) return;

    const current = gameStateRef.current;
    // Solve remaining puzzle moves directly from current runtime board state
    const solution = ArrowEscapeSolver.solveFromState(
      current.board,
      Array.from(current.arrows.values())
    );

    if (!solution.solvable || !solution.solutionMoves || solution.solutionMoves.length === 0) {
      soundEffects.playBlocked();
      haptics.blocked();
      return;
    }

    const nextArrowId = solution.solutionMoves[0];
    if (nextArrowId) {
      soundEffects.playHint();
      haptics.tap();
      const hintedState = GameEngine.executeHint(current, nextArrowId);
      gameStateRef.current = hintedState;
      setGameState(hintedState);

      // Decrement hint inventory
      setProgress((p) => {
        const nextInv = {
          hint: Math.max(0, (p.inventory?.hint ?? 3) - 1),
          hammer: p.inventory?.hammer ?? 2,
          bomb: p.inventory?.bomb ?? 2,
          undo: p.inventory?.undo ?? 3,
        };
        const updated = { ...p, inventory: nextInv };
        saveProgress(updated);
        return updated;
      });
    }
  }, [progress.inventory]);

  const triggerHammer = useCallback(() => {
    if ((progress.inventory?.hammer ?? 0) <= 0) return;
    soundEffects.playTap();
    haptics.tap();
    setIsBombActive(false);
    setIsHammerActive((prev) => !prev);
  }, [progress.inventory]);

  const triggerBomb = useCallback(() => {
    if ((progress.inventory?.bomb ?? 0) <= 0) return;
    soundEffects.playTap();
    haptics.tap();
    setIsHammerActive(false);
    setIsBombActive((prev) => !prev);
  }, [progress.inventory]);

  const cancelBoosterMode = useCallback(() => {
    setIsHammerActive(false);
    setIsBombActive(false);
  }, []);

  const triggerUndo = useCallback(() => {
    if ((progress.inventory?.undo ?? 0) <= 0) return;
    if (historyStackRef.current.length === 0) return;

    soundEffects.playTap();
    haptics.tap();

    // Cancel all in-flight animation timers
    activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    activeTimeoutsRef.current = [];
    isWinningPendingRef.current = false;
    isGameOverRef.current = false;
    setIsGameOver(false);
    setIsHammerActive(false);
    setIsBombActive(false);

    const previous = historyStackRef.current.pop();
    if (previous) {
      // Ensure restored state has clean idle / escaped arrows without dangling animation states
      const restoredArrows = new Map<string, ArrowModel>();
      for (const [id, a] of previous.state.arrows.entries()) {
        if (a.isEscaping) {
          restoredArrows.set(id, a.withState('escaped'));
        } else if (a.isBlocked) {
          restoredArrows.set(id, a.withState('idle'));
        } else {
          restoredArrows.set(id, a.withHinted(false));
        }
      }
      const restoredOccupancy = new OccupancyMap(Array.from(restoredArrows.values()));
      const restoredState: GameEngineState = {
        ...previous.state,
        arrows: restoredArrows,
        occupancy: restoredOccupancy,
        status: 'playing',
        lastResult: null,
      };

      gameStateRef.current = restoredState;
      setGameState(restoredState);
      livesRef.current = previous.lives;
      setLives(previous.lives);

      setProgress((p) => {
        const nextInv = {
          hint: p.inventory?.hint ?? 3,
          hammer: p.inventory?.hammer ?? 2,
          bomb: p.inventory?.bomb ?? 2,
          undo: Math.max(0, (p.inventory?.undo ?? 3) - 1),
        };
        const updated = { ...p, inventory: nextInv };
        saveProgress(updated);
        return updated;
      });
    }
  }, [progress.inventory]);

  // Buy booster pack with in-game coins
  const buyBooster = useCallback(
    (type: BoosterType): boolean => {
      const costs: Record<BoosterType, { coins: number; amount: number }> = {
        hint: { coins: 50, amount: 3 },
        hammer: { coins: 75, amount: 2 },
        bomb: { coins: 75, amount: 2 },
        undo: { coins: 50, amount: 3 },
      };

      const pack = costs[type];
      const currentCoins = progress.coins ?? 100;
      if (currentCoins < pack.coins) {
        soundEffects.playBlocked();
        haptics.blocked();
        return false;
      }

      soundEffects.playCoin();
      haptics.win();

      setProgress((p) => {
        const nextCoins = currentCoins - pack.coins;
        const nextInv = {
          hint: (p.inventory?.hint ?? 3) + (type === 'hint' ? pack.amount : 0),
          hammer: (p.inventory?.hammer ?? 2) + (type === 'hammer' ? pack.amount : 0),
          bomb: (p.inventory?.bomb ?? 2) + (type === 'bomb' ? pack.amount : 0),
          undo: (p.inventory?.undo ?? 3) + (type === 'undo' ? pack.amount : 0),
        };
        const updated = { ...p, coins: nextCoins, inventory: nextInv };
        saveProgress(updated);
        return updated;
      });

      return true;
    },
    [progress.coins]
  );

  // Claim free daily bonus coins
  const claimDailyReward = useCallback(() => {
    if (!canClaimDailyReward) return;
    soundEffects.playCoin();
    haptics.win();
    setCanClaimDailyReward(false);
    setProgress((p) => {
      const updated = { ...p, coins: (p.coins ?? 100) + 100 };
      saveProgress(updated);
      return updated;
    });
  }, [canClaimDailyReward]);

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
    isHammerActive,
    isBombActive,
    isShopOpen,
    canClaimDailyReward,
    allLevels: levelRegistry.getLevelMetadataList(),
    setIsSettingsOpen,
    setIsShopOpen,
    handleArrowTap,
    triggerHint,
    triggerHammer,
    triggerBomb,
    cancelBoosterMode,
    triggerUndo,
    buyBooster,
    claimDailyReward,
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
