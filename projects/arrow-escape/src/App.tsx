// Main application entry component connecting the state hook with responsive GameView
import React from 'react';
import { useGameState } from './hooks/useGameState';
import { GameView } from './components/GameView';

export const App: React.FC = () => {
  const {
    gameState,
    progress,
    settings,
    lives,
    maxLives,
    isGameOver,
    isSettingsOpen,
    isHammerActive,
    isBombActive,
    isShopOpen,
    canClaimDailyReward,
    allLevels,
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
    selectLevel,
    continueInZenMode,
    toggleSound,
    toggleHaptics,
    toggleTheme,
    toggleGridDots,
    toggleZenMode,
  } = useGameState();


  return (
    <GameView
      state={gameState}
      progress={progress}
      settings={settings}
      lives={lives}
      maxLives={maxLives}
      isGameOver={isGameOver}
      isSettingsOpen={isSettingsOpen}
      isHammerActive={isHammerActive}
      isBombActive={isBombActive}
      isShopOpen={isShopOpen}
      canClaimDailyReward={canClaimDailyReward}
      allLevels={allLevels}
      onArrowTap={handleArrowTap}
      onTriggerHint={triggerHint}
      onTriggerHammer={triggerHammer}
      onTriggerBomb={triggerBomb}
      onTriggerUndo={triggerUndo}
      onCancelBooster={cancelBoosterMode}
      onOpenShop={() => setIsShopOpen(true)}
      onCloseShop={() => setIsShopOpen(false)}
      onBuyBooster={buyBooster}
      onClaimDailyReward={claimDailyReward}
      onRestart={restartCurrentLevel}
      onNextLevel={advanceToNextLevel}
      onSelectLevel={selectLevel}
      onContinueZen={continueInZenMode}
      onToggleSound={toggleSound}
      onToggleHaptics={toggleHaptics}
      onToggleTheme={toggleTheme}
      onToggleGridDots={toggleGridDots}
      onToggleZenMode={toggleZenMode}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onCloseSettings={() => setIsSettingsOpen(false)}
    />
  );
};


export default App;
