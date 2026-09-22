// React hook managing game engine lifecycle, animations, and progress persistence
import { useState, useEffect, useCallback, useRef } from 'react';
import type { LevelData } from '../engine/types';
import { GameEngine, type GameEngineState } from '../engine/GameEngine';
import { DEFAULT_LEVELS } from '../engine/BoardModel';
import { loadProgress, recordLevelCompletion } from '../persistence/storage';

export function useGameState(initialLevelId: number = 1) {
  const [progress, setProgress] = useState(loadProgress);
  const [currentLevelId, setCurrentLevelId] = useState<number>(initialLevelId);

  // Find level configuration or default to level 1
  const levelData: LevelData =
    DEFAULT_LEVELS.find((l) => l.id === currentLevelId) ?? DEFAULT_LEVELS[0];

  const [gameState, setGameState] = useState<GameEngineState>(() =>
    GameEngine.createInitialState(levelData)
  );

  const activeTimeoutsRef = useRef<number[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Initialize new level
  const loadLevel = useCallback((lvlId: number) => {
    activeTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    activeTimeoutsRef.current = [];

    const targetLevel = DEFAULT_LEVELS.find((l) => l.id === lvlId) ?? DEFAULT_LEVELS[0];
    setCurrentLevelId(targetLevel.id);
    setGameState(GameEngine.createInitialState(targetLevel));
  }, []);

  // Handle arrow tap with animation delays
  const handleArrowTap = useCallback((arrowId: string) => {
    setGameState((prev) => {
      const { nextState, result } = GameEngine.executeTap(prev, arrowId);

      if (result.success) {
        // Trigger completion after escape animation
        const timer = window.setTimeout(() => {
          setGameState((s) => {
            const finalized = GameEngine.finalizeEscape(s, arrowId);
            if (finalized.status === 'won') {
              setProgress((p) => recordLevelCompletion(p, s.level.id, finalized.movesCount));
            }
            return finalized;
          });
        }, 300);
        activeTimeoutsRef.current.push(timer);
      } else if (result.blockerId || !result.success) {
        // Reset blocked shake state after animation
        const timer = window.setTimeout(() => {
          setGameState((s) => GameEngine.resetBlockedState(s, arrowId));
        }, 360);
        activeTimeoutsRef.current.push(timer);
      }

      return nextState;
    });
  }, []);

  const restartCurrentLevel = useCallback(() => {
    loadLevel(currentLevelId);
  }, [currentLevelId, loadLevel]);

  const advanceToNextLevel = useCallback(() => {
    const nextId = currentLevelId < DEFAULT_LEVELS.length ? currentLevelId + 1 : 1;
    loadLevel(nextId);
  }, [currentLevelId, loadLevel]);

  return {
    gameState,
    progress,
    currentLevelId,
    allLevels: DEFAULT_LEVELS,
    handleArrowTap,
    restartCurrentLevel,
    advanceToNextLevel,
    selectLevel: loadLevel,
  };
}
