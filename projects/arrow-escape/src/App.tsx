// Main application entry component connecting the state hook with responsive GameView
import React from 'react';
import { useGameState } from './hooks/useGameState';
import { GameView } from './components/GameView';

export const App: React.FC = () => {
  const {
    gameState,
    progress,
    allLevels,
    handleArrowTap,
    restartCurrentLevel,
    advanceToNextLevel,
    selectLevel,
  } = useGameState();

  return (
    <GameView
      state={gameState}
      progress={progress}
      allLevels={allLevels}
      onArrowTap={handleArrowTap}
      onRestart={restartCurrentLevel}
      onNextLevel={advanceToNextLevel}
      onSelectLevel={selectLevel}
    />
  );
};

export default App;
