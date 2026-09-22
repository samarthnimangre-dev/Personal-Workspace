'use client';

import React, { useState, useEffect } from 'react';
import {
  CAMPAIGN_LEVELS,
  generateSolvableLevel,
} from '@/lib/levels';
import { THEMES } from '@/lib/themes';
import { loadEconomy, saveEconomy } from '@/lib/storage';
import { UserEconomy, LevelConfig } from '@/types/game';
import { ArrowGameCanvas } from '@/components/ArrowGameCanvas';
import { GameHUD } from '@/components/GameHUD';
import { VictoryModal } from '@/components/VictoryModal';
import { ShopModal } from '@/components/ShopModal';
import { RewardedAdModal } from '@/components/RewardedAdModal';
import { ThemeSelectorModal } from '@/components/ThemeSelectorModal';
import { adManager } from '@/lib/ads';
import { sound } from '@/lib/audio';

export default function ArrowFlowHome() {
  const [economy, setEconomy] = useState<UserEconomy>(loadEconomy);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(CAMPAIGN_LEVELS[0]);
  const [isProcedural, setIsProcedural] = useState<boolean>(false);

  // Gameplay state
  const [movesCount, setMovesCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [remainingCount, setRemainingCount] = useState<number>(CAMPAIGN_LEVELS[0].arrows.length);
  const [totalCount, setTotalCount] = useState<number>(CAMPAIGN_LEVELS[0].arrows.length);
  const [isHammerMode, setIsHammerMode] = useState<boolean>(false);
  const [undoTrigger, setUndoTrigger] = useState<number>(0);
  const [hintTrigger, setHintTrigger] = useState<number>(0);
  const [magnetTrigger, setMagnetTrigger] = useState<number>(0);

  // Modals state
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync economy with localStorage
  useEffect(() => {
    saveEconomy(economy);
  }, [economy]);

  // Load level configuration
  useEffect(() => {
    let nextLvl: LevelConfig;
    if (isProcedural) {
      nextLvl = generateSolvableLevel(currentLevelIndex, 5, 5);
    } else {
      const found = CAMPAIGN_LEVELS.find((l) => l.id === currentLevelIndex);
      if (found) {
        nextLvl = found;
      } else {
        // Fallback to procedural beyond campaign
        nextLvl = generateSolvableLevel(currentLevelIndex, 6, 6);
      }
    }
    setCurrentLevel(nextLvl);
    setTotalCount(nextLvl.arrows.length);
    setRemainingCount(nextLvl.arrows.length);
    setMovesCount(0);
    setCombo(0);
    setIsHammerMode(false);
  }, [currentLevelIndex, isProcedural]);

  const activeTheme = THEMES[economy.activeTheme] || THEMES['cyber-neon'];

  // Level Complete Handler
  const handleLevelComplete = (moves: number, parMoves: number) => {
    const stars = moves <= parMoves ? 3 : moves <= parMoves + 2 ? 2 : 1;

    setEconomy((prev) => {
      const nextCompleted = Array.from(new Set([...prev.completedLevels, currentLevel.id]));
      return {
        ...prev,
        coins: prev.coins + currentLevel.rewardCoins,
        gems: prev.gems + currentLevel.rewardGems,
        completedLevels: nextCompleted,
        highScores: {
          ...prev.highScores,
          [currentLevel.id]: Math.max(prev.highScores[currentLevel.id] || 0, stars),
        },
      };
    });

    setIsVictoryOpen(true);
  };

  const handleNextLevel = () => {
    setIsVictoryOpen(false);
    setCurrentLevelIndex((prev) => prev + 1);
  };

  const handleWatchAdDouble = () => {
    setIsVictoryOpen(false);
    adManager.requestRewardedAd(
      () => {
        handleAdCompleted();
      },
      () => {
        setIsAdModalOpen(true);
      }
    );
  };

  const handleAdCompleted = () => {
    setIsAdModalOpen(false);
    setEconomy((prev) => ({
      ...prev,
      gems: prev.gems + 100,
      hammers: prev.hammers + 1,
      coins: prev.coins + currentLevel.rewardCoins,
    }));
  };

  const handleUseHint = () => {
    if (economy.hints <= 0) {
      setIsShopOpen(true);
      return;
    }
    setEconomy((prev) => ({ ...prev, hints: Math.max(0, prev.hints - 1) }));
    setHintTrigger((c) => c + 1);
  };

  const handleUseUndo = () => {
    if (economy.undos <= 0) {
      setIsShopOpen(true);
      return;
    }
    setEconomy((prev) => ({ ...prev, undos: Math.max(0, prev.undos - 1) }));
    setUndoTrigger((c) => c + 1);
    setRemainingCount((prev) => Math.min(totalCount, prev + 1));
  };

  const handleUseMagnet = () => {
    if (economy.magnets <= 0) {
      setIsShopOpen(true);
      return;
    }
    setEconomy((prev) => ({ ...prev, magnets: Math.max(0, prev.magnets - 1) }));
    setMagnetTrigger((c) => c + 1);
  };

  const handleToggleHammer = () => {
    if (!isHammerMode && economy.hammers <= 0) {
      setIsShopOpen(true);
      return;
    }
    if (isHammerMode) {
      setIsHammerMode(false);
    } else {
      setIsHammerMode(true);
      setEconomy((prev) => ({ ...prev, hammers: Math.max(0, prev.hammers - 1) }));
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMuted(!next);
  };

  const handleRestartLevel = () => {
    sound.playTap();
    setCurrentLevel({ ...currentLevel });
    setRemainingCount(currentLevel.arrows.length);
    setMovesCount(0);
    setCombo(0);
    setIsHammerMode(false);
  };

  return (
    <main
      className={`h-[100dvh] w-full flex flex-col items-center justify-between bg-gradient-to-b ${activeTheme.gradientBg} transition-colors duration-500 overflow-hidden select-none p-2 sm:p-4`}
    >
      {/* Top Game HUD Bar */}
      <GameHUD
        economy={economy}
        level={currentLevel}
        movesCount={movesCount}
        combo={combo}
        remainingCount={remainingCount}
        totalCount={totalCount}
        isHammerMode={isHammerMode}
        onToggleHammer={handleToggleHammer}
        onUseHint={handleUseHint}
        onUseUndo={handleUseUndo}
        onUseMagnet={handleUseMagnet}
        onRestartLevel={handleRestartLevel}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
      />

      {/* Center Tactile Physics Game Board */}
      <div className="flex-1 w-full max-w-xl flex items-center justify-center my-auto py-2">
        <ArrowGameCanvas
          level={currentLevel}
          theme={activeTheme}
          isHammerMode={isHammerMode}
          onDeactivateHammer={() => setIsHammerMode(false)}
          onLevelComplete={handleLevelComplete}
          onMoveMade={(count) => {
            setMovesCount(count);
            setRemainingCount((prev) => Math.max(0, prev - 1));
          }}
          onComboUpdate={(c) => setCombo(c)}
          onRequestHint={handleUseHint}
          onRequestUndo={handleUseUndo}
          undoTrigger={undoTrigger}
          hintTrigger={hintTrigger}
          magnetTrigger={magnetTrigger}
        />
      </div>

      {/* Minimal Footer: Level Selector Pill */}
      <footer className="w-full max-w-lg flex items-center justify-between px-3 py-1 pb-2">
        <select
          value={isProcedural ? 'procedural' : currentLevelIndex}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'procedural') {
              setIsProcedural(true);
            } else {
              setIsProcedural(false);
              setCurrentLevelIndex(Number(val));
            }
          }}
          className="bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-400"
        >
          {CAMPAIGN_LEVELS.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              Level {lvl.id}: {lvl.title} ({lvl.difficulty})
            </option>
          ))}
          <option value="procedural">⚡ Infinite Procedural Maze</option>
        </select>

        <span className="text-[10px] text-slate-500 font-medium">
          ArrowFlow • Tap unblocked arrows to escape
        </span>
      </footer>

      {/* Modals */}
      <VictoryModal
        level={currentLevel}
        moves={movesCount}
        isOpen={isVictoryOpen}
        onNextLevel={handleNextLevel}
        onWatchAdDouble={handleWatchAdDouble}
        onClose={() => setIsVictoryOpen(false)}
      />

      <ShopModal
        isOpen={isShopOpen}
        economy={economy}
        onUpdateEconomy={setEconomy}
        onClose={() => setIsShopOpen(false)}
      />

      <RewardedAdModal
        isOpen={isAdModalOpen}
        onAdCompleted={handleAdCompleted}
        onClose={() => setIsAdModalOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeSelectorOpen}
        economy={economy}
        onSelectTheme={(themeId) => {
          setEconomy((prev) => ({ ...prev, activeTheme: themeId }));
          setIsThemeSelectorOpen(false);
        }}
        onUnlockTheme={(themeId, costCoins, costGems) => {
          setEconomy((prev) => ({
            ...prev,
            coins: prev.coins - costCoins,
            gems: prev.gems - costGems,
            unlockedThemes: [...prev.unlockedThemes, themeId],
            activeTheme: themeId,
          }));
        }}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </main>
  );
}
