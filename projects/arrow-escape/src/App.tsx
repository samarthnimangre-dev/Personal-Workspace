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
    allLevels,
    setIsSettingsOpen,
    handleArrowTap,
    restartCurrentLevel,
    advanceToNextLevel,
    selectLevel,
    continueInZenMode,
    toggleSound,
    toggleHaptics,
    toggleTheme,
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
      allLevels={allLevels}
      onArrowTap={handleArrowTap}
      onRestart={restartCurrentLevel}
      onNextLevel={advanceToNextLevel}
      onSelectLevel={selectLevel}
      onContinueZen={continueInZenMode}
      onToggleSound={toggleSound}
      onToggleHaptics={toggleHaptics}
      onToggleTheme={toggleTheme}
      onToggleZenMode={toggleZenMode}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onCloseSettings={() => setIsSettingsOpen(false)}
    />
  );
};

export default App;
