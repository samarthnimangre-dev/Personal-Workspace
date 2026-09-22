'use client';

import React from 'react';
import { Star, Coins, Gem, ArrowRight, Tv } from 'lucide-react';
import { LevelConfig } from '@/types/game';
import { sound } from '@/lib/audio';

interface VictoryModalProps {
  level: LevelConfig;
  moves: number;
  isOpen: boolean;
  onNextLevel: () => void;
  onWatchAdDouble: () => void;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  moves,
  isOpen,
  onNextLevel,
  onWatchAdDouble,
  onClose,
}) => {
  if (!isOpen) return null;

  // Star calculation
  const stars = moves <= level.parMoves ? 3 : moves <= level.parMoves + 2 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Stars */}
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3].map((starIndex) => (
            <Star
              key={starIndex}
              className={`w-10 h-10 transition-transform ${
                starIndex <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-110'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-1">
          LEVEL COMPLETED!
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Solved in <strong className="text-cyan-400">{moves} moves</strong> (Par: {level.parMoves})
        </p>

        {/* Rewards Box */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-around mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Coins</span>
              <span className="text-lg font-black text-amber-300">+{level.rewardCoins}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Gem className="w-6 h-6 text-fuchsia-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gems</span>
              <span className="text-lg font-black text-fuchsia-300">+{level.rewardGems}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Double Rewards Ad Button */}
          <button
            onClick={() => {
              sound.playTap();
              onWatchAdDouble();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 group"
          >
            <Tv className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Watch 5s Ad for 2X Double Rewards!</span>
          </button>

          {/* Next Level Button */}
          <button
            onClick={() => {
              sound.playTap();
              onNextLevel();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all active:scale-95"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
