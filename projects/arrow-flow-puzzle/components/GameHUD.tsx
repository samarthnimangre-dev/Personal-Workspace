'use client';

import React from 'react';
import { UserEconomy, LevelConfig } from '@/types/game';
import {
  Coins,
  Gem,
  Lightbulb,
  Hammer,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Palette,
  RotateCw,
  Trophy,
} from 'lucide-react';
import { sound } from '@/lib/audio';

interface GameHUDProps {
  economy: UserEconomy;
  level: LevelConfig;
  movesCount: number;
  combo: number;
  remainingCount: number;
  totalCount: number;
  isHammerMode: boolean;
  onToggleHammer: () => void;
  onUseHint: () => void;
  onUseUndo: () => void;
  onUseMagnet: () => void;
  onRestartLevel: () => void;
  onOpenShop: () => void;
  onOpenThemeSelector: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  economy,
  level,
  movesCount,
  combo,
  remainingCount,
  totalCount,
  isHammerMode,
  onToggleHammer,
  onUseHint,
  onUseUndo,
  onUseMagnet,
  onRestartLevel,
  onOpenShop,
  onOpenThemeSelector,
  onToggleSound,
  soundEnabled,
}) => {
  const starsEarned =
    movesCount <= level.parMoves
      ? 3
      : movesCount <= level.parMoves + 2
      ? 2
      : movesCount <= level.parMoves + 4
      ? 1
      : 0;

  const progressPercent = Math.round(((totalCount - remainingCount) / Math.max(1, totalCount)) * 100);

  return (
    <div className="w-full max-w-lg flex flex-col gap-2.5 select-none px-3 pt-2">
      {/* Top Floating App Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2.5 px-3.5 shadow-xl">
        {/* Left: Quick Actions (Theme & Sound & Restart) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playTap();
              onOpenThemeSelector();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-all active:scale-90"
            title="Themes"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-all active:scale-90"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onRestartLevel();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all active:scale-90"
            title="Restart Puzzle"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Level Badge & Progress */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
              LEVEL {level.id}
            </span>
            {combo > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {combo}x COMBO
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
            {level.title}
          </span>
        </div>

        {/* Right: Currency Pill */}
        <button
          onClick={() => {
            sound.playTap();
            onOpenShop();
          }}
          className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-300 transition-all active:scale-95"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{economy.coins}</span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
            +
          </span>
        </button>
      </div>

      {/* Progress & Move Counter Sub-bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        {/* Moves & Star Goal */}
        <div className="flex items-center gap-2 text-slate-400">
          <span>
            Moves: <strong className="text-white font-bold">{movesCount}</strong>
            <span className="text-slate-500"> / {level.parMoves} par</span>
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={`text-xs ${
                  star <= starsEarned ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]' : 'text-slate-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Escape Counter */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>
            Remaining: <strong className="text-cyan-400 font-bold">{remainingCount}</strong>
          </span>
        </div>
      </div>

      {/* Progress Fill Bar */}
      <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Bottom Floating Booster Dock */}
      <div className="grid grid-cols-4 gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2 shadow-2xl mt-1">
        {/* 1. Hint Booster */}
        <button
          onClick={() => {
            sound.playTap();
            onUseHint();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-amber-500/20 hover:border-amber-400/60 transition-all active:scale-95 group relative"
        >
          <Lightbulb className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Hint</span>
          <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.hints}
          </span>
        </button>

        {/* 2. Undo Move */}
        <button
          onClick={() => {
            sound.playTap();
            onUseUndo();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-blue-500/20 hover:border-blue-400/60 transition-all active:scale-95 group relative"
        >
          <RotateCcw className="w-5 h-5 text-blue-400 group-hover:-rotate-45 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Undo</span>
          <span className="absolute -top-1.5 -right-1 bg-blue-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.undos}
          </span>
        </button>

        {/* 3. Super Magnet */}
        <button
          onClick={() => {
            sound.playTap();
            onUseMagnet();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-fuchsia-500/20 hover:border-fuchsia-400/60 transition-all active:scale-95 group relative"
        >
          <Sparkles className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-slate-300 mt-1">Magnet</span>
          <span className="absolute -top-1.5 -right-1 bg-fuchsia-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.magnets}
          </span>
        </button>

        {/* 4. Hammer Booster */}
        <button
          onClick={() => {
            sound.playTap();
            onToggleHammer();
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 group relative ${
            isHammerMode
              ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-slate-800/60 hover:bg-slate-800/90 border-rose-500/20 hover:border-rose-400/60'
          }`}
        >
          <Hammer
            className={`w-5 h-5 ${
              isHammerMode
                ? 'text-rose-400'
                : 'text-rose-400 group-hover:scale-110 transition-transform'
            }`}
          />
          <span className="text-[10px] font-medium text-slate-300 mt-1">
            {isHammerMode ? 'Cancel' : 'Hammer'}
          </span>
          <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 shadow">
            {economy.hammers}
          </span>
        </button>
      </div>
    </div>
  );
};
