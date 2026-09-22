// Responsive portrait game view container with top metrics HUD and bottom actions
import React from 'react';
import type { GameEngineState } from '../engine/GameEngine';
import type { LevelData, UserProgress } from '../engine/types';
import { SvgBoard } from './SvgBoard';

interface GameViewProps {
  state: GameEngineState;
  progress: UserProgress;
  allLevels: readonly LevelData[];
  onArrowTap: (arrowId: string) => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onSelectLevel: (levelId: number) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  state,
  allLevels,
  onArrowTap,
  onRestart,
  onNextLevel,
  onSelectLevel,
}) => {
  const { level, board, arrows, movesCount, status } = state;
  const arrowsList = Array.from(arrows.values());
  const activeCount = arrowsList.filter((a) => !a.isEscaped).length;
  const totalCount = level.arrows.length;

  // Star rating calculation based on moves vs par
  const starsEarned =
    movesCount <= level.parMoves
      ? 3
      : movesCount <= level.parMoves + 2
      ? 2
      : movesCount <= level.parMoves + 4
      ? 1
      : 0;

  return (
    <div className="game-container flex flex-col justify-between items-center w-full max-w-md mx-auto min-h-[100dvh] p-4 select-none">
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 shadow-lg">
        {/* Level Title & Progress */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              Level {level.id}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {activeCount} / {totalCount} Remaining
            </span>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">{level.name}</h1>
        </div>

        {/* Moves & Quick Reset */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400">Moves</span>
            <span className="text-sm font-black text-white">
              {movesCount}
              <span className="text-xs text-slate-500 font-normal"> / {level.parMoves} par</span>
            </span>
          </div>

          <button
            onClick={onRestart}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Restart Puzzle"
            aria-label="Restart current level"
          >
            ↻
          </button>
        </div>
      </header>

      {/* Main Center Stage: SVG Board */}
      <main className="flex-1 w-full flex items-center justify-center my-auto py-2">
        <SvgBoard
          board={board}
          arrows={arrowsList}
          onArrowTap={onArrowTap}
        />
      </main>

      {/* Bottom Footer & Level Switcher */}
      <footer className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 px-3">
        <select
          value={level.id}
          onChange={(e) => onSelectLevel(Number(e.target.value))}
          className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-400"
          aria-label="Select puzzle level"
        >
          {allLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              Level {lvl.id}: {lvl.name} ({lvl.rows}x{lvl.cols})
            </option>
          ))}
        </select>

        <span className="text-[11px] text-slate-400 font-medium">
          Tap unblocked arrows to escape
        </span>
      </footer>

      {/* Victory Modal Overlay */}
      {status === 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-2 text-2xl">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={star <= starsEarned ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-slate-700'}
                >
                  ★
                </span>
              ))}
            </div>

            <h2 className="text-xl font-black text-white mb-1">PUZZLE ESCAPED!</h2>
            <p className="text-xs text-slate-400 mb-6">
              Cleared in <strong className="text-cyan-400">{movesCount} moves</strong> (Par: {level.parMoves})
            </p>

            <button
              onClick={onNextLevel}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
            >
              Next Level ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
